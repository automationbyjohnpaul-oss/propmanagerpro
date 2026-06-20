import { api } from "./api";

export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  emergencyContact?: string;
  deletedAt?: string | null;
  hasActiveLease?: boolean;
  activeLeaseCount?: number;
  leases?: { id: string; isActive: boolean; unit?: { unitNumber: string } }[];
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

export async function getTenants(status?: string): Promise<Tenant[]> {
  const url = status ? `/api/tenants?status=${status}` : "/api/tenants";
  return api.get(url);
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

export async function archiveTenant(id: string): Promise<void> {
  return api.patch(`/api/tenants/${id}/archive`);
}

export async function restoreTenant(id: string): Promise<Tenant> {
  return api.patch(`/api/tenants/${id}/restore`);
}
