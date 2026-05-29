import { apiClient } from "@/lib/api-client";

export type FinanceSummary = {
  monthlyIncome: number;

  monthlyExpenses: number;

  netCashflow: number;

  occupiedUnits: number;

  vacantUnits: number;
};

export async function getFinanceSummary() {
  return apiClient<FinanceSummary>("/finance/summary");
}
