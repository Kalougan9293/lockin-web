"use client";

import { useEffect } from "react";

import type { RelanceProgressState } from "@/lib/dashboard/relance-delivery-display";
import { fredoka } from "@/lib/fonts/fredoka";
import { dashboardColumnHeaderClassName } from "@/lib/dashboard/typography";
import { formatRelanceTiming, getRelanceStepStyle } from "@/types/tableau";

import { RelanceScheduleCell, RelanceStatusDot } from "./RelanceScheduleCell";

type RelanceProgressDrawerProps = {
  open: boolean;
  onClose: () => void;
  clientLabel: string;
  progress: RelanceProgressState | null;
  paid?: boolean;
  missingDueDate?: boolean;
};

function countSentSteps(progress: RelanceProgressState) {
  return progress.steps.filter((entry) => entry.item?.status === "sent").length;
}

export function RelanceProgressDrawer({
  open,
  onClose,
  clientLabel,
  progress,
  paid = false,
  missingDueDate = false,
}: RelanceProgressDrawerProps) {
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

  const totalSteps = progress?.steps.length ?? 0;
  const sentCount = progress ? countSentSteps(progress) : 0;
  const currentStep = progress ? progress.currentIndex + 1 : 0;
  const progressPercent =
    totalSteps > 0 ? Math.round((sentCount / totalSteps) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      <button
        type="button"
        aria-label="Fermer la timeline des relances"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-recovery-backdrop-in"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="relance-progress-drawer-title"
        className="relative z-10 flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-brand-card shadow-2xl shadow-black/60 animate-recovery-drawer-in sm:max-w-md"
      >
        <header className="relative shrink-0 border-b border-white/10 bg-gradient-to-r from-fuchsia-500/15 via-violet-500/10 to-transparent px-6 py-5">
          <div className="pr-10 text-center">
            <p
              id="relance-progress-drawer-title"
              className="text-xs font-semibold uppercase tracking-widest text-fuchsia-200/90"
            >
              Progression des relances
            </p>
            <p className={`${fredoka.className} mt-2 text-base font-semibold leading-snug text-white/95`}>
              {clientLabel}
            </p>
            {progress && totalSteps > 0 && !missingDueDate ? (
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-brand-muted">
                  <span>
                    Étape {currentStep} / {totalSteps}
                  </span>
                  <span>{sentCount} envoyée{sentCount > 1 ? "s" : ""}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-400 transition-all duration-500"
                    style={{ width: `${Math.max(progressPercent, sentCount > 0 ? 8 : 0)}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-brand-muted transition-colors hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {missingDueDate ? (
            <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-100/90">
              Renseignez la date d&apos;échéance pour afficher la timeline des
              relances.
            </p>
          ) : !progress || progress.steps.length === 0 ? (
            <p className="text-center text-sm text-brand-muted">
              Aucune relance configurée.
            </p>
          ) : (
            <ol className="relative space-y-0">
              {progress.steps.map((entry, index) => {
                const style = getRelanceStepStyle(entry.index);
                const headerColors =
                  style.accent === "green"
                    ? "text-emerald-100"
                    : style.accent === "yellow"
                      ? "text-amber-100"
                      : style.accent === "orange"
                        ? "text-orange-100"
                        : style.accent === "red"
                          ? "text-rose-100"
                          : "text-fuchsia-100";
                const isCurrent = index === progress.currentIndex;
                const status = entry.item?.status ?? "scheduled";
                const isLast = index === progress.steps.length - 1;

                return (
                  <li key={entry.step.id} className="relative flex gap-4 pb-8">
                    {!isLast ? (
                      <span
                        aria-hidden
                        className="absolute left-[0.6875rem] top-8 bottom-0 w-px bg-white/10"
                      />
                    ) : null}
                    <div className="flex w-6 shrink-0 flex-col items-center pt-0.5">
                      <RelanceStatusDot
                        status={status}
                        animate={status === "scheduled" && isCurrent}
                        size="sm"
                      />
                    </div>
                    <div
                      className={`min-w-0 flex-1 rounded-xl transition-colors ${
                        isCurrent
                          ? "border border-violet-400/25 bg-violet-500/[0.07] p-3 -m-3"
                          : "opacity-90"
                      }`}
                    >
                      <p
                        className={`${dashboardColumnHeaderClassName} ${headerColors}`}
                      >
                        Étape {entry.index + 1} — {formatRelanceTiming(entry.step.days)}
                      </p>
                      <div className="mt-3 flex min-h-[4rem] items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                        <RelanceScheduleCell
                          paid={paid}
                          missingDueDate={false}
                          item={entry.item}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}

              <li className="relative flex gap-4">
                <div className="flex w-6 shrink-0 flex-col items-center pt-0.5">
                  <span
                    className="flex h-3.5 w-3.5 rounded-full bg-red-400/80 ring-2 ring-red-300/50"
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`${dashboardColumnHeaderClassName} text-red-100/90`}
                  >
                    Après la dernière relance
                  </p>
                  <div className="mt-3 rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-3">
                    <p className="text-center text-sm leading-relaxed text-red-50/85">
                      Si la facture demeure impayée au-delà de votre dernier
                      délai, une procédure de recouvrement vous sera proposée
                      directement dans le tableau.
                    </p>
                  </div>
                </div>
              </li>
            </ol>
          )}
        </div>
      </aside>
    </div>
  );
}
