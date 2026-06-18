import { z } from "zod";

export const createTenantSchema = z.object({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  email: z.string().email(),
  phone: z.string().trim().optional(),
  emergencyContact: z.string().trim().optional(),
});

export const updateTenantSchema = createTenantSchema.partial();
