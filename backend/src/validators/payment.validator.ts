import { z } from "zod";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

// Create schema - prevent REFUNDED creation
export const createPaymentSchema = z.object({
  amount: z.number().positive().max(999999),
  paymentDate: z.coerce
    .date()
    .optional()
    .default(() => new Date()),
  method: z.nativeEnum(PaymentMethod),
  status: z
    .nativeEnum(PaymentStatus)
    .refine((status) => status !== PaymentStatus.refunded, {
      message:
        "Cannot create a payment with REFUNDED status. Refunds are only available through the dedicated refund workflow.",
    })
    .default(PaymentStatus.pending),
  reference: z.string().optional(),
  notes: z.string().optional(),
  leaseId: z.string().min(1),
  tenantId: z.string().min(1),
});

// Update schema - only mutable fields allowed
export const updatePaymentSchema = z
  .object({
    amount: z.number().positive().max(999999).optional(),
    paymentDate: z.coerce.date().optional(),
    method: z.nativeEnum(PaymentMethod).optional(),
    reference: z.string().optional(),
    notes: z.string().optional(),
  })
  .strict(); // Reject any fields not explicitly allowed

// Type exports for frontend use
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
