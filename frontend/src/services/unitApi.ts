import { api } from "./api";

export interface Unit {
  id: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  rentAmount: number | string;
  propertyId: string;
  property?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitInput {
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  rentAmount: number;
  propertyId: string;
}

// ✅ UPDATED: propertyId is now REQUIRED - no fallback
export async function getUnits(propertyId: string): Promise<Unit[]> {
  return api.get(`/api/units?propertyId=${propertyId}`);
}

export async function getUnit(id: string): Promise<Unit> {
  return api.get(`/api/units/${id}`);
}

export async function createUnit(data: CreateUnitInput): Promise<Unit> {
  return api.post("/api/units", data);
}

export async function updateUnit(
  id: string,
  data: CreateUnitInput,
): Promise<Unit> {
  return api.put(`/api/units/${id}`, data);
}

export async function deleteUnit(id: string): Promise<void> {
  return api.delete(`/api/units/${id}`);
}
