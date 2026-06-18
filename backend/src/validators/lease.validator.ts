import { z } from "zod";

// Base schema without refinement (used for updates)
const leaseSchemaBase = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  monthlyRent: z.number().positive().max(999999),
  securityDeposit: z.number().positive().max(999999),
  isActive: z.boolean().default(true),
  signedAt: z.coerce.date().optional(),
  propertyId: z.string().min(1),
  unitId: z.string().min(1),
  tenantId: z.string().min(1),
});

// Create schema with refinement (for new leases)
export const createLeaseSchema = leaseSchemaBase.refine(
  (data) => data.endDate > data.startDate,
  {
    message: "End date must be after start date",
    path: ["endDate"],
  },
);

// Update schema: partial base without refinement
export const updateLeaseSchema = leaseSchemaBase.partial().strict();
