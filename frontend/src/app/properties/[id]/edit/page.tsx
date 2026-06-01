"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getProperty,
  updateProperty,
  Property,
  CreatePropertyInput,
} from "@/services/propertyApi";
import PageHeader from "@/components/PageHeader";
import PropertyForm from "@/components/forms/PropertyForm";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProperty() {
      try {
        const data = await getProperty(propertyId);

        if (!data) {
          setError("Property not found");
          return;
        }

        setProperty(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load property",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [propertyId]);

  async function handleSubmit(data: CreatePropertyInput) {
    await updateProperty(propertyId, data);
    router.push("/properties");
    router.refresh();
  }

  if (loading) {
    return <LoadingState message="Loading property..." />;
  }

  if (error || !property) {
    return <ErrorState message={error || "Property not found"} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Edit Property"
          description="Update property information"
        />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <PropertyForm
            initialData={{
              name: property.name,
              address: property.address,
              city: property.city,
              state: property.state,
              zip: property.zip,
              unitCount: property.unitCount,
            }}
            onSubmit={handleSubmit}
            submitLabel="Update Property"
          />
        </div>
      </div>
    </div>
  );
}
