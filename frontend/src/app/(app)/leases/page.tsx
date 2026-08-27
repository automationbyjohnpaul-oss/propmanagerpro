"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLeases, Lease } from "@/services/leaseApi";
import PageHeader from "@/components/PageHeader";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await getLeases();
        if (!isMounted) return;
        setLeases(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load leases");
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  // Soft loading: only show full loading state if still loading
  if (loading && !leases.length) {
    return <LoadingState message="Loading leases..." />;
  }

  if (error && !leases.length) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <PageHeader
            title="Leases"
            description={
              leases.length > 0
                ? `${leases.length} leases`
                : "Manage your leases"
            }
          />
          <Link
            href="/leases/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex-shrink-0"
          >
            Add Lease
          </Link>
        </div>

        {leases.length === 0 ? (
          <EmptyState message="No leases found. Add your first lease to get started." />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Property
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Unit
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Tenant
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Start Date
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      End Date
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Rent
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leases.map((lease) => (
                    <tr
                      key={lease.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {lease.property?.name || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {lease.unit?.unitNumber || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {lease.tenant
                          ? `${lease.tenant.firstName} ${lease.tenant.lastName}`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {lease.startDate
                          ? new Date(lease.startDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {lease.endDate
                          ? new Date(lease.endDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        ${Number(lease.monthlyRent).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            lease.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : lease.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {lease.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <Link
                          href={`/leases/${lease.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
