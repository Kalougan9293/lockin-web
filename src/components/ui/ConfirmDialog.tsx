"use client";

import { useEffect, useState } from "react";

import {
  InlinePendingSpinner,
  useBodyWaitCursor,
} from "@/components/navigation/link-pending-feedback";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pendingConfirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title = "Confirmation",
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  pendingConfirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  useBodyWaitCursor(isConfirming);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isConfirming) onCancel();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onCancel, isConfirming]);

  async function handleConfirm() {
    if (isConfirming) return;

    setIsConfirming(true);
    try {
      await Promise.resolve(onConfirm());
    } finally {
      setIsConfirming(false);
    }
  }

  if (!open) return null;

  const pendingLabel = pendingConfirmLabel ?? `${confirmLabel}…`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onCancel}
        disabled={isConfirming}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm disabled:cursor-wait"
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-brand-card p-6 shadow-2xl shadow-black/50"
      >
        <h2 id="confirm-dialog-title" className="text-center text-lg font-bold">
          {title}
        </h2>
        <p
          id="confirm-dialog-message"
          className="mt-3 text-center text-sm leading-relaxed text-brand-muted"
        >
          {message}
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-brand-muted transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isConfirming}
            aria-busy={isConfirming}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-wait disabled:opacity-90"
          >
            {isConfirming ? (
              <>
                <InlinePendingSpinner size="md" className="border-white/30 border-t-white" />
                {pendingLabel}
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
