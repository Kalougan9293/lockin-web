"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { ColumnDef, RelanceStep, RelanceStepChannel } from "@/types/tableau";
import {
  MAX_RELANCES,
  buildDefaultRelanceStepsForUi,
  createRelanceStep,
  defaultSmsTemplateForStep,
  getTemplateBubbles,
  normalizeRelanceStepChannel,
  relanceStepsLookUnconfigured,
  validateRelanceStepsOrder,
} from "@/types/tableau";

type TableauConfigModalProps = {
  open: boolean;
  initialSteps: RelanceStep[];
  initialCcCreditor: boolean;
  leftColumns: ColumnDef[];
  onClose: () => void;
  onSubmit: (payload: {
    relanceSteps: RelanceStep[];
    ccCreditor: boolean;
  }) => void;
};

const SMS_MAX_LENGTH = 160;

/** MVP : masquer SMS / Les 2 dans Configurer jusqu'à activation Twilio. */
const SMS_CHANNELS_UI_ENABLED = false;

const RELANCE_CHANNEL_OPTIONS = [
  { value: "email", label: "Email", disabled: false },
  {
    value: "sms",
    label: "SMS (bientôt)",
    disabled: !SMS_CHANNELS_UI_ENABLED,
  },
  {
    value: "both",
    label: "Les 2 (bientôt)",
    disabled: !SMS_CHANNELS_UI_ENABLED,
  },
] as const satisfies ReadonlyArray<{
  value: RelanceStepChannel;
  label: string;
  disabled: boolean;
}>;

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-brand-muted/50 focus:border-white/25 focus:ring-1 focus:ring-white/10";

const delayInputClass =
  "box-border w-[3rem] max-w-full shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-0.5 py-1.5 text-center text-sm tabular-nums text-white outline-none focus:border-amber-400/35 focus:ring-1 focus:ring-amber-400/15";

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

const CONFIG_ROW_HEIGHT_BASE = "min-h-[8rem]";
const CONFIG_ROW_HEIGHT_BOTH = "min-h-[14rem]";
const FLASH_ERROR_MS = 4500;

function channelIncludesSms(channel: RelanceStepChannel): boolean {
  return channel === "sms" || channel === "both";
}

function channelIncludesEmail(channel: RelanceStepChannel): boolean {
  return channel === "email" || channel === "both";
}

function configRowHeightClass(channel: RelanceStepChannel): string {
  return channel === "both" ? CONFIG_ROW_HEIGHT_BOTH : CONFIG_ROW_HEIGHT_BASE;
}

function normalizeStepForUi(step: RelanceStep): RelanceStep {
  let channel = normalizeRelanceStepChannel(step.channel);
  if (!SMS_CHANNELS_UI_ENABLED && channel !== "email") {
    channel = "email";
  }
  const needsSms =
    SMS_CHANNELS_UI_ENABLED && (channel === "sms" || channel === "both");

  return {
    ...step,
    channel,
    smsTemplate:
      step.smsTemplate?.trim() ||
      (needsSms ? defaultSmsTemplateForStep(step.days) : ""),
  };
}

