"use client";

import { useState, FormEvent } from "react";
import { CreateUnitInput } from "@/services/unitApi";

type UnitFormData = Omit<CreateUnitInput, "propertyId">;

type UnitFormState = {
  unitNumber: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  rentAmount: string;
};

interface UnitFormProps {
  initialData?: Partial<UnitFormData>;
  onSubmit: (data: UnitFormData) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
}

export default function UnitForm({
  initialData,
  onSubmit,
  submitLabel = "Save Unit",
  onCancel,
}: UnitFormProps) {
  const [formData, setFormData] = useState<UnitFormState>({
    unitNumber: initialData?.unitNumber || "",
    bedrooms: initialData?.bedrooms?.toString() ?? "",
    bathrooms: initialData?.bathrooms?.toString() ?? "",
    squareFeet: initialData?.squareFeet?.toString() ?? "",
    rentAmount: initialData?.rentAmount?.toString() ?? "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.unitNumber.trim()) {
      setError("Unit number is required");
      return;
    }
    if (!formData.bedrooms.trim()) {
      setError("Number of bedrooms is required");
      return;
    }
    if (!formData.bathrooms.trim()) {
      setError("Number of bathrooms is required");
      return;
    }
    if (!formData.rentAmount.trim()) {
      setError("Monthly rent is required");
      return;
    }

    const payload: UnitFormData = {
      unitNumber: formData.unitNumber,
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      squareFeet: formData.squareFeet ? Number(formData.squareFeet) : undefined,
      rentAmount: Number(formData.rentAmount),
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save unit");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Unit Number */}
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          placeholder="e.g. 101"
        />
      </div>

      {/* Bedrooms */}
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
          value={formData.bedrooms}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          placeholder="0"
          min="0"
        />
      </div>

      {/* Bathrooms */}
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
          value={formData.bathrooms}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          placeholder="0"
          min="0"
        />
      </div>

      {/* Square Feet */}
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
          value={formData.squareFeet}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          placeholder="Optional"
          min="0"
        />
      </div>

      {/* Rent Amount */}
      <div>
        <label
          htmlFor="rentAmount"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Suggested Monthly Rent *
        </label>
        <input
          type="number"
          id="rentAmount"
          name="rentAmount"
          required
          value={formData.rentAmount}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          placeholder="0"
          min="0"
        />
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
