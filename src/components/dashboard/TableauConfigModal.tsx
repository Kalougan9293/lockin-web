"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { ColumnDef, RelanceStep } from "@/types/tableau";
import {
  MAX_RELANCES,
  buildDefaultRelanceStepsForUi,
  createRelanceStep,
  getTemplateBubbles,
  relanceDaysHint,
  relanceStepsLookUnconfigured,
  validateRelanceStepsOrder,
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

const CONFIG_ROW_HEIGHT = "min-h-[8rem]";
const FLASH_ERROR_MS = 4500;

export function TableauConfigModal({
  open,
  initialSteps,
  leftColumns,
  onClose,
  onSubmit,
}: TableauConfigModalProps) {
  const [steps, setSteps] = useState<RelanceStep[]>(initialSteps);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [flashError, setFlashError] = useState<string | null>(null);
  const messageRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const templateBubbles = getTemplateBubbles(leftColumns);

  function showFlashError(message: string) {
    setFlashError(message);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      setFlashError(null);
      flashTimerRef.current = null;
    }, FLASH_ERROR_MS);
  }

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const source =
      initialSteps.length > 0 && !relanceStepsLookUnconfigured(initialSteps)
        ? initialSteps
        : buildDefaultRelanceStepsForUi();

    const next = source.map((step) => ({ ...step }));
    setSteps(next);
    setActiveStepId(next[0]?.id ?? null);
    setFlashError(null);
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
    const parsed =
      raw === "" || raw === "-"
        ? 0
        : Number.isNaN(Number.parseInt(raw, 10))
          ? null
          : Number.parseInt(raw, 10);

    if (parsed === null) return;

    setSteps((current) => {
      const next = current.map((step) =>
        step.id === id ? { ...step, days: parsed } : step,
      );
      const orderError = validateRelanceStepsOrder(next);
      if (orderError) {
        showFlashError(orderError);
        return current;
      }
      return next;
    });
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
      const lastDays = current[current.length - 1]?.days ?? 0;
      const next = [
        ...current,
        createRelanceStep({ days: lastDays + 7 }),
      ];
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
    const orderError = validateRelanceStepsOrder(steps);
    if (orderError) {
      showFlashError(orderError);
      return;
    }

    onSubmit(steps);
    onClose();
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tableau-config-title"
      className="fixed inset-0 z-[200] flex flex-col bg-brand-dark"
    >
      <header className="flex shrink-0 items-center border-b border-white/10 px-4 py-4 sm:px-8">
        <h2
          id="tableau-config-title"
          className="text-lg font-semibold text-white sm:text-xl"
        >
          Configuration des relances
        </h2>

        <div className="ml-auto flex shrink-0 justify-end gap-2">
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

        {flashError ? (
          <div
            role="alert"
            className="shrink-0 border-b border-rose-400/25 bg-rose-500/15 px-4 py-2.5 text-center text-sm text-rose-100 sm:px-8"
          >
            {flashError}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto px-4 sm:px-8">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-[1] bg-brand-surface/95 backdrop-blur-sm">
              <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wide">
                <th className="w-28 px-3 py-3 text-center text-brand-muted sm:px-4">
                  Relance
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
                        className={`flex ${CONFIG_ROW_HEIGHT} items-center justify-center px-3 sm:px-4`}
                      >
                        <span className="text-sm font-medium text-violet-100/90">
                          Relance {index + 1}
                        </span>
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
                          {relanceDaysHint()}
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
                          rows={5}
                          className={`${inputClass} min-h-[7.5rem] resize-none border-sky-400/15 py-2 text-left leading-relaxed focus:border-sky-400/35 focus:ring-sky-400/15`}
                          placeholder="Bonjour [Nom], votre facture à échéance le [Échéance]…"
                        />
                      </div>
                    </td>
                    <td className="border-l border-white/[0.08] p-0 align-middle">
                      <div className={`flex ${CONFIG_ROW_HEIGHT} items-center justify-center px-2`}>
                        {canRemove ? (
                          <button
                            type="button"
                            onClick={() => removeStep(step.id)}
                            aria-label={`Supprimer la relance ${index + 1}`}
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

        <footer className="shrink-0 space-y-4 border-t border-white/10 px-4 py-5 sm:px-8">
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
    </div>,
    document.body,
  );
}
