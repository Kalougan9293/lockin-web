"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";

import { deleteAccountAction } from "@/app/actions/profile";

type DeleteAccountModalProps = {
  open: boolean;
  onClose: () => void;
};

export function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    setError(null);
    setConfirmText("");

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, isPending]);

  if (!open) return null;

  const canConfirm = confirmText.trim().toUpperCase() === "SUPPRIMER";

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canConfirm || isPending) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteAccountAction();
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className="w-full max-w-md rounded-2xl border border-red-400/25 bg-brand-dark p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="delete-account-title" className="text-lg font-semibold text-white">
          Supprimer mon compte
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-brand-muted">
          Cette action est <strong className="text-white">définitive</strong>.
          Tous vos tableaux, factures, relances et données de profil seront
          effacés. Cette opération ne peut pas être annulée.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block text-sm text-brand-muted">
            Tapez <strong className="text-white">SUPPRIMER</strong> pour confirmer
            <input
              type="text"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              autoComplete="off"
              disabled={isPending}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-brand-muted/50 focus:border-red-400/40 focus:ring-1 focus:ring-red-400/20 disabled:opacity-60"
              placeholder="SUPPRIMER"
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-brand-muted transition-colors hover:bg-white/5 hover:text-white disabled:opacity-60"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!canConfirm || isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Suppression…" : "Supprimer définitivement"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
