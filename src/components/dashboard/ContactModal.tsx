"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { getProfileAction } from "@/app/actions/profile";
import { AuthField } from "@/components/auth/AuthField";
import { openContactMailto } from "@/lib/contact";

type ContactModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ContactModal({ open, onClose }: ContactModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setMessage("");
    setError(null);

    let cancelled = false;

    getProfileAction().then((profile) => {
      if (!cancelled) {
        setEmail(profile?.email?.trim() ?? "");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedEmail) {
      setError("Indiquez votre adresse email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Adresse email invalide.");
      return;
    }

    if (!trimmedMessage) {
      setError("Écrivez votre message.");
      return;
    }

    openContactMailto(trimmedEmail, trimmedMessage);
    onClose();
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-brand-card shadow-2xl shadow-black/50"
      >
        <header className="border-b border-white/10 px-6 py-4">
          <h2 id="contact-modal-title" className="text-center text-lg font-semibold text-white">
            Nous contacter
          </h2>
          <p className="mt-1 text-center text-xs text-brand-muted">
            Votre message s&apos;ouvrira dans votre application mail
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col px-6 py-5">
          <div className="space-y-4">
            <AuthField
              label="Mail"
              type="email"
              name="contact-email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vous@exemple.com"
            />

            <div className="space-y-2">
              <label
                htmlFor="contact-message"
                className="block text-sm font-medium text-white"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                name="contact-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={8}
                placeholder="Comment pouvons-nous vous aider ?"
                className="min-h-[10rem] w-full resize-y rounded-xl border border-white/10 bg-brand-dark px-4 py-3 text-sm leading-relaxed text-white placeholder:text-brand-muted/70 transition-colors focus:border-brand-accent/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
              />
            </div>
          </div>

          {error ? (
            <p className="mt-3 text-center text-sm text-red-400">{error}</p>
          ) : null}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-brand-muted transition-colors hover:bg-white/5 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Envoyer
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
