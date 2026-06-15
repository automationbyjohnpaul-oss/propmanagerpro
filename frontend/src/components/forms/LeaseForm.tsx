"use client";

import { useState, useEffect, FormEvent } from "react";
import { CreateLeaseInput } from "@/services/leaseApi";
import { getProperties, Property } from "@/services/propertyApi";
import { getUnits, Unit } from "@/services/unitApi";
import { getTenants, Tenant } from "@/services/tenantApi";
import FormError from "@/components/FormError";

interface LeaseFormProps {
  initialData?: Partial<CreateLeaseInput>;
  onSubmit: (data: CreateLeaseInput) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
}

export default function LeaseForm({
  initialData,
  onSubmit,
  submitLabel = "Create Lease",
  onCancel,
}: LeaseFormProps) {
  const [formData, setFormData] = useState<CreateLeaseInput>({
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
    monthlyRent: initialData?.monthlyRent || 0,
    securityDeposit: initialData?.securityDeposit || 0,
    isActive: initialData?.isActive ?? true,
    propertyId: initialData?.propertyId || "",
    unitId: initialData?.unitId || "",
    tenantId: initialData?.tenantId || "",
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load properties and tenants on mount (NO unit fetch)
  useEffect(() => {
    async function loadOptions() {
      const [props, tens] = await Promise.all([getProperties(), getTenants()]);
      setProperties(props);
      setTenants(tens);
    }
    loadOptions();
  }, []);

  // Function to fetch units for a specific property
  const loadUnits = async (propertyId: string) => {
    try {
      const data = await getUnits(propertyId);
      setUnits(data);
    } catch (err) {
      console.error("Failed to fetch units:", err);
      setUnits([]);
    }
  };

  // Fetch units ONLY when propertyId is selected
  useEffect(() => {
    if (!formData.propertyId) {
      setUnits([]);
      return;
    }
    loadUnits(formData.propertyId);
  }, [formData.propertyId]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save lease");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <FormError message={error} />}

      <h2 className="text-lg font-semibold text-gray-900">Lease Information</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="propertyId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Property *
          </label>
          <select
            id="propertyId"
            name="propertyId"
            required
            value={formData.propertyId}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Select property</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="unitId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Unit *
          </label>
          <select
            id="unitId"
            name="unitId"
            required
            value={formData.unitId}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Select unit</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unitNumber}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="tenantId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tenant *
          </label>
          <select
            id="tenantId"
            name="tenantId"
            required
            value={formData.tenantId}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Select tenant</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.firstName} {t.lastName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Date *
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            required
            value={formData.startDate ? formData.startDate.slice(0, 10) : ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            End Date *
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            required
            value={formData.endDate ? formData.endDate.slice(0, 10) : ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="monthlyRent"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Monthly Rent *
          </label>
          <input
            type="number"
            id="monthlyRent"
            name="monthlyRent"
            required
            min="1"
            value={formData.monthlyRent}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="securityDeposit"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Security Deposit *
          </label>
          <input
            type="number"
            id="securityDeposit"
            name="securityDeposit"
            required
            min="0"
            value={formData.securityDeposit}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="isActive"
            className="text-sm font-medium text-gray-700"
          >
            Active Lease
          </label>
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
