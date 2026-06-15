"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getLease,
  updateLease,
  Lease,
  CreateLeaseInput,
} from "@/services/leaseApi";
import PageHeader from "@/components/PageHeader";
import LeaseForm from "@/components/forms/LeaseForm";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";

export default function EditLeasePage() {
  const params = useParams();
  const router = useRouter();
  const leaseId = params.id as string;

  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLease() {
      try {
        const data = await getLease(leaseId);
        if (!data) {
          setError("Lease not found");
          return;
        }
        setLease(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lease");
      } finally {
        setLoading(false);
      }
    }
    loadLease();
  }, [leaseId]);

  async function handleSubmit(data: CreateLeaseInput) {
    await updateLease(leaseId, {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
    });
    router.push("/leases");
    router.refresh();
  }

  if (loading) return <LoadingState message="Loading lease..." />;
  if (error || !lease)
    return <ErrorState message={error || "Lease not found"} />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Edit Lease" description="Update lease agreement" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <LeaseForm
            initialData={{
              startDate: lease.startDate,
              endDate: lease.endDate,
              monthlyRent: Number(lease.monthlyRent),
              securityDeposit: Number(lease.securityDeposit),
              isActive: lease.isActive,
              propertyId: lease.propertyId,
              unitId: lease.unitId,
              tenantId: lease.tenantId,
            }}
            onSubmit={handleSubmit}
            submitLabel="Update Lease"
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </div>
  );
}
