"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { activateLease, endLease, type Lease } from "@/services/leaseApi";
import ConfirmActionModal from "@/components/ConfirmActionModal";

interface LeaseRowActionsProps {
  lease: Lease;
  onReload: () => Promise<void>;
  onError: (error: string | null) => void;
}

export default function LeaseRowActions({
  lease,
  onReload,
  onError,
}: LeaseRowActionsProps) {
  const [loading, setLoading] = useState(false);
  const actionInFlight = useRef(false);
  const [confirmEndLease, setConfirmEndLease] = useState(false);

  async function handleAction(action: "activate" | "end") {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setConfirmEndLease(false);
    try {
      onError(null);
      setLoading(true);
      if (action === "activate") {
        await activateLease(lease.id);
      } else {
        await endLease(lease.id);
      }
      await onReload();
    } catch (err) {
      onError(
        err instanceof Error
          ? err.message
          : action === "activate"
            ? "Failed to activate lease"
            : "Failed to end lease",
      );
    } finally {
      actionInFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-end gap-3 whitespace-nowrap">
      <Link
        href={`/leases/${lease.id}/edit`}
        className="text-blue-600 hover:text-blue-800 font-medium"
      >
        Edit
      </Link>
      {lease.status === "PENDING" && (
        <button
          type="button"
          disabled={loading}
          onClick={() => handleAction("activate")}
          className="text-green-600 hover:text-green-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Activating..." : "Activate"}
        </button>
      )}
      {lease.status === "ACTIVE" && (
        <button
          type="button"
          disabled={loading}
          onClick={() => setConfirmEndLease(true)}
          className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Ending..." : "End Lease"}
        </button>
      )}
      {confirmEndLease && (
        <ConfirmActionModal
          title="End Lease"
          message="Are you sure you want to end this lease? This action will mark the lease as ENDED and it cannot currently be reopened."
          confirmLabel="End Lease"
          cancelLabel="Cancel"
          onConfirm={() => handleAction("end")}
          onCancel={() => setConfirmEndLease(false)}
        />
      )}
    </div>
  );
}
