"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUnit, updateUnit, Unit, CreateUnitInput } from "@/services/unitApi";
import PageHeader from "@/components/PageHeader";
import UnitForm from "@/components/forms/UnitForm";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import AuthGuard from "@/components/AuthGuard";

export default function EditUnitPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  const unitId = params.unitId as string;

  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUnit() {
      try {
        const data = await getUnit(unitId);

        if (!data) {
          setError("Unit not found");
          return;
        }

        setUnit(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load unit");
      } finally {
        setLoading(false);
      }
    }

    loadUnit();
  }, [unitId]);

  async function handleSubmit(data: Omit<CreateUnitInput, "propertyId">) {
    await updateUnit(unitId, { ...data, propertyId });
    router.push(`/properties/${propertyId}/units`);
    router.refresh();
  }

  if (loading) {
    return <LoadingState message="Loading unit..." />;
  }

  if (error || !unit) {
    return <ErrorState message={error || "Unit not found"} />;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <PageHeader
            title="Edit Unit"
            description={`Update Unit ${unit.unitNumber}`}
          />

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <UnitForm
              initialData={{
                unitNumber: unit.unitNumber,
                bedrooms: unit.bedrooms,
                bathrooms: unit.bathrooms,
                squareFeet: unit.squareFeet,
                rentAmount: Number(unit.rentAmount),
              }}
              onSubmit={handleSubmit}
              submitLabel="Update Unit"
              onCancel={() => router.back()}
            />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
