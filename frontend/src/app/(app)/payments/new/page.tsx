"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/api";
import {
  PAYMENT_RECOVERY_EVENT, getRecoveryBlock, listPaymentAttempts,
  reconcilePaymentAttempt, startPayment, submitSavedPayment,
  type PaymentAttempt, type RecoveryBlock,
} from "@/lib/paymentRecovery";
import PageHeader from "@/components/PageHeader";
import PaymentForm from "@/components/forms/PaymentForm";

interface RecoveryView {
  ready: boolean;
  attempts: { attempt: PaymentAttempt; block: RecoveryBlock | null }[];
  error?: string;
}
const SERVER_VIEW = JSON.stringify({ ready: false, attempts: [] });
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("focus", callback);
  window.addEventListener(PAYMENT_RECOVERY_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("focus", callback);
    window.removeEventListener(PAYMENT_RECOVERY_EVENT, callback);
  };
}
function snapshot(userId: string): string {
  try {
    return JSON.stringify({ ready: true, attempts: listPaymentAttempts(userId).map(attempt => ({ attempt, block: getRecoveryBlock(userId, attempt.key) })) });
  } catch {
    return JSON.stringify({ ready: true, attempts: [], error: "Payment recovery is unavailable. Check that you are signed into the original account and browser storage is available. Existing details have been preserved; do not create a replacement while an earlier payment is unresolved." });
  }
}

export default function NewPaymentPage() {
  const { user, loading } = useAuth();
  if (loading || !user) return <p className="p-6">Loading payment recovery…</p>;
  return <PaymentEntry key={user.id} userId={user.id} />;
}

function PaymentEntry({ userId }: { userId: string }) {
  const router = useRouter();
  const rawView = useSyncExternalStore(subscribe, () => snapshot(userId), () => SERVER_VIEW);
  const view: RecoveryView = JSON.parse(rawView);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitSeconds, setWaitSeconds] = useState(0);
  useEffect(() => {
    if (waitSeconds <= 0) return;
    const timer = window.setTimeout(() => setWaitSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [waitSeconds]);

  async function handleAction(action: () => Promise<unknown>, navigate: boolean) {
    if (busyRef.current) throw new Error("A payment action is already running.");
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await action();
      if (navigate) { router.push("/payments"); router.refresh(); }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The payment could not be confirmed. Keep the saved attempt for recovery.");
      if (cause instanceof ApiError && cause.status === 503) {
        setWaitSeconds(cause.retryAfter ?? 2);
      }
      throw cause;
    } finally { busyRef.current = false; setBusy(false); }
  }

  return <div className="min-h-screen bg-gray-50 p-6"><div className="max-w-2xl mx-auto space-y-5">
    <PageHeader title="Record Payment" description="Record a new rent payment" />
    {error && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">{error}</p>}
    {!view.ready ? <p>Checking saved payments…</p> : view.error ? <p role="alert" className="rounded-lg bg-amber-50 p-4 text-amber-900">{view.error}</p> : view.attempts.length ? <>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <h2 className="font-semibold">Saved payment needs confirmation</h2>
        <p className="mt-2 text-sm">This payment may already be recorded. Review the saved details, then retry the original request safely. Nothing is submitted automatically, and the details stay saved until its outcome is confirmed.</p>
      </div>
      {view.attempts.map(({ attempt, block }) => <RecoveryCard key={attempt.key} attempt={attempt} block={block} busy={busy} waitSeconds={waitSeconds}
        onRetry={() => { void handleAction(() => submitSavedPayment(userId, attempt.key), true).catch(() => {}); }}
        onResolve={outcome => { void handleAction(() => reconcilePaymentAttempt(userId, attempt.key, outcome), false).catch(() => {}); }} />)}
    </> : <fieldset disabled={busy} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <PaymentForm onSubmit={data => handleAction(() => startPayment(userId, data), true)} onCancel={() => router.back()} />
    </fieldset>}
    <a href="/payments" className="inline-block text-blue-700 underline">View payment records</a>
  </div></div>;
}

function RecoveryCard({ attempt, block, busy, waitSeconds, onRetry, onResolve }: {
  attempt: PaymentAttempt; block: RecoveryBlock | null; busy: boolean; waitSeconds: number;
  onRetry: () => void; onResolve: (outcome: "already-recorded" | "not-recorded") => void;
}) {
  const [outcome, setOutcome] = useState<"" | "already-recorded" | "not-recorded">("");
  const [confirmed, setConfirmed] = useState(false);
  const { data } = attempt;
  return <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
    <h3 className="font-semibold text-gray-900">Saved {new Date(attempt.createdAt).toLocaleString()}</h3>
    <dl className="grid grid-cols-2 gap-3 text-sm text-gray-700">
      <dt>Amount</dt><dd className="font-semibold">{data.amount.toLocaleString()}</dd>
      <dt>Payment date</dt><dd>{data.paymentDate ? new Date(data.paymentDate).toLocaleDateString() : "Assigned when first recorded"}</dd>
      <dt>Method</dt><dd>{data.method.replaceAll("_", " ")}</dd>
      <dt>Status</dt><dd>{data.status}</dd>
      <dt>Reference</dt><dd className="break-words whitespace-pre-wrap">{data.reference || "Not provided"}</dd>
      <dt>Notes</dt><dd className="break-words whitespace-pre-wrap">{data.notes || "Not provided"}</dd>
    </dl>
    <details className="text-sm text-gray-600"><summary className="cursor-pointer">Saved identifiers for checking records</summary>
      <p className="break-all mt-2">Lease: {data.leaseId}</p><p className="break-all">Tenant: {data.tenantId}</p><p className="break-all">Request: {attempt.key}</p>
    </details>
    {block && <p role="alert" className="text-sm text-red-800">{block.message}</p>}
    <button type="button" disabled={busy || !!block || waitSeconds > 0} onClick={onRetry} className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
      {busy ? "Checking payment…" : waitSeconds > 0 ? `Retry available in ${waitSeconds}s` : "Retry saved payment"}
    </button>
    <details className="border-t border-gray-200 pt-4 text-sm text-gray-700">
      <summary className="cursor-pointer font-medium">Resolve after checking payment records</summary>
      <p className="mt-3">Only resolve this attempt after confirming its outcome. If a request might still be processing, keep it saved and retry instead. Resolving this reminder does not change any payment record.</p>
      <a href="/payments" target="_blank" rel="noreferrer" className="inline-block my-3 text-blue-700 underline">Check payment records in a new tab</a>
      <label className="block">Confirmed outcome
        <select value={outcome} disabled={busy} onChange={event => { setOutcome(event.target.value as typeof outcome); setConfirmed(false); }} className="block w-full rounded border border-gray-300 p-2 mt-1">
          <option value="">Choose an outcome</option><option value="already-recorded">The payment is already recorded</option><option value="not-recorded">The payment was not recorded</option>
        </select>
      </label>
      <label className="flex gap-2 my-3"><input type="checkbox" checked={confirmed} disabled={busy || !outcome} onChange={event => setConfirmed(event.target.checked)} />I checked the records and confirmed this outcome. No request is still processing.</label>
      <button type="button" disabled={busy || !outcome || !confirmed} onClick={() => { if (outcome && confirmed) onResolve(outcome); }} className="rounded border border-gray-400 px-4 py-2 disabled:opacity-50">Resolve saved attempt</button>
    </details>
  </section>;
}
