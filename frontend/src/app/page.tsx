"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDashboardMetrics, DashboardMetrics } from "@/services/financeApi";
import PageHeader from "@/components/PageHeader";
import DashboardGrid from "@/components/DashboardGrid";
import DashboardCard from "@/components/DashboardCard";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import AuthGuard from "@/components/AuthGuard";

export default function DashboardPage() {
  const { user, logout } = useAuth();
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
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">PropManager Pro</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <PageHeader
              title="Dashboard"
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
      </div>
    </AuthGuard>
  );
}
