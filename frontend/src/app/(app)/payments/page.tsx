"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPayments, Payment } from "@/services/paymentApi";
import PageHeader from "@/components/PageHeader";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";

const statusColors: Record<Payment["status"], string> = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-600",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const data = await getPayments();
        setPayments(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load payments",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  if (loading) return <LoadingState message="Loading payments..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <PageHeader
            title="Payments"
            description={
              payments.length > 0
                ? `${payments.length} payments`
                : "Track rent payments"
            }
          />
          <Link
            href="/payments/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex-shrink-0"
          >
            Record Payment
          </Link>
        </div>

        {payments.length === 0 ? (
          <EmptyState message="No payments recorded yet." />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Tenant
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Method
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(payment.paymentDate).toLocaleDateString(
                          "en-US",
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {payment.tenant
                          ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(Number(payment.amount))}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                        {payment.method.replace("_", " ")}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[payment.status] || "bg-gray-100 text-gray-600"}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <Link
                          href={`/payments/${payment.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
