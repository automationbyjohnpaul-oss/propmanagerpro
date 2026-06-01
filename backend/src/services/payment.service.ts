import { Prisma } from "../generated/prisma";
import { prisma } from "../lib/prisma";

export async function getAllPayments(userId: string) {
  return prisma.payment.findMany({
    where: {
      lease: {
        property: { userId },
      },
    },
    orderBy: { paymentDate: "desc" },
    include: {
      lease: true,
      tenant: true,
    },
  });
}

export async function getPaymentById(id: string, userId: string) {
  return prisma.payment.findFirst({
    where: {
      id,
      lease: {
        property: { userId },
      },
    },
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
  userId: string,
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
  const payment = await prisma.payment.findFirst({
    where: {
      id,
      lease: {
        property: { userId },
      },
    },
  });

  if (!payment) throw new Error("Payment not found");

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

export async function deletePayment(id: string, userId: string) {
  const payment = await prisma.payment.findFirst({
    where: {
      id,
      lease: {
        property: { userId },
      },
    },
  });

  if (!payment) throw new Error("Payment not found");

  // NOTE: Per schema philosophy — never delete payments, void them instead.
  // But if you must delete, this is scoped to user's properties.
  return prisma.payment.delete({
    where: { id },
  });
}
