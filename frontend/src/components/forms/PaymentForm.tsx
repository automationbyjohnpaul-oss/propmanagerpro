"use client";

import { useState, useEffect, FormEvent } from "react";
import { CreatePaymentInput } from "@/services/paymentApi";
import { getLeases, Lease } from "@/services/leaseApi";
import FormError from "@/components/FormError";

const METHODS = ["cash", "bank_transfer", "card", "check"] as const;
const STATUSES = ["pending", "completed", "failed", "refunded"] as const;

interface PaymentFormProps {
  initialData?: Partial<CreatePaymentInput>;
  onSubmit: (data: CreatePaymentInput) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
}

export default function PaymentForm({
  initialData,
  onSubmit,
  submitLabel = "Record Payment",
  onCancel,
}: PaymentFormProps) {
  const [formData, setFormData] = useState<CreatePaymentInput>({
    amount: initialData?.amount || 0,
    paymentDate:
      initialData?.paymentDate || new Date().toISOString().slice(0, 10),
    method: initialData?.method || "bank_transfer",
    status: initialData?.status || "completed",
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
    loadLeases();
  }, []);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save payment");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <FormError message={error} />}

      <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
            value={formData.leaseId}
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
            value={formData.amount}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status *
          </label>
          <select
            id="status"
            name="status"
            required
            value={formData.status}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
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
            value={formData.reference}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Check # or transaction ID"
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
            value={formData.notes}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Optional notes"
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
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
