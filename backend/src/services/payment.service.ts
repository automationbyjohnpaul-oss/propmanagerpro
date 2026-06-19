import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export async function createPayment(userId: string, data: any) {
  // 1. Verify lease ownership
  const lease = await prisma.lease.findFirst({
    where: {
      id: data.leaseId,
      property: {
        userId,
        deletedAt: null,
      },
    },
  });

  if (!lease) {
    throw new Error("Lease not found or access denied");
  }

  // 2. Verify tenant ownership
  const tenant = await prisma.tenant.findFirst({
    where: {
      id: data.tenantId,
      userId,
    },
  });

  if (!tenant) {
    throw new Error("Tenant not found or access denied");
  }

  // 3. Validate relationship integrity
  if (lease.tenantId !== data.tenantId) {
    throw new Error("Tenant does not belong to this lease");
  }

  // 4. CREATE PAYMENT
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

export async function getPaymentById(id: string, userId: string) {
  return prisma.payment.findFirst({
    where: {
      id,
      lease: {
        property: {
          userId,
          deletedAt: null,
        },
      },
    },
    include: {
      lease: true,
      tenant: true,
    },
  });
}

export async function getAllPayments(userId: string) {
  return prisma.payment.findMany({
    where: {
      lease: {
        property: {
          userId,
          deletedAt: null,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      lease: true,
      tenant: true,
    },
  });
}

export async function updatePayment(id: string, userId: string, data: any) {
  // Verify ownership first
  const existingPayment = await prisma.payment.findFirst({
    where: {
      id,
      lease: {
        property: {
          userId,
          deletedAt: null,
        },
      },
    },
  });

  if (!existingPayment) {
    throw new Error("Payment not found or access denied");
  }

  return prisma.payment.update({
    where: { id },
    data: {
      amount: data.amount ? new Prisma.Decimal(data.amount) : undefined,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
      method: data.method,
      status: data.status,
      reference: data.reference,
      notes: data.notes,
    },
    include: {
      lease: true,
      tenant: true,
    },
  });
}
