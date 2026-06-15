"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getTenant,
  updateTenant,
  Tenant,
  CreateTenantInput,
} from "@/services/tenantApi";
import PageHeader from "@/components/PageHeader";
import TenantForm from "@/components/forms/TenantForm";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";

export default function EditTenantPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenant() {
      try {
        const data = await getTenant(tenantId);
        if (!data) {
          setError("Tenant not found");
          return;
        }
        setTenant(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tenant");
      } finally {
        setLoading(false);
      }
    }
    loadTenant();
  }, [tenantId]);

  async function handleSubmit(data: CreateTenantInput) {
    await updateTenant(tenantId, data);
    router.push("/tenants");
    router.refresh();
  }

  if (loading) return <LoadingState message="Loading tenant..." />;
  if (error || !tenant)
    return <ErrorState message={error || "Tenant not found"} />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Edit Tenant"
          description={`Update ${tenant.firstName} ${tenant.lastName}`}
        />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <TenantForm
            initialData={{
              firstName: tenant.firstName,
              lastName: tenant.lastName,
              email: tenant.email,
              phone: tenant.phone || "",
              emergencyContact: tenant.emergencyContact || "",
            }}
            onSubmit={handleSubmit}
            submitLabel="Update Tenant"
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </div>
  );
}
