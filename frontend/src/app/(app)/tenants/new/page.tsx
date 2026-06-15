"use client";

import { useRouter } from "next/navigation";
import { createTenant, CreateTenantInput } from "@/services/tenantApi";
import PageHeader from "@/components/PageHeader";
import TenantForm from "@/components/forms/TenantForm";

export default function NewTenantPage() {
  const router = useRouter();

  async function handleSubmit(data: CreateTenantInput) {
    await createTenant(data);
    router.push("/tenants");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Add Tenant" description="Add a new tenant" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <TenantForm onSubmit={handleSubmit} onCancel={() => router.back()} />
        </div>
      </div>
    </div>
  );
}
