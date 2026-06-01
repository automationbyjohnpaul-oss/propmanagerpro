"use client";

import { useEffect, useState } from "react";
import { getDashboardMetrics, DashboardMetrics } from "@/services/financeApi";
import PageHeader from "@/components/PageHeader";
import DashboardGrid from "@/components/DashboardGrid";
import DashboardCard from "@/components/DashboardCard";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import AuthGuard from "@/components/AuthGuard";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const data = await getDashboardMetrics();
        setMetrics(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!metrics) {
    return null;
  }

  const kpis = [
    {
      label: "Monthly Income",
      value: `$${metrics.monthlyIncome.toLocaleString()}`,
      color: "text-green-600",
    },
    {
      label: "Net Cashflow",
      value: `$${metrics.netCashflow.toLocaleString()}`,
      color: "text-blue-600",
    },
    {
      label: "Occupancy Rate",
      value: `${metrics.occupancyRate}%`,
      color: "text-purple-600",
    },
    {
      label: "Active Leases",
      value: metrics.activeLeases,
      color: "text-indigo-600",
    },
    {
      label: "Occupied Units",
      value: metrics.occupiedUnits,
      color: "text-teal-600",
    },
    {
      label: "Vacant Units",
      value: metrics.vacantUnits,
      color: "text-orange-600",
    },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <PageHeader
            title="PropManager Pro"
            description="Real-time property management dashboard"
          />

          <DashboardGrid>
            {kpis.map((kpi) => (
              <DashboardCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                color={kpi.color}
              />
            ))}
          </DashboardGrid>
        </div>
      </div>
    </AuthGuard>
  );
}
