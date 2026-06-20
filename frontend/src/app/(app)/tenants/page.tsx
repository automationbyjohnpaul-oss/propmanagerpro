"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getTenants,
  archiveTenant,
  restoreTenant,
  Tenant,
} from "@/services/tenantApi";
import PageHeader from "@/components/PageHeader";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = showArchived ? "archived" : "active";
      const data = await getTenants(status);
      setTenants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  async function handleArchive(tenantId: string) {
    if (!confirm("Archive this tenant?")) return;
    setActionLoading(tenantId);
    setError(null);
    try {
      await archiveTenant(tenantId);
      await loadTenants();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to archive tenant";
      setError(message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRestore(tenantId: string) {
    setActionLoading(tenantId);
    setError(null);
    try {
      await restoreTenant(tenantId);
      await loadTenants();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to restore tenant";
      setError(message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <LoadingState message="Loading tenants..." />;
  if (error && tenants.length === 0) return <ErrorState message={error} />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-4">
          <PageHeader
            title="Tenants"
            description={
              tenants.length > 0
                ? `${tenants.length} ${showArchived ? "archived" : ""} tenants`
                : `No ${showArchived ? "archived" : ""} tenants`
            }
          />
          {!showArchived && (
            <Link
              href="/tenants/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex-shrink-0"
            >
              Add Tenant
            </Link>
          )}
        </div>

        <div className="flex items-center justify-end gap-4 mb-4">
          <button
            onClick={() => {
              setShowArchived(!showArchived);
              setError(null);
            }}
            className={`text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
              showArchived
                ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {showArchived ? "Show Active Tenants" : "View Archived Tenants"}
          </button>
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 font-bold ml-4"
            >
              &times;
            </button>
          </div>
        )}

        {tenants.length === 0 ? (
          <EmptyState
            message={
              showArchived
                ? "No archived tenants."
                : "No tenants found. Add your first tenant to get started."
            }
          />
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
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Active Lease
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
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        showArchived ? "opacity-75" : ""
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <Link
                          href={`/tenants/${tenant.id}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {tenant.firstName} {tenant.lastName}
                        </Link>
                        {showArchived && (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            Archived
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tenant.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tenant.phone || "\u2014"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {tenant.hasActiveLease ? (
                          <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded-full text-xs font-medium">
                            Yes
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!showArchived ? (
                            <>
                              <Link
                                href={`/tenants/${tenant.id}/edit`}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleArchive(tenant.id)}
                                disabled={actionLoading === tenant.id}
                                className="text-amber-600 hover:text-amber-800 font-medium disabled:opacity-50"
                              >
                                {actionLoading === tenant.id
                                  ? "..."
                                  : "Archive"}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleRestore(tenant.id)}
                              disabled={actionLoading === tenant.id}
                              className="text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                            >
                              {actionLoading === tenant.id ? "..." : "Restore"}
                            </button>
                          )}
                        </div>
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
