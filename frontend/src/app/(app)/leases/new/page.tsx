"use client";

import { useRouter } from "next/navigation";
import { createLease, CreateLeaseInput } from "@/services/leaseApi";
import PageHeader from "@/components/PageHeader";
import LeaseForm from "@/components/forms/LeaseForm";
import AuthGuard from "@/components/AuthGuard";

export default function NewLeasePage() {
  const router = useRouter();

  async function handleSubmit(data: CreateLeaseInput) {
    await createLease({
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
    });
    router.push("/leases");
    router.refresh();
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <PageHeader
            title="Add Lease"
            description="Create a new lease agreement"
          />
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <LeaseForm onSubmit={handleSubmit} onCancel={() => router.back()} />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
