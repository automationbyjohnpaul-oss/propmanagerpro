import { getToken, getUser } from "./auth";
import { ApiError } from "../services/api";
import { createPayment, type CreatePaymentInput, type Payment } from "../services/paymentApi";

const PREFIX = "propmanager_payment_attempt:v1:";
export const PAYMENT_RECOVERY_EVENT = "propmanager-payment-recovery";
function notify() { window.dispatchEvent(new Event(PAYMENT_RECOVERY_EVENT)); }
async function withPaymentLock<T>(userId: string, action: () => Promise<T>): Promise<T> {
  assertOwner(userId);
  if (!navigator.locks) throw new Error("This browser cannot safely coordinate payment recovery. Use a current browser over HTTPS or localhost.");
  return navigator.locks.request(`propmanager-payment:${userId}`, { ifAvailable: true }, async (lock) => {
    if (!lock) throw new Error("A payment action is running in another tab. Wait for it to finish, then review this saved attempt.");
    assertOwner(userId);
    return action();
  });
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export interface PaymentAttempt {
  version: 1;
  userId: string;
  key: string;
  createdAt: string;
  data: CreatePaymentInput;
}
export interface RecoveryBlock { code: string; message: string }

function ownerPrefix(userId: string) { return `${PREFIX}${encodeURIComponent(userId)}:`; }
function storageKey(userId: string, key: string) { return `${ownerPrefix(userId)}${key}`; }
function assertOwner(userId: string): string {
  const token = getToken();
  if (!token || getUser()?.id !== userId) throw new Error("Your account changed. Sign in to the original account to recover this payment.");
  return token;
}
function storage(): Storage { return window.localStorage; }
function isResolved(name: string): boolean {
  const raw = storage().getItem(`${name}:resolved`);
  if (raw === null) return false;
  const marker = JSON.parse(raw) as { outcome?: unknown; resolvedAt?: unknown };
  if (!marker || typeof marker.outcome !== "string" || !marker.outcome ||
      typeof marker.resolvedAt !== "string" || !Number.isFinite(Date.parse(marker.resolvedAt))) {
    throw new Error("Saved payment resolution needs investigation. Keep the original request.");
  }
  return true;
}
function readAttempt(raw: string, userId: string, key: string): PaymentAttempt {
  const value = JSON.parse(raw) as PaymentAttempt;
  const data = value?.data;
  if (value?.version !== 1 || value.userId !== userId || value.key !== key || !UUID.test(key) ||
      !Number.isFinite(Date.parse(value.createdAt)) || !data ||
      !Number.isFinite(data.amount) || data.amount <= 0 || data.amount > 999999 ||
      !["cash", "bank_transfer", "card", "check"].includes(data.method) ||
      !["pending", "completed", "failed"].includes(data.status) ||
      typeof data.leaseId !== "string" || !data.leaseId || typeof data.tenantId !== "string" || !data.tenantId ||
      (data.paymentDate !== undefined && (typeof data.paymentDate !== "string" || !Number.isFinite(Date.parse(data.paymentDate)))) ||
      (data.reference !== undefined && typeof data.reference !== "string") ||
      (data.notes !== undefined && typeof data.notes !== "string")) {
    throw new Error("Saved payment details need investigation. They have been preserved; do not record a replacement.");
  }
  return value;
}

export function listPaymentAttempts(userId: string): PaymentAttempt[] {
  assertOwner(userId);
  const store = storage();
  const prefix = ownerPrefix(userId);
  const attempts: PaymentAttempt[] = [];
  for (let index = 0; index < store.length; index++) {
    const name = store.key(index);
    if (!name?.startsWith(prefix)) continue;
    const key = name.slice(prefix.length);
    if (key.endsWith(":resolved") || key.endsWith(":blocked")) continue;
    if (isResolved(name)) continue;
    const raw = store.getItem(name);
    if (raw !== null) attempts.push(readAttempt(raw, userId, key));
  }
  return attempts.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function preparePaymentAttempt(userId: string, data: CreatePaymentInput): PaymentAttempt {
  assertOwner(userId);
  if (listPaymentAttempts(userId).length) throw new Error("Resolve your saved payment attempt before recording another payment.");
  const key = crypto.randomUUID();
  const attempt: PaymentAttempt = {
    version: 1, userId, key, createdAt: new Date().toISOString(),
    data: {
      amount: data.amount, method: data.method, status: data.status,
      leaseId: data.leaseId, tenantId: data.tenantId,
      ...(data.paymentDate === undefined ? {} : { paymentDate: new Date(data.paymentDate).toISOString() }),
      ...(data.reference === undefined ? {} : { reference: data.reference }),
      ...(data.notes === undefined ? {} : { notes: data.notes }),
    },
  };
  const raw = JSON.stringify(attempt);
  const checked = readAttempt(raw, userId, key);
  // Storage failures propagate BEFORE fetch. Never send an untracked attempt.
  const name = storageKey(userId, key);
  try {
    storage().setItem(name, raw);
    if (storage().getItem(name) !== raw) throw new Error("Recovery write verification failed");
  } catch {
    throw new Error("Could not save payment recovery details. Nothing was submitted. Check available browser storage before trying again.");
  }
  notify();
  return checked;
}

export function getRecoveryBlock(userId: string, key: string): RecoveryBlock | null {
  assertOwner(userId);
  const raw = storage().getItem(`${storageKey(userId, key)}:blocked`);
  if (raw === null) return null;
  const value = JSON.parse(raw) as RecoveryBlock;
  if (typeof value?.code !== "string" || typeof value.message !== "string") throw new Error("Saved recovery status needs investigation.");
  return value;
}

function finishAttempt(userId: string, key: string, outcome: string) {
  const store = storage();
  const name = storageKey(userId, key);
  // Minimal tombstone wins over stale tabs/late failures; it contains no payment details.
  // Write and verify it BEFORE removing the original evidence. No TTL.
  const marker = JSON.stringify({ outcome, resolvedAt: new Date().toISOString() });
  store.setItem(`${name}:resolved`, marker);
  if (store.getItem(`${name}:resolved`) !== marker) throw new Error("Could not save the resolution. Keep the original request for recovery.");
  store.removeItem(name);
  store.removeItem(`${name}:blocked`);
  notify();
}

export async function reconcilePaymentAttempt(userId: string, key: string, outcome: "already-recorded" | "not-recorded") {
  return withPaymentLock(userId, async () => {
  assertOwner(userId);
  const raw = storage().getItem(storageKey(userId, key));
  if (!raw) throw new Error("This saved attempt is no longer available. Refresh the page.");
  readAttempt(raw, userId, key);
  finishAttempt(userId, key, outcome);
  });
}

async function sendSavedPayment(userId: string, key: string): Promise<Payment> {
  const token = assertOwner(userId);
  const store = storage();
  const name = storageKey(userId, key);
  if (isResolved(name)) throw new Error("This attempt was already resolved in another tab. Refresh the page.");
  const raw = store.getItem(name);
  if (!raw) throw new Error("Saved payment details are missing. Nothing was submitted.");
  const attempt = readAttempt(raw, userId, key);
  const block = getRecoveryBlock(userId, key);
  if (block) throw new Error(block.message);
  let payment: Payment;
  try {
    // Capture the original account's token; an account switch during fetch must
    // never redirect this attempt to the newly signed-in account.
    payment = await createPayment(attempt.data, attempt.key, token);
  } catch (error) {
    if (error instanceof ApiError &&
        (error.status === 400 || error.code === "IDEMPOTENCY_PAYLOAD_MISMATCH" ||
         error.code?.startsWith("IDEMPOTENCY_RECORD_") || error.code === "IDEMPOTENCY_FINGERPRINT_VERSION_UNSUPPORTED")) {
      const block: RecoveryBlock = { code: error.code ?? "PAYMENT_VALIDATION_REJECTED", message: "This saved payment needs review. Check payment records before reconciling it; do not record a replacement while its outcome is uncertain." };
      // Never recreate removed payloads. A resolution marker always takes precedence.
      if (store.getItem(name) !== null && store.getItem(`${name}:resolved`) === null) {
        store.setItem(`${name}:blocked`, JSON.stringify(block));
        notify();
      }
    }
    throw error;
  }
  // Confirmation was validated by paymentApi. Clear only this owner's attempt.
  finishAttempt(userId, key, payment.id);
  return payment;
}

export function submitSavedPayment(userId: string, key: string): Promise<Payment> {
  return withPaymentLock(userId, () => sendSavedPayment(userId, key));
}

export function startPayment(userId: string, data: CreatePaymentInput): Promise<Payment> {
  return withPaymentLock(userId, async () => {
    const attempt = preparePaymentAttempt(userId, data);
    return sendSavedPayment(userId, attempt.key);
  });
}
