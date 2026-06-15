"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTenants, Tenant } from "@/services/tenantApi";
import PageHeader from "@/components/PageHeader";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTenants() {
      try {
        const data = await getTenants();
        setTenants(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tenants");
      } finally {
        setLoading(false);
      }
    }
    fetchTenants();
  }, []);

  if (loading) return <LoadingState message="Loading tenants..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <PageHeader
            title="Tenants"
            description={
              tenants.length > 0
                ? `${tenants.length} tenants`
                : "Manage your tenants"
            }
          />
          <Link
            href="/tenants/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex-shrink-0"
          >
            Add Tenant
          </Link>
        </div>

        {tenants.length === 0 ? (
          <EmptyState message="No tenants found. Add your first tenant to get started." />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Name
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Email
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Phone
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {tenant.firstName} {tenant.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tenant.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tenant.phone || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <Link
                          href={`/tenants/${tenant.id}/edit`}
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
