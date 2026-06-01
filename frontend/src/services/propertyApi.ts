import { api } from "./api";

export interface UnitSummary {
  id: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  rentAmount: number | string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  unitCount: number;
  units?: UnitSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyInput {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  unitCount: number;
}

export async function getProperties(): Promise<Property[]> {
  return api.get("/api/properties");
}

export async function getProperty(id: string): Promise<Property> {
  return api.get(`/api/properties/${id}`);
}

export async function createProperty(
  data: CreatePropertyInput,
): Promise<Property> {
  return api.post("/api/properties", data);
}

export async function updateProperty(
  id: string,
  data: CreatePropertyInput,
): Promise<Property> {
  return api.put(`/api/properties/${id}`, data);
}

export async function deleteProperty(id: string): Promise<void> {
  return api.delete(`/api/properties/${id}`);
}
