"use client";

import { useEffect, useId, useRef, useState } from "react";

interface ConfirmActionModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  requireReason?: boolean;
  onReasonChange?: (reason: string) => void;
}

export default function ConfirmActionModal({
  title, message, confirmLabel, cancelLabel = "Cancel",
  onConfirm, onCancel, requireReason = false, onReasonChange,
}: ConfirmActionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [reason, setReason] = useState("");
  const titleId = useId();
  const messageId = useId();
  const reasonId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    cancelRef.current?.focus();
    return () => {
      dialog?.close();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-left text-gray-900 shadow-lg backdrop:bg-black/40"
    >
      <form onSubmit={(event) => {
        event.preventDefault();
        if (requireReason && !reason.trim()) return;
        onConfirm();
      }}>
        <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
        <p id={messageId} className="mt-3 whitespace-normal text-sm text-gray-600">
          {message}
        </p>
        {requireReason && (
          <div className="mt-4">
            <label htmlFor={reasonId} className="block text-sm font-medium text-gray-700">
              Reason
            </label>
            <textarea
              id={reasonId}
              required
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                onReasonChange?.(event.target.value);
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
            />
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={requireReason && !reason.trim()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}
