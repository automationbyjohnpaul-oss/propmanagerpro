import { Prisma } from "../generated/prisma";
import { prisma } from "../lib/prisma";

export async function getAllPayments() {
  return prisma.payment.findMany({
    orderBy: { paymentDate: "desc" },
    include: {
      lease: true,
      tenant: true,
    },
  });
}

export async function getPaymentById(id: string) {
  return prisma.payment.findUnique({
    where: { id },
    include: {
      lease: true,
      tenant: true,
    },
  });
}

export async function createPayment(data: {
  amount: number;
  paymentDate?: string;
  method: "cash" | "bank_transfer" | "card" | "check";
  status: "pending" | "completed" | "failed" | "refunded";
  reference?: string;
  notes?: string;
  leaseId: string;
  tenantId: string;
}) {
  return prisma.payment.create({
    data: {
      amount: new Prisma.Decimal(data.amount),
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      method: data.method,
      status: data.status,
      reference: data.reference,
      notes: data.notes,
      leaseId: data.leaseId,
      tenantId: data.tenantId,
    },
    include: {
      lease: true,
      tenant: true,
    },
  });
}

export async function updatePayment(
  id: string,
  data: {
    amount?: number;
    paymentDate?: string;
    method?: "cash" | "bank_transfer" | "card" | "check";
    status?: "pending" | "completed" | "failed" | "refunded";
    reference?: string;
    notes?: string;
    leaseId?: string;
    tenantId?: string;
  },
) {
  return prisma.payment.update({
    where: { id },
    data: {
      ...(data.amount !== undefined && {
        amount: new Prisma.Decimal(data.amount),
      }),
      ...(data.paymentDate !== undefined && {
        paymentDate: new Date(data.paymentDate),
      }),
      ...(data.method !== undefined && { method: data.method }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.reference !== undefined && { reference: data.reference }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.leaseId !== undefined && { leaseId: data.leaseId }),
      ...(data.tenantId !== undefined && { tenantId: data.tenantId }),
    },
    include: {
      lease: true,
      tenant: true,
    },
  });
}
