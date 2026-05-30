import { z } from "zod";

export const createPropertySchema = z.object({
  name: z.string().trim().min(2).max(100),
  address: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(50),
  zip: z.string().trim().min(3).max(20),
  unitCount: z.number().int().positive().max(10000),
});

export const updatePropertySchema = createPropertySchema;
