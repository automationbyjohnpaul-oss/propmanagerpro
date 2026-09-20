// frontend/src/services/paymentApi.ts
import { api } from "./api";

export interface Payment {
  id: string;
  amount: number | string;
  paymentDate: string;
  method: "cash" | "bank_transfer" | "card" | "check";
  status: "pending" | "completed" | "failed" | "refunded";
  reference?: string;
  notes?: string;
  leaseId: string;
  tenantId: string;
  lease?: { id: string };
  tenant?: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentInput {
  amount: number;
  paymentDate?: string;
  method: "cash" | "bank_transfer" | "card" | "check";
  status: "pending" | "completed" | "failed" | "refunded";
  reference?: string;
  notes?: string;
  leaseId: string;
  tenantId: string;
}

export interface UpdatePaymentInput {
  amount?: number;
  paymentDate?: string;
  method?: "cash" | "bank_transfer" | "card" | "check";
  reference?: string;
  notes?: string;
  // Status, leaseId, tenantId are intentionally excluded - they are immutable
}

export async function getPayments(): Promise<Payment[]> {
  return api.get("/api/payments");
}

export async function getPayment(id: string): Promise<Payment> {
  return api.get(`/api/payments/${id}`);
}

export async function createPayment(
  data: CreatePaymentInput,
  requestKey: string,
  token: string,
): Promise<Payment> {
  const payment = await api.post<unknown>("/api/payments", data, undefined, {
    "Idempotency-Key": requestKey,
    Authorization: `Bearer ${token}`,
  });
  // A malformed 2xx must not erase the only local evidence of an uncertain result.
  if (!payment || typeof payment !== "object") throw new Error("Payment confirmation was unreadable. Retry the saved payment.");
  const value = payment as Record<string, unknown>;
  const validDate = (date: unknown) => typeof date === "string" && Number.isFinite(Date.parse(date));
  if (typeof value.id !== "string" || !value.id ||
      value.leaseId !== data.leaseId || value.tenantId !== data.tenantId ||
      (typeof value.amount !== "string" && typeof value.amount !== "number") || Number(value.amount) !== data.amount ||
      value.method !== data.method || value.status !== data.status ||
      value.reference !== (data.reference ?? null) || value.notes !== (data.notes ?? null) ||
      !validDate(value.paymentDate) || !validDate(value.createdAt) || !validDate(value.updatedAt) ||
      (data.paymentDate !== undefined && new Date(value.paymentDate as string).toISOString() !== new Date(data.paymentDate).toISOString())) {
    throw new Error("Payment confirmation did not match the saved request. Keep it for recovery.");
  }
  return payment as Payment;
}

export async function updatePayment(
  id: string,
  data: UpdatePaymentInput,
): Promise<Payment> {
  return api.put(`/api/payments/${id}`, data);
}

// REMOVED: deletePayment - payments should never be deleted
