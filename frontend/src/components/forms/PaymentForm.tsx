// frontend/src/components/forms/PaymentForm.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import { CreatePaymentInput, UpdatePaymentInput } from "@/services/paymentApi";
import { getLeases, Lease } from "@/services/leaseApi";
import FormError from "@/components/FormError";

const METHODS = ["cash", "bank_transfer", "card", "check"] as const;
const STATUSES = ["pending", "completed", "failed", "refunded"] as const;

// Type for the form data that includes all possible fields
type FormDataType = {
  amount: number;
  paymentDate: string;
  method: string;
  status?: string;
  reference?: string;
  notes?: string;
  leaseId?: string;
  tenantId?: string;
};

interface PaymentFormProps {
  initialData?: Partial<FormDataType>;
  onSubmit: (data: any) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
  isEdit?: boolean;
  currentStatus?: string;
}

export default function PaymentForm({
  initialData,
  onSubmit,
  submitLabel = "Record Payment",
  onCancel,
  isEdit = false,
  currentStatus,
}: PaymentFormProps) {
  // Determine if payment is editable
  const isEditable =
    !isEdit ||
    (currentStatus &&
      ["pending", "failed"].includes(currentStatus.toLowerCase()));

  const [formData, setFormData] = useState<FormDataType>({
    amount: initialData?.amount || 0,
    paymentDate:
      initialData?.paymentDate || new Date().toISOString().slice(0, 10),
    method: initialData?.method || "bank_transfer",
    status: initialData?.status || "pending",
    reference: initialData?.reference || "",
    notes: initialData?.notes || "",
    leaseId: initialData?.leaseId || "",
    tenantId: initialData?.tenantId || "",
  });
  const [leases, setLeases] = useState<Lease[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeases() {
      const data = await getLeases();
      setLeases(data);
    }
    if (!isEdit) {
      loadLeases();
    }
  }, [isEdit]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  function handleLeaseChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const leaseId = e.target.value;
    const lease = leases.find((l) => l.id === leaseId);
    setFormData((prev) => ({
      ...prev,
      leaseId,
      tenantId: lease?.tenantId || "",
    }));
  }

  // Prepare submit data based on mode
  function prepareSubmitData(): CreatePaymentInput | UpdatePaymentInput {
    if (isEdit) {
      // Edit mode: only send mutable fields
      const updateData: UpdatePaymentInput = {
        amount: formData.amount,
        paymentDate: formData.paymentDate,
        method: formData.method as any,
        reference: formData.reference,
        notes: formData.notes,
      };
      return updateData;
    } else {
      // Create mode: send all required fields
      const createData: CreatePaymentInput = {
        amount: formData.amount,
        paymentDate: formData.paymentDate,
        method: formData.method as any,
        status: formData.status as any,
        reference: formData.reference,
        notes: formData.notes,
        leaseId: formData.leaseId || "",
        tenantId: formData.tenantId || "",
      };
      return createData;
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const submitData = prepareSubmitData();
      await onSubmit(submitData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save payment");
      setIsSubmitting(false);
    }
  }

  // Show read-only view for completed/refunded payments
  if (isEdit && !isEditable) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Payment Details (Read Only)
        </h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          This payment is {currentStatus?.toLowerCase()} and cannot be modified.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <p className="mt-1 text-gray-900">
              ${Number(initialData?.amount).toFixed(2)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Date
            </label>
            <p className="mt-1 text-gray-900">{initialData?.paymentDate}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Method
            </label>
            <p className="mt-1 text-gray-900">
              {initialData?.method?.replace("_", " ")}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <p className="mt-1 text-gray-900">{currentStatus}</p>
          </div>
          {initialData?.reference && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Reference
              </label>
              <p className="mt-1 text-gray-900">{initialData.reference}</p>
            </div>
          )}
          {initialData?.notes && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <p className="mt-1 text-gray-900">{initialData.notes}</p>
            </div>
          )}
        </div>
        {onCancel && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          </div>
        )}
      </div>
    );
  }

  // Editable form for create or pending/failed payments
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <FormError message={error} />}

      <h2 className="text-lg font-semibold text-gray-900">
        {isEdit ? "Edit Payment" : "Payment Details"}
      </h2>

      {isEdit && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          This payment is {currentStatus?.toLowerCase()} and can be modified.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {!isEdit && (
          <>
            <div className="sm:col-span-2">
              <label
                htmlFor="leaseId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Lease *
              </label>
              <select
                id="leaseId"
                name="leaseId"
                required
                value={formData.leaseId || ""}
                onChange={handleLeaseChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select lease</option>
                {leases.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.property?.name} — Unit {l.unit?.unitNumber} —{" "}
                    {l.tenant?.firstName} {l.tenant?.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status *
              </label>
              <select
                id="status"
                name="status"
                required
                value={formData.status || "pending"}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {STATUSES.filter((s) => s !== "refunded").map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                REFUNDED status is not available for new payments.
              </p>
            </div>
          </>
        )}

        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Amount *
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            required
            min="1"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            disabled={!isEditable}
          />
        </div>

        <div>
          <label
            htmlFor="paymentDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Payment Date *
          </label>
          <input
            type="date"
            id="paymentDate"
            name="paymentDate"
            required
            value={
              formData.paymentDate ? formData.paymentDate.slice(0, 10) : ""
            }
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            disabled={!isEditable}
          />
        </div>

        <div>
          <label
            htmlFor="method"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Method *
          </label>
          <select
            id="method"
            name="method"
            required
            value={formData.method}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            disabled={!isEditable}
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="reference"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Reference
          </label>
          <input
            type="text"
            id="reference"
            name="reference"
            value={formData.reference || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Check # or transaction ID"
            disabled={!isEditable}
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            value={formData.notes || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Optional notes"
            disabled={!isEditable}
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
          disabled={isSubmitting || !isEditable}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
