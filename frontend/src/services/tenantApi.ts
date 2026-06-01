import { api } from "./api";

export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  emergencyContact?: string;
}

export async function getTenants(): Promise<Tenant[]> {
  return api.get("/api/tenants");
}

export async function getTenant(id: string): Promise<Tenant> {
  return api.get(`/api/tenants/${id}`);
}

export async function createTenant(data: CreateTenantInput): Promise<Tenant> {
  return api.post("/api/tenants", data);
}

export async function updateTenant(
  id: string,
  data: CreateTenantInput,
): Promise<Tenant> {
  return api.put(`/api/tenants/${id}`, data);
}

export async function deleteTenant(id: string): Promise<void> {
  return api.delete(`/api/tenants/${id}`);
}
