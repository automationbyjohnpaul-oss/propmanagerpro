import { api } from "./api";

export interface DashboardMetrics {
  monthlyIncome: number;
  monthlyExpenses: number;
  netCashflow: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  activeLeases: number;
}

export interface PropertyRevenue {
  propertyId: string;
  propertyName: string;
  revenue: number;
}

export interface OutstandingRent {
  tenantId: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  amountDue: number;
}

export async function getDashboardMetrics(
  signal?: AbortSignal,
): Promise<DashboardMetrics> {
  return api.get("/api/finance/dashboard", signal);
}

export async function getRevenueByProperty(
  signal?: AbortSignal,
): Promise<PropertyRevenue[]> {
  return api.get("/api/finance/revenue-by-property", signal);
}

export async function getOutstandingRent(
  signal?: AbortSignal,
): Promise<OutstandingRent[]> {
  return api.get("/api/finance/outstanding-rent", signal);
}
