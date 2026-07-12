"use client";

import { useEffect, useState } from "react";

type RelancePreviewModalProps = {
  open: boolean;
  onClose: () => void;
  stepLabel: string;
  previewRequest: Record<string, unknown> | null;
  /** Aperçu minimal : rendu e-mail seulement. */
  simple?: boolean;
};

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready";
      subject: string;
      body: string;
      to: string;
      originalTo: string;
      sendEmail: boolean;
    }
  | { status: "error"; message: string };

export function RelancePreviewModal({
  open,
  onClose,
  stepLabel,
  previewRequest,
  simple = false,
}: RelancePreviewModalProps) {
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });

  useEffect(() => {
    if (!open || !previewRequest) {
      setPreview({ status: "idle" });
      return;
    }

    let cancelled = false;
    setPreview({ status: "loading" });

    const requestBody = JSON.stringify(previewRequest);

    fetch("/api/dashboard/relances/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          error?: string;
          subject?: string;
          body?: string;
          to?: string;
          originalTo?: string;
          sendEmail?: boolean;
        };

        if (!response.ok) {
          throw new Error(payload.error || "Impossible de charger l'aperçu.");
        }

        if (cancelled) return;

        setPreview({
          status: "ready",
          subject: payload.subject ?? "",
          body: payload.body ?? "",
          to: payload.to ?? "",
          originalTo: payload.originalTo ?? "",
          sendEmail: Boolean(payload.sendEmail),
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Erreur inattendue.";
        setPreview({ status: "error", message });
      });

    return () => {
      cancelled = true;
    };
  }, [open, previewRequest ? JSON.stringify(previewRequest) : null]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer l'aperçu"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="relance-preview-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-brand-card shadow-2xl shadow-black/60"
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <p
              id="relance-preview-title"
              className="text-xs font-semibold uppercase tracking-widest text-fuchsia-200/90"
            >
              Aperçu e-mail
            </p>
            <p className="mt-1 text-sm text-white/90">{stepLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-brand-muted transition-colors hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {preview.status === "loading" ? (
            <p className="text-center text-sm text-brand-muted">
              Chargement de l&apos;aperçu…
            </p>
          ) : preview.status === "error" ? (
            <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-100/90">
              {preview.message}
            </p>
          ) : preview.status === "ready" ? (
            <div className="space-y-4">
              {!simple ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-brand-muted">
                  <p>
                    <span className="text-white/70">Destinataire réel :</span>{" "}
                    {preview.originalTo || "—"}
                  </p>
                  <p className="mt-1">
                    <span className="text-white/70">Aperçu envoyé vers :</span>{" "}
                    <span className="text-fuchsia-200">{preview.to}</span>
                  </p>
                  <p className="mt-1">
                    <span className="text-white/70">Objet :</span>{" "}
                    {preview.subject}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-brand-muted">
                  <span className="text-white/70">Objet :</span>{" "}
                  {preview.subject}
                </p>
              )}

              {preview.sendEmail ? (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-white">
                  <iframe
                    title="Aperçu de l'e-mail de relance"
                    srcDoc={preview.body}
                    className="h-[min(52vh,520px)] w-full border-0"
                    sandbox=""
                  />
                </div>
              ) : (
                <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100/90">
                  Cette étape n&apos;utilise pas l&apos;e-mail (SMS seul).
                </p>
              )}
            </div>
          ) : null}
        </div>

        <footer className="flex justify-end border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/90 transition-colors hover:bg-white/10"
          >
            Fermer
          </button>
        </footer>
      </div>
    </div>
  );
}

function PreviewEyeIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1 1 0 0 1 0-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178a1 1 0 0 1 0 .644C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

export { PreviewEyeIcon };
