"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getTenant, Tenant } from "@/services/tenantApi";
import PageHeader from "@/components/PageHeader";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";

export default function TenantDetailPage() {
  const params = useParams();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenant() {
      try {
        const data = await getTenant(tenantId);
        setTenant(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tenant");
      } finally {
        setLoading(false);
      }
    }
    loadTenant();
  }, [tenantId]);

  if (loading) return <LoadingState message="Loading tenant..." />;
  if (error || !tenant)
    return <ErrorState message={error || "Tenant not found"} />;

  const activeLeases = tenant.leases?.filter((l) => l.isActive).length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/tenants"
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          &larr; Back to Tenants
        </Link>

        <PageHeader
          title={`${tenant.firstName} ${tenant.lastName}`}
          description={tenant.deletedAt ? "Archived Tenant" : "Tenant Details"}
        />

        {tenant.deletedAt && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm">
            This tenant is archived.
          </div>
        )}

        {/* Detail card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">First Name</dt>
              <dd className="text-sm text-gray-900 mt-1">{tenant.firstName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Name</dt>
              <dd className="text-sm text-gray-900 mt-1">{tenant.lastName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="text-sm text-gray-900 mt-1">{tenant.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="text-sm text-gray-900 mt-1">
                {tenant.phone || "\u2014"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="text-sm mt-1">
                {tenant.deletedAt ? (
                  <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-xs">
                    Archived
                  </span>
                ) : (
                  <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded-full text-xs">
                    Active
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Active Leases
              </dt>
              <dd className="text-sm text-gray-900 mt-1">{activeLeases}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="text-sm text-gray-900 mt-1">
                {new Date(tenant.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>

          {!tenant.deletedAt && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link
                href={`/tenants/${tenant.id}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Edit Tenant
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
