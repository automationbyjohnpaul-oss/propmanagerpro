"use client";

import { useRouter } from "next/navigation";
import { createPayment, CreatePaymentInput } from "@/services/paymentApi";
import PageHeader from "@/components/PageHeader";
import PaymentForm from "@/components/forms/PaymentForm";

export default function NewPaymentPage() {
  const router = useRouter();

  async function handleSubmit(data: CreatePaymentInput) {
    await createPayment({
      ...data,
      paymentDate: data.paymentDate
        ? new Date(data.paymentDate).toISOString()
        : undefined,
    });
    router.push("/payments");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Record Payment"
          description="Record a new rent payment"
        />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <PaymentForm onSubmit={handleSubmit} onCancel={() => router.back()} />
        </div>
      </div>
    </div>
  );
}
