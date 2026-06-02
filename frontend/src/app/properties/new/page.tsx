"use client";

import { useRouter } from "next/navigation";
import { createProperty, CreatePropertyInput } from "@/services/propertyApi";
import PageHeader from "@/components/PageHeader";
import PropertyForm from "@/components/forms/PropertyForm";
import AuthGuard from "@/components/AuthGuard";

export default function NewPropertyPage() {
  const router = useRouter();

  async function handleSubmit(data: CreatePropertyInput) {
    await createProperty(data);
    router.push("/properties");
    router.refresh();
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <PageHeader
            title="Add Property"
            description="Create a new property in your portfolio"
          />

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <PropertyForm onSubmit={handleSubmit} />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
