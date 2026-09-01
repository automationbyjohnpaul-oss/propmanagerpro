"use client";

import { useParams, useRouter } from "next/navigation";
import { createUnit, CreateUnitInput } from "@/services/unitApi";
import PageHeader from "@/components/PageHeader";
import UnitForm from "@/components/forms/UnitForm";

export default function NewUnitPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  async function handleSubmit(data: Omit<CreateUnitInput, "propertyId">) {
    if (!propertyId) {
      throw new Error("Property ID is missing");
    }

    await createUnit({
      ...data,
      propertyId,
    });

    router.push(`/properties/${propertyId}/units`);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Add Unit"
          description="Add a new unit to this property"
        />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <UnitForm onSubmit={handleSubmit} onCancel={() => router.back()} />
        </div>
      </div>
    </div>
  );
}
