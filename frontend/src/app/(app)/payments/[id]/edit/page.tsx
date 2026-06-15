"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getPayment,
  updatePayment,
  Payment,
  CreatePaymentInput,
} from "@/services/paymentApi";
import PageHeader from "@/components/PageHeader";
import PaymentForm from "@/components/forms/PaymentForm";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";

export default function EditPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.id as string;

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPayment() {
      try {
        const data = await getPayment(paymentId);
        if (!data) {
          setError("Payment not found");
          return;
        }
        setPayment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load payment");
      } finally {
        setLoading(false);
      }
    }
    loadPayment();
  }, [paymentId]);

  async function handleSubmit(data: CreatePaymentInput) {
    await updatePayment(paymentId, {
      ...data,
      paymentDate: data.paymentDate
        ? new Date(data.paymentDate).toISOString()
        : undefined,
    });
    router.push("/payments");
    router.refresh();
  }

  if (loading) return <LoadingState message="Loading payment..." />;
  if (error || !payment)
    return <ErrorState message={error || "Payment not found"} />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Edit Payment" description="Update payment details" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <PaymentForm
            initialData={{
              amount: Number(payment.amount),
              paymentDate: payment.paymentDate,
              method: payment.method,
              status: payment.status,
              reference: payment.reference || "",
              notes: payment.notes || "",
              leaseId: payment.leaseId,
              tenantId: payment.tenantId,
            }}
            onSubmit={handleSubmit}
            submitLabel="Update Payment"
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </div>
  );
}
