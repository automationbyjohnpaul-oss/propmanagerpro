import { api } from "@/services/api";

export type FinanceSummary = {
  monthlyIncome: number;
  monthlyExpenses: number;
  netCashflow: number;
  occupiedUnits: number;
  vacantUnits: number;
};

export async function getFinanceSummary() {
  return api.get<FinanceSummary>("/api/finance/dashboard");
}
