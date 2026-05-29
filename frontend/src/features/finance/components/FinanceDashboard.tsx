"use client";

import { useEffect, useState } from "react";

import PageHeader from "@/components/ui/headers/PageHeader";

import LoadingState from "@/components/ui/states/LoadingState";

import { getFinanceSummary, FinanceSummary } from "@/services/finance.service";

import AppCard from "@/components/ui/cards/AppCard";

export default function FinanceDashboard() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);

  useEffect(() => {
    async function loadSummary() {
      try {
        const data = await getFinanceSummary();

        setSummary(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadSummary();
  }, []);

  if (!summary) {
    return <LoadingState message="Loading finance data..." />;
  }

  return (
    <div>
      <PageHeader
        title="Finance"
        subtitle="Financial overview of your properties."
      />

      <div className="mt-4 grid gap-3">
        <AppCard title="Monthly Income" value={`$${summary.monthlyIncome}`} />

        <AppCard
          title="Monthly Expenses"
          value={`$${summary.monthlyExpenses}`}
        />

        <AppCard title="Net Cashflow" value={`$${summary.netCashflow}`} />

        <AppCard
          title="Occupied Units"
          value={summary.occupiedUnits.toString()}
        />

        <AppCard title="Vacant Units" value={summary.vacantUnits.toString()} />
      </div>
    </div>
  );
}
