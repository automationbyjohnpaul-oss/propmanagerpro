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

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  return api.get("/api/finance/dashboard");
}

export async function getRevenueByProperty(): Promise<PropertyRevenue[]> {
  return api.get("/api/finance/revenue-by-property");
}

export async function getOutstandingRent(): Promise<OutstandingRent[]> {
  return api.get("/api/finance/outstanding-rent");
}
