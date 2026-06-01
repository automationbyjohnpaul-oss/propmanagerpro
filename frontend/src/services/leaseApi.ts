import { api } from "./api";

export interface Lease {
  id: string;
  startDate: string;
  endDate: string;
  monthlyRent: number | string;
  securityDeposit: number | string;
  isActive: boolean;
  propertyId: string;
  unitId: string;
  tenantId: string;
  property?: { id: string; name: string };
  unit?: { id: string; unitNumber: string };
  tenant?: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaseInput {
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  isActive: boolean;
  propertyId: string;
  unitId: string;
  tenantId: string;
}

export async function getLeases(): Promise<Lease[]> {
  return api.get("/api/leases");
}

export async function getLease(id: string): Promise<Lease> {
  return api.get(`/api/leases/${id}`);
}

export async function createLease(data: CreateLeaseInput): Promise<Lease> {
  return api.post("/api/leases", data);
}

export async function updateLease(
  id: string,
  data: CreateLeaseInput,
): Promise<Lease> {
  return api.put(`/api/leases/${id}`, data);
}

export async function deleteLease(id: string): Promise<void> {
  return api.delete(`/api/leases/${id}`);
}
