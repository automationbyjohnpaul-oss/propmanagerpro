import { createHash } from "node:crypto";
import { PaymentCreateRequest, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { PaymentRequestError } from "../lib/paymentRequestError";
import { CreatePaymentInput } from "../validators/payment.validator";

export const PAYMENT_REQUEST_VERSION = 1;
export const PAYMENT_TRANSACTION_TIMEOUT_MS = 10_000;
const CLAIM_LOCK_TIMEOUT = "2s";
const RETRY_AFTER_SECONDS = 2;

// Only a uniqueness failure at the claim insert can trigger replay lookup.
export class PaymentRequestAlreadyClaimed extends Error {}

export function parsePaymentRequestKey(value: string | undefined): string {
  const parsed = z.string().uuid().safeParse(value);
  if (!parsed.success) {
    throw new PaymentRequestError(
      "IDEMPOTENCY_KEY_INVALID",
      "A UUID Idempotency-Key is required to record a payment.",
      400,
      "key",
    );
  }
  return parsed.data.toLowerCase();
}

export function fingerprintPaymentRequest(data: CreatePaymentInput): string {
  // Fixed order and tagged omissions are part of the durable v1 contract.
  // Never hash a fresh date default or compare against a mutable payment row.
  const optional = (value: string | undefined) =>
    value === undefined ? ["omitted"] : ["provided", value];
  return createHash("sha256").update(JSON.stringify([
    PAYMENT_REQUEST_VERSION,
    new Prisma.Decimal(data.amount).toString(),
    optional(data.paymentDate?.toISOString()),
    data.status,
    data.method,
    data.leaseId,
    data.tenantId,
    optional(data.reference),
    optional(data.notes),
  ])).digest("hex");
}

export async function claimPaymentRequest(
  tx: Prisma.TransactionClient,
  userId: string,
  requestKey: string,
  fingerprint: string,
): Promise<void> {
  const [previous] = await tx.$queryRaw<{ value: string }[]>`
    SELECT current_setting('lock_timeout') AS value
  `;
  await tx.$queryRaw`SELECT set_config('lock_timeout', ${CLAIM_LOCK_TIMEOUT}, true)`;
  try {
    // First data write. Completion fields stay NULL until payment/audit succeed.
    await tx.$executeRaw`
      INSERT INTO payment_create_requests
        ("userId", "requestKey", "fingerprintVersion", "requestFingerprint")
      VALUES (${userId}, ${requestKey}::uuid, ${PAYMENT_REQUEST_VERSION}, ${fingerprint})
    `;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2010") {
      if (error.meta?.code === "23505") throw new PaymentRequestAlreadyClaimed();
      if (error.meta?.code === "55P03") {
        throw new PaymentRequestError(
          "IDEMPOTENCY_CLAIM_TIMEOUT",
          "Payment request could not acquire a lock. Retry with the same key and details.",
          503,
          "claim",
          RETRY_AFTER_SECONDS,
        );
      }
    }
    throw error;
  }
  // Restore the effective value, not DEFAULT (which could discard an override).
  // On insert failure, rollback restores it; do not query an aborted transaction.
  await tx.$queryRaw`SELECT set_config('lock_timeout', ${previous.value}, true)`;
}

const id = z.string().min(1);
const timestamp = z.string().datetime();
const storedPaymentSchema = z.object({
  id,
  amount: z.string().refine(value => {
    try { const amount = new Prisma.Decimal(value); return amount.isFinite() && amount.isPositive(); }
    catch { return false; }
  }),
  paymentDate: timestamp,
  method: z.enum(["cash", "bank_transfer", "card", "check"]),
  status: z.enum(["pending", "completed", "failed"]),
  reference: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: timestamp,
  updatedAt: timestamp,
  leaseId: id,
  tenantId: id,
  lease: z.object({ id, tenantId: id, propertyId: id }).passthrough(),
  tenant: z.object({ id, userId: id, firstName: z.string(), lastName: z.string() }).passthrough(),
}).passthrough();

function verifyCompletedRequest(
  record: PaymentCreateRequest,
  phase: "replay" | "finalize",
): Prisma.JsonObject {
  const body = storedPaymentSchema.safeParse(record.responseBody);
  if (!record.paymentId || record.responseStatus !== 201 || !body.success ||
      body.data.id !== record.paymentId || body.data.lease.id !== body.data.leaseId ||
      body.data.tenant.id !== body.data.tenantId || body.data.lease.tenantId !== body.data.tenantId ||
      body.data.tenant.userId !== record.userId || !/^[a-f0-9]{64}$/.test(record.requestFingerprint)) {
    throw new PaymentRequestError(
      "IDEMPOTENCY_RECORD_INCOMPLETE",
      "Payment result requires investigation. Keep this request; do not submit it as a new payment.",
      500,
      phase,
    );
  }
  // Return the original JSON, not Zod's parsed projection or current payment state.
  return record.responseBody as Prisma.JsonObject;
}

export async function completePaymentRequest(
  tx: Prisma.TransactionClient,
  userId: string,
  requestKey: string,
  paymentId: string,
  payment: unknown,
): Promise<Prisma.JsonObject> {
  const responseBody = JSON.parse(JSON.stringify(payment)) as Prisma.InputJsonObject;
  const record = await tx.paymentCreateRequest.update({
    where: { userId_requestKey: { userId, requestKey } },
    data: { paymentId, responseStatus: 201, responseBody },
  });
  return verifyCompletedRequest(record, "finalize");
}

export async function replayPaymentRequest(
  userId: string,
  requestKey: string,
  fingerprint: string,
): Promise<Prisma.JsonObject> {
  // Called only after the claiming transaction has rolled back.
  const record = await prisma.paymentCreateRequest.findUnique({
    where: { userId_requestKey: { userId, requestKey } },
  });
  if (!record) {
    throw new PaymentRequestError("IDEMPOTENCY_RECORD_MISSING",
      "Payment result requires investigation. Keep this request; do not submit it as a new payment.",
      500, "replay");
  }
  const body = verifyCompletedRequest(record, "replay");
  if (record.fingerprintVersion !== PAYMENT_REQUEST_VERSION) {
    throw new PaymentRequestError("IDEMPOTENCY_FINGERPRINT_VERSION_UNSUPPORTED",
      "Payment result requires investigation. Keep this request; do not submit it as a new payment.",
      500, "replay");
  }
  const accessible = await prisma.payment.findFirst({
    where: { id: record.paymentId!, lease: { property: { userId, deletedAt: null } } },
    select: { id: true },
  });
  if (!accessible) {
    throw new PaymentRequestError("PAYMENT_NOT_FOUND", "Payment not found", 404, "replay");
  }
  if (record.requestFingerprint !== fingerprint) {
    throw new PaymentRequestError("IDEMPOTENCY_PAYLOAD_MISMATCH",
      "This request key was already used with different payment details.", 409, "replay");
  }
  // Creation-time snapshot: subsequent legitimate edits do not change this replay.
  return body;
}
