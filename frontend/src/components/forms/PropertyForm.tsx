"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { CreatePropertyInput } from "@/services/propertyApi";
import FormError from "@/components/FormError";

interface PropertyFormProps {
  initialData?: Partial<CreatePropertyInput>;
  onSubmit: (data: CreatePropertyInput) => Promise<void>;
  submitLabel?: string;
  isEditMode?: boolean;
}

export default function PropertyForm({
  initialData,
  onSubmit,
  submitLabel = "Create Property",
  isEditMode = false,
}: PropertyFormProps) {
  const [formData, setFormData] = useState<CreatePropertyInput>({
    name: initialData?.name || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    zip: initialData?.zip || "",
    unitCount: initialData?.unitCount || 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "unitCount" ? (value === "" ? 1 : Number(value)) : value,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save property");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <FormError message={error} />}

      <h2 className="text-lg font-semibold text-gray-900">
        Property Information
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="sm:col-span-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Property Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Sunset Apartments"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Address *
          </label>
          <input
            type="text"
            id="address"
            name="address"
            required
            value={formData.address}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="123 Main Street"
          />
        </div>

        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            City *
          </label>
          <input
            type="text"
            id="city"
            name="city"
            required
            value={formData.city}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Austin"
          />
        </div>

        <div>
          <label
            htmlFor="state"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            State *
          </label>
          <input
            type="text"
            id="state"
            name="state"
            required
            value={formData.state}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="TX"
          />
        </div>

        <div>
          <label
            htmlFor="zip"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            ZIP Code *
          </label>
          <input
            type="text"
            id="zip"
            name="zip"
            required
            value={formData.zip}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="78701"
          />
        </div>

        <div>
          <label
            htmlFor="unitCount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Number of Units *
          </label>
          <input
            type="number"
            id="unitCount"
            name="unitCount"
            required
            min="1"
            value={formData.unitCount}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
        <Link
          href="/properties"
          className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {isSubmitting ? "Creating..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
