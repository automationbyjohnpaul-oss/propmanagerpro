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
  status?: "pending" | "completed" | "failed" | "refunded";
  reference?: string;
  notes?: string;
  leaseId?: string;
  tenantId?: string;
}

export async function getPayments(): Promise<Payment[]> {
  return api.get("/api/payments");
}

export async function getPayment(id: string): Promise<Payment> {
  return api.get(`/api/payments/${id}`);
}

export async function createPayment(
  data: CreatePaymentInput,
): Promise<Payment> {
  return api.post("/api/payments", data);
}

export async function updatePayment(
  id: string,
  data: UpdatePaymentInput,
): Promise<Payment> {
  return api.put(`/api/payments/${id}`, data);
}
