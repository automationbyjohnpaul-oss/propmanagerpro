import { z } from "zod";

export const createLeaseSchema = z
  .object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    monthlyRent: z.number().positive().max(999999),
    securityDeposit: z.number().positive().max(999999),
    isActive: z.boolean().default(true),
    propertyId: z.string().min(1),
    unitId: z.string().min(1),
    tenantId: z.string().min(1),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const updateLeaseSchema = createLeaseSchema;
