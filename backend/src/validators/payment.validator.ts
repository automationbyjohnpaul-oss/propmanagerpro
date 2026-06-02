import { z } from "zod";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

export const createPaymentSchema = z.object({
  amount: z.number().positive().max(999999),
  paymentDate: z.string().datetime().optional(),
  method: z.nativeEnum(PaymentMethod),
  status: z.nativeEnum(PaymentStatus),
  reference: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  leaseId: z.string().min(1),
  tenantId: z.string().min(1),
});

export const updatePaymentSchema = z.object({
  amount: z.number().positive().max(999999).optional(),
  paymentDate: z.string().datetime().optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  reference: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  leaseId: z.string().min(1).optional(),
  tenantId: z.string().min(1).optional(),
});
