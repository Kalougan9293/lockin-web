"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { ColumnDef, RelanceStep } from "@/types/tableau";
import {
  MAX_RELANCES,
  createRelanceStep,
  getTemplateBubbles,
  relanceDaysHint,
} from "@/types/tableau";

type TableauConfigModalProps = {
  open: boolean;
  initialSteps: RelanceStep[];
  leftColumns: ColumnDef[];
  onClose: () => void;
  onSubmit: (steps: RelanceStep[]) => void;
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-brand-muted/50 focus:border-white/25 focus:ring-1 focus:ring-white/10";

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  current: string,
  token: string,
): { value: string; cursor: number } {
  const start = textarea.selectionStart ?? current.length;
  const end = textarea.selectionEnd ?? current.length;
  const next = current.slice(0, start) + token + current.slice(end);
  return { value: next, cursor: start + token.length };
}

const CONFIG_ROW_HEIGHT = "h-[5.5rem]";

export function TableauConfigModal({
  open,
  initialSteps,
  leftColumns,
  onClose,
  onSubmit,
}: TableauConfigModalProps) {
  const [steps, setSteps] = useState<RelanceStep[]>(initialSteps);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const messageRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const templateBubbles = getTemplateBubbles(leftColumns);

  useEffect(() => {
    if (!open) return;

    const next = initialSteps.map((step) => ({ ...step }));
    setSteps(next);
    setActiveStepId(next[0]?.id ?? null);
  }, [open, initialSteps]);

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

  function updateStep(id: string, patch: Partial<RelanceStep>) {
    setSteps((current) =>
      current.map((step) => (step.id === id ? { ...step, ...patch } : step)),
    );
  }

  function handleDaysChange(id: string, raw: string) {
    if (raw === "" || raw === "-") {
      updateStep(id, { days: 0 });
      return;
    }

    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      updateStep(id, { days: parsed });
    }
  }

  function removeStep(id: string) {
    setSteps((current) => {
      if (current.length <= 1) return current;
      const next = current.filter((step) => step.id !== id);
      if (activeStepId === id) {
        setActiveStepId(next[0]?.id ?? null);
      }
      return next;
    });
  }

  function addStep() {
    setSteps((current) => {
      if (current.length >= MAX_RELANCES) return current;
      const next = [...current, createRelanceStep()];
      setActiveStepId(next[next.length - 1].id);
      return next;
    });
  }

  function insertBubble(label: string) {
    const stepId = activeStepId ?? steps[0]?.id;
    if (!stepId) return;

    const token = `[${label}]`;
    const textarea = messageRefs.current[stepId];
    const step = steps.find((entry) => entry.id === stepId);
    if (!step) return;

    if (textarea) {
      const { value, cursor } = insertAtCursor(textarea, step.messageTemplate, token);
      updateStep(stepId, { messageTemplate: value });
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(cursor, cursor);
      });
      return;
    }

    updateStep(stepId, { messageTemplate: step.messageTemplate + token });
  }

  function handleSave() {
    onSubmit(steps);
    onClose();
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tableau-config-title"
        className="relative z-10 flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-brand-card shadow-2xl shadow-black/50"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <h2 id="tableau-config-title" className="text-base font-semibold text-white sm:text-lg">
            Configuration des relances
          </h2>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-brand-muted transition-colors hover:border-white/20 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-brand-accent px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Enregistrer
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead className="sticky top-0 z-[1] bg-brand-surface/95 backdrop-blur-sm">
              <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wide">
                <th className="w-10 px-3 py-3 text-left text-brand-muted sm:px-4">#</th>
                <th className="w-[11rem] border-l border-white/[0.08] bg-violet-500/[0.08] px-4 py-3 text-center text-violet-200 sm:w-[12rem]">
                  Nom
                </th>
                <th className="w-[10.5rem] border-l border-white/[0.08] bg-amber-500/[0.07] px-4 py-3 text-center text-amber-100 sm:w-[11.5rem]">
                  Délai
                </th>
                <th className="border-l border-white/[0.08] bg-sky-500/[0.06] px-4 py-3 text-center text-sky-100">
                  Message
                </th>
                <th className="w-12 border-l border-white/[0.08] px-2 py-3" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {steps.map((step, index) => {
                const isActive = activeStepId === step.id;
                const canRemove = steps.length > 1;

                return (
                  <tr
                    key={step.id}
                    className={`border-b border-white/[0.06] transition-colors ${CONFIG_ROW_HEIGHT} ${
                      isActive ? "bg-white/[0.03]" : "hover:bg-white/[0.015]"
                    }`}
                  >
                    <td className="p-0 align-middle sm:px-0">
                      <div
                        className={`flex ${CONFIG_ROW_HEIGHT} items-center justify-center px-3 tabular-nums text-brand-muted sm:px-4`}
                      >
                        {index + 1}
                      </div>
                    </td>
                    <td className="border-l border-white/[0.08] bg-violet-500/[0.04] p-0 align-middle">
                      <div
                        className={`flex ${CONFIG_ROW_HEIGHT} items-center justify-center px-4`}
                      >
                        <input
                          type="text"
                          value={step.name}
                          onChange={(event) =>
                            updateStep(step.id, { name: event.target.value })
                          }
                          onFocus={() => setActiveStepId(step.id)}
                          aria-label={`Nom de la relance n°${index + 1}`}
                          className={`${inputClass} border-violet-400/15 text-center focus:border-violet-400/35 focus:ring-violet-400/15`}
                        />
                      </div>
                    </td>
                    <td className="border-l border-white/[0.08] bg-amber-500/[0.04] p-0 align-middle">
                      <div
                        className={`flex ${CONFIG_ROW_HEIGHT} flex-col items-center justify-center px-4`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={step.days}
                            onChange={(event) =>
                              handleDaysChange(step.id, event.target.value)
                            }
                            onFocus={() => setActiveStepId(step.id)}
                            aria-label={`Jours pour la relance n°${index + 1}`}
                            className={`${inputClass} w-14 shrink-0 border-amber-400/15 text-center tabular-nums focus:border-amber-400/35 focus:ring-amber-400/15`}
                          />
                          <span className="text-xs text-amber-100/70">j</span>
                        </div>
                        <p className="mt-1 text-center text-[10px] leading-tight text-amber-100/50">
                          {relanceDaysHint(index)}
                        </p>
                      </div>
                    </td>
                    <td className="border-l border-white/[0.08] bg-sky-500/[0.04] p-0 align-middle">
                      <div
                        className={`flex ${CONFIG_ROW_HEIGHT} items-center justify-center px-4`}
                      >
                        <textarea
                          ref={(node) => {
                            messageRefs.current[step.id] = node;
                          }}
                          id={`message-${step.id}`}
                          value={step.messageTemplate}
                          onChange={(event) =>
                            updateStep(step.id, {
                              messageTemplate: event.target.value,
                            })
                          }
                          onFocus={() => setActiveStepId(step.id)}
                          rows={2}
                          className={`${inputClass} resize-none border-sky-400/15 py-1 text-center leading-snug focus:border-sky-400/35 focus:ring-sky-400/15`}
                          placeholder="Bonjour [Nom], votre facture du [Date]…"
                        />
                      </div>
                    </td>
                    <td className="border-l border-white/[0.08] p-0 align-middle">
                      <div className={`flex ${CONFIG_ROW_HEIGHT} items-center justify-center px-2`}>
                        {canRemove ? (
                          <button
                            type="button"
                            onClick={() => removeStep(step.id)}
                            aria-label={`Supprimer ${step.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl font-medium leading-none text-red-500 transition-colors hover:bg-red-500/15 hover:text-red-400"
                          >
                            ×
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <footer className="shrink-0 space-y-4 border-t border-white/10 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
            <span className="text-xs font-medium text-brand-muted">Variables :</span>
            {templateBubbles.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => insertBubble(label)}
                title="Insérer dans le message actif"
                className="rounded-md border border-violet-400/25 bg-violet-500/10 px-2 py-0.5 font-mono text-[11px] text-violet-100 transition-colors hover:border-violet-300/40 hover:bg-violet-500/20"
              >
                [{label}]
              </button>
            ))}
          </div>

          {steps.length < MAX_RELANCES ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={addStep}
                className="flex items-center gap-2 rounded-xl border border-violet-400/35 bg-gradient-to-r from-violet-500/25 to-fuchsia-500/20 px-6 py-2.5 text-base font-semibold text-violet-50 shadow-sm shadow-violet-900/25 transition-all hover:border-violet-300/50 hover:from-violet-500/35 hover:to-fuchsia-500/30"
              >
                <span className="text-xl leading-none">+</span>
                Ajouter une relance
              </button>
            </div>
          ) : (
            <p className="text-center text-sm text-brand-muted">
              Maximum {MAX_RELANCES} relances atteint.
            </p>
          )}

          <p className="text-center text-xs tabular-nums text-brand-muted">
            {steps.length} / {MAX_RELANCES}
          </p>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
