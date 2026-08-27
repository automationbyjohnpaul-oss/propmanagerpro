import { api } from "./api";

export type LeaseStatus = "PENDING" | "ACTIVE" | "TERMINATED" | "ENDED";

export interface Lease {
  id: string;
  startDate: string;
  endDate: string;
  monthlyRent: number | string;
  securityDeposit: number | string;
  status: LeaseStatus;
  propertyId: string;
  unitId: string;
  tenantId: string;
  signedAt?: string | null;
  terminatedAt?: string | null;
  terminationReason?: string | null;
  property?: {
    id: string;
    name: string;
  };
  unit?: {
    id: string;
    unitNumber: string;
  };
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaseInput {
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status?: LeaseStatus;
  signedAt?: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
}

// ============================================
// GET LEASES
// ============================================

export async function getLeases(): Promise<Lease[]> {
  return api.get("/api/leases");
}

// ============================================
// GET SINGLE LEASE
// ============================================

export async function getLease(id: string): Promise<Lease> {
  return api.get(`/api/leases/${id}`);
}

// ============================================
// CREATE LEASE
// ============================================

export async function createLease(
  data: CreateLeaseInput,
): Promise<Lease> {
  return api.post("/api/leases", data);
}

// ============================================
// UPDATE LEASE
// ============================================

export async function updateLease(
  id: string,
  data: CreateLeaseInput,
): Promise<Lease> {
  return api.put(`/api/leases/${id}`, data);
}

// ============================================
// ACTIVATE LEASE
// PENDING -> ACTIVE
// ============================================

export async function activateLease(id: string): Promise<Lease> {
  return api.patch(`/api/leases/${id}/activate`, {});
}

// ============================================
// TERMINATE LEASE
// ACTIVE -> TERMINATED
// ============================================

export async function terminateLease(
  id: string,
  reason: string,
): Promise<Lease> {
  return api.patch(`/api/leases/${id}/terminate`, { reason });
}

// ============================================
// RESTORE LEASE
// TERMINATED -> ACTIVE
// ============================================

export async function restoreLease(id: string): Promise<Lease> {
  return api.patch(`/api/leases/${id}/restore`, {});
}

// ============================================
// END LEASE
// ACTIVE -> ENDED
// ============================================

export async function endLease(id: string): Promise<Lease> {
  return api.patch(`/api/leases/${id}/end`, {});
}
