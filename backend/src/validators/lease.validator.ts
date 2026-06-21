import { z } from "zod";

const leaseSchemaBase = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  monthlyRent: z.number().positive().max(999999),
  securityDeposit: z.number().positive().max(999999),
  status: z
    .enum(["PENDING", "ACTIVE", "ENDED", "TERMINATED"])
    .default("PENDING"),
  signedAt: z.coerce.date().optional(),
  propertyId: z.string().min(1),
  unitId: z.string().min(1),
  tenantId: z.string().min(1),
});

export const createLeaseSchema = leaseSchemaBase.refine(
  (data) => data.endDate > data.startDate,
  {
    message: "End date must be after start date",
    path: ["endDate"],
  },
);

export const updateLeaseSchema = leaseSchemaBase.partial().strict();
