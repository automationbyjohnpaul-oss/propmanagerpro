import { z } from "zod";

export const createUnitSchema = z.object({
  unitNumber: z.string().trim().min(1).max(20),
  bedrooms: z.number().int().min(0).max(50),
  bathrooms: z.number().min(0).max(50),
  squareFeet: z.number().int().positive().max(100000).optional(),
  rentAmount: z.number().positive().max(999999),
  propertyId: z.string().min(1),
});

export const updateUnitSchema = createUnitSchema;
