import { z } from "zod";

export const createUnitSchema = z.object({
  unitNumber: z.string().min(1, "Unit number is required"),
  bedrooms: z.number().int().min(0, "Bedrooms must be 0 or more"),
  bathrooms: z.number().min(0, "Bathrooms must be 0 or more"),
  squareFeet: z.number().int().optional(),
  rentAmount: z.number().min(0, "Rent amount must be 0 or more"),
  propertyId: z.string().min(1, "Property ID is required"),
});

export const updateUnitSchema = createUnitSchema.partial().strict();
