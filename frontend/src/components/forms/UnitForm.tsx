"use client";

import { useState, FormEvent } from "react";
import { CreateUnitInput } from "@/services/unitApi";
import FormError from "@/components/FormError";

type UnitFormData = Omit<CreateUnitInput, "propertyId">;

interface UnitFormProps {
  initialData?: Partial<UnitFormData>;
  onSubmit: (data: UnitFormData) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
}

export default function UnitForm({
  initialData,
  onSubmit,
  submitLabel = "Create Unit",
  onCancel,
}: UnitFormProps) {
  const [formData, setFormData] = useState<UnitFormData>({
    unitNumber: initialData?.unitNumber || "",
    bedrooms: initialData?.bedrooms || 1,
    bathrooms: initialData?.bathrooms || 1,
    squareFeet: initialData?.squareFeet,
    rentAmount: initialData?.rentAmount || 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type } = e.target;

    if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? undefined : Number(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save unit");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <FormError message={error} />}

      <h2 className="text-lg font-semibold text-gray-900">Unit Information</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="unitNumber"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Unit Number *
          </label>
          <input
            type="text"
            id="unitNumber"
            name="unitNumber"
            required
            value={formData.unitNumber}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="101"
          />
        </div>

        <div>
          <label
            htmlFor="bedrooms"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Bedrooms *
          </label>
          <input
            type="number"
            id="bedrooms"
            name="bedrooms"
            required
            min="0"
            value={formData.bedrooms}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="bathrooms"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Bathrooms *
          </label>
          <input
            type="number"
            id="bathrooms"
            name="bathrooms"
            required
            min="1"
            step="0.5"
            value={formData.bathrooms}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="squareFeet"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Square Feet
          </label>
          <input
            type="number"
            id="squareFeet"
            name="squareFeet"
            min="1"
            value={formData.squareFeet || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="900"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="rentAmount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Monthly Rent *
          </label>
          <input
            type="number"
            id="rentAmount"
            name="rentAmount"
            required
            min="1"
            value={formData.rentAmount}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="1200"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
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