export function TableauConfigModal({
  open,
  initialSteps,
  initialCcCreditor,
  leftColumns,
  onClose,
  onSubmit,
}: TableauConfigModalProps) {
  const [steps, setSteps] = useState<RelanceStep[]>(initialSteps);
  const [ccCreditor, setCcCreditor] = useState(initialCcCreditor);
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

    const next = source.map((step) => normalizeStepForUi(step));
    setSteps(next);
    setCcCreditor(initialCcCreditor);
    setActiveStepId(next[0]?.id ?? null);
    setFlashError(null);
  }, [open, initialSteps, initialCcCreditor]);

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

  function handleChannelChange(id: string, raw: string) {
    if (!SMS_CHANNELS_UI_ENABLED && raw !== "email") return;

    const channel = normalizeRelanceStepChannel(raw);

    setSteps((current) =>
      current.map((step) => {
        if (step.id !== id) return step;

        const next: RelanceStep = { ...step, channel };

        if (
          (channel === "sms" || channel === "both") &&
          !step.smsTemplate.trim()
        ) {
          next.smsTemplate = defaultSmsTemplateForStep(step.days);
        }

        return next;
      }),
    );
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
    if (!step || !channelIncludesEmail(step.channel)) return;

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

    for (let index = 0; index < steps.length; index += 1) {
      const step = steps[index];

      if (channelIncludesEmail(step.channel) && !step.messageTemplate.trim()) {
        showFlashError(
          `Renseignez le message e-mail pour la relance n°${index + 1}.`,
        );
        return;
      }

      if (channelIncludesSms(step.channel)) {
        if (!step.smsTemplate.trim()) {
          showFlashError(
            `Renseignez le message SMS pour la relance n°${index + 1}.`,
          );
          return;
        }
        if (step.smsTemplate.length > SMS_MAX_LENGTH) {
          showFlashError(
            `Le SMS de la relance n°${index + 1} ne doit pas dépasser ${SMS_MAX_LENGTH} caractères.`,
          );
          return;
        }
      }
    }

    onSubmit({
      relanceSteps: steps.map((step) => normalizeStepForUi(step)),
      ccCreditor,
    });
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
        <table className="w-full table-fixed border-collapse text-sm">
          <thead className="sticky top-0 z-[1] bg-brand-surface/95 backdrop-blur-sm">
            <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wide">
              <th className="w-[6.5rem] px-2 py-3 text-center text-brand-muted sm:w-[7rem]">
                Relance
              </th>
              <th className="w-[7.25rem] border-l border-white/[0.08] bg-amber-500/[0.07] px-1 py-3 text-center text-amber-100 sm:w-[7.5rem]">
                Délai
              </th>
              <th className="w-[8.5rem] border-l border-white/[0.08] bg-violet-500/[0.07] px-2 py-3 text-center text-violet-100 sm:w-[9rem]">
                Canal
              </th>
              <th className="border-l border-white/[0.08] bg-sky-500/[0.06] px-4 py-3 text-center text-sky-100">
                Message
              </th>
              <th
                className="w-12 border-l border-white/[0.08] px-2 py-3"
                aria-label="Actions"
              />
            </tr>
          </thead>
          <tbody>
            {steps.map((step, index) => {
              const isActive = activeStepId === step.id;
              const canRemove = steps.length > 1;
              const rowHeightClass = configRowHeightClass(step.channel);
              const showEmail = channelIncludesEmail(step.channel);
              const showSms = channelIncludesSms(step.channel);

              return (
                <tr
                  key={step.id}
                  className={`border-b border-white/[0.06] transition-colors ${rowHeightClass} ${
                    isActive ? "bg-white/[0.03]" : "hover:bg-white/[0.015]"
                  }`}
                >
                  <td className="p-0 align-middle sm:px-0">
                    <div
                      className={`flex ${rowHeightClass} items-center justify-center px-3 sm:px-4`}
                    >
                      <span className="text-sm font-medium text-violet-100/90">
                        Relance {index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="overflow-hidden border-l border-white/[0.08] bg-amber-500/[0.04] p-0 align-middle">
                    <div
                      className={`flex ${rowHeightClass} min-w-0 flex-col items-center justify-center px-1.5 py-2 sm:px-2`}
                    >
                      <div className="flex min-w-0 max-w-full items-center justify-center gap-0.5">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={step.days}
                          onChange={(event) =>
                            handleDaysChange(step.id, event.target.value)
                          }
                          onFocus={() => setActiveStepId(step.id)}
                          aria-label={`Jours pour la relance n°${index + 1}`}
                          className={`${delayInputClass} border-amber-400/15`}
                        />
                        <span className="shrink-0 text-[11px] leading-none text-amber-100/70">
                          jours
                        </span>
                      </div>
                      <p className="mt-1.5 w-full min-w-0 px-0.5 text-center text-[9px] leading-[1.35] text-amber-100/50">
                        par rapport à la
                        <br />
                        date d&apos;échéance
                      </p>
                    </div>
                  </td>
                  <td className="border-l border-white/[0.08] bg-violet-500/[0.04] p-0 align-middle">
                    <div
                      className={`flex ${rowHeightClass} flex-col items-center justify-center px-3`}
                    >
                      <select
                        value={step.channel}
                        onChange={(event) =>
                          handleChannelChange(step.id, event.target.value)
                        }
                        onFocus={() => setActiveStepId(step.id)}
                        aria-label={`Canal pour la relance n°${index + 1}`}
                        className={`${inputClass} border-violet-400/15 text-xs focus:border-violet-400/35 focus:ring-violet-400/15`}
                      >
                        {RELANCE_CHANNEL_OPTIONS.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                            className={
                              option.disabled
                                ? "bg-brand-dark text-brand-muted"
                                : "bg-brand-dark"
                            }
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="border-l border-white/[0.08] bg-sky-500/[0.04] p-0 align-middle">
                    <div
                      className={`flex ${rowHeightClass} flex-col justify-center gap-3 px-4 py-3`}
                    >
                      {showEmail ? (
                        <div className="min-h-0 flex-1 space-y-1">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-sky-200/60">
                            E-mail
                          </span>
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
                            rows={showSms ? 4 : 5}
                            className={`${inputClass} min-h-[6rem] resize-none border-sky-400/15 py-2 text-left leading-relaxed focus:border-sky-400/35 focus:ring-sky-400/15 ${
                              showSms ? "sm:min-h-[5.5rem]" : "sm:min-h-[7.5rem]"
                            }`}
                            placeholder="Bonjour [Nom], votre facture à échéance le [Échéance]…"
                          />
                        </div>
                      ) : null}

                      {showSms ? (
                        <div className="min-h-0 shrink-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-200/60">
                              SMS
                            </span>
                            <span className="text-[10px] tabular-nums text-brand-muted">
                              {step.smsTemplate.length}/{SMS_MAX_LENGTH}
                            </span>
                          </div>
                          <textarea
                            value={step.smsTemplate}
                            maxLength={SMS_MAX_LENGTH}
                            rows={3}
                            onChange={(event) =>
                              updateStep(step.id, {
                                smsTemplate: event.target.value,
                              })
                            }
                            onFocus={() => setActiveStepId(step.id)}
                            className={`${inputClass} resize-none border-emerald-400/15 py-2 text-left leading-snug focus:border-emerald-400/35 focus:ring-emerald-400/15`}
                            placeholder="Bonjour [Nom], facture [Référence] à échéance le [Échéance]…"
                          />
                          <p className="text-[10px] text-brand-muted/80">
                            Texte brut uniquement, {SMS_MAX_LENGTH} caractères max.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="border-l border-white/[0.08] p-0 align-middle">
                    <div
                      className={`flex ${rowHeightClass} items-center justify-center px-2`}
                    >
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
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <td colSpan={5} className="px-4 py-4 sm:px-6">
                <label className="flex cursor-pointer items-center justify-center gap-3">
                  <input
                    type="checkbox"
                    checked={ccCreditor}
                    onChange={(event) => setCcCreditor(event.target.checked)}
                    className="h-4 w-4 shrink-0 rounded border-white/20 bg-white/[0.04] text-brand-accent focus:ring-brand-accent/40"
                  />
                  <span className="text-sm font-medium text-white">
                    Me mettre en copie (CC) sur chaque relance e-mail
                  </span>
                </label>
              </td>
            </tr>
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
              title="Insérer dans le message e-mail actif"
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
