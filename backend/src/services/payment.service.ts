// backend/src/services/payment.service.ts
import { Prisma, PaymentStatus, PaymentMethod } from "@prisma/client";
import { prisma } from "../lib/prisma";

// Define typed interfaces for service methods
interface CreatePaymentData {
  amount: number;
  paymentDate?: string | Date;
  method: PaymentMethod;
  status?: PaymentStatus;
  reference?: string;
  notes?: string;
  leaseId: string;
  tenantId: string;
}

interface UpdatePaymentData {
  amount?: number;
  paymentDate?: string | Date;
  method?: PaymentMethod;
  reference?: string;
  notes?: string;
}

export async function createPayment(userId: string, data: CreatePaymentData) {
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

  // 4. Prevent REFUNDED as initial status
  const status = data.status;
  if (status === PaymentStatus.refunded) {
    throw new Error(
      "Cannot create a payment with REFUNDED status. Refunds are only available through the dedicated refund workflow.",
    );
  }

  // 5. Default to pending if no status provided
  const initialStatus = status || PaymentStatus.pending;

  // 6. CREATE PAYMENT
  return prisma.payment.create({
    data: {
      amount: new Prisma.Decimal(data.amount),
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      method: data.method,
      status: initialStatus,
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

export async function updatePayment(
  id: string,
  userId: string,
  data: UpdatePaymentData,
) {
  // 1. Verify ownership
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

  // 2. Check immutability rules
  if (existingPayment.status === PaymentStatus.completed) {
    throw new Error("Completed payments cannot be modified");
  }

  if (existingPayment.status === PaymentStatus.refunded) {
    throw new Error("Refunded payments cannot be modified");
  }

  // 3. Build update data with only allowed fields
  const updateData: any = {};

  // Only allow mutable fields for PENDING and FAILED payments
  if (data.amount !== undefined) {
    updateData.amount = new Prisma.Decimal(data.amount);
  }

  if (data.paymentDate !== undefined) {
    updateData.paymentDate =
      data.paymentDate instanceof Date
        ? data.paymentDate
        : new Date(data.paymentDate);
  }

  if (data.method !== undefined) {
    updateData.method = data.method;
  }

  if (data.reference !== undefined) {
    updateData.reference = data.reference;
  }

  if (data.notes !== undefined) {
    updateData.notes = data.notes;
  }

  // Explicitly reject attempts to update immutable fields
  // The UpdatePaymentData type doesn't include these, but we check at runtime
  const forbiddenFields = [
    "status",
    "leaseId",
    "tenantId",
    "propertyId",
    "unitId",
  ];
  const submittedForbidden = forbiddenFields.filter((field) => field in data);

  if (submittedForbidden.length > 0) {
    throw new Error(
      `Cannot update immutable fields: ${submittedForbidden.join(", ")}`,
    );
  }

  // 4. UPDATE PAYMENT
  return prisma.payment.update({
    where: { id },
    data: updateData,
    include: {
      lease: true,
      tenant: true,
    },
  });
}

// REMOVED: deletePayment function - payments should never be deleted
