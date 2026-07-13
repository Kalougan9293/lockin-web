"use client";

import type { RelanceProgressState } from "@/lib/dashboard/relance-delivery-display";
import {
  getRelanceDisplayCompactLabel,
  getRelanceDisplayFullDate,
  getRelanceDisplayTitle,
} from "@/lib/dashboard/relance-delivery-display";
import { getRelanceStepStyle } from "@/types/tableau";

import { RelanceStatusDot, STATUS_STYLES } from "./RelanceScheduleCell";

type RelanceProgressCellProps = {
  progress: RelanceProgressState | null;
  paid?: boolean;
  missingDueDate?: boolean;
  onOpenTimeline: () => void;
};

export function RelanceProgressCell({
  progress,
  paid = false,
  missingDueDate = false,
  onOpenTimeline,
}: RelanceProgressCellProps) {
  if (missingDueDate) {
    return (
      <span
        className="text-center text-[11px] font-medium leading-tight text-rose-400/90"
        title="Renseignez la date d'échéance pour planifier les relances"
      >
        Échéance ?
      </span>
    );
  }

  if (!progress || progress.steps.length === 0) {
    return (
      <span className="text-xs text-brand-muted/40" aria-hidden>
        —
      </span>
    );
  }

  const { currentIndex, steps } = progress;
  const current = steps[currentIndex];
  const currentItem = current.item;
  const status = currentItem?.status ?? "scheduled";
  const styles = STATUS_STYLES[status];
  const stepStyle = getRelanceStepStyle(current.index);
  const badgeLabel = currentItem
    ? getRelanceDisplayCompactLabel(currentItem)
    : "—";
  const badgeTitle = currentItem
    ? `${getRelanceDisplayTitle(currentItem.status)} le ${getRelanceDisplayFullDate(currentItem)}`
    : undefined;
  const paidStrikeClass = paid
    ? "line-through decoration-[2.5px] decoration-solid decoration-white/60"
    : "";
  const accentTextClass =
    stepStyle.accent === "green"
      ? "text-emerald-100/95"
      : stepStyle.accent === "yellow"
        ? "text-amber-100/95"
        : stepStyle.accent === "orange"
          ? "text-orange-100/95"
          : stepStyle.accent === "red"
            ? "text-rose-100/95"
            : "text-fuchsia-100/95";
  const arrowButtonClass =
    status === "sent"
      ? "border-emerald-300/45 bg-emerald-500/10 text-emerald-100/85 hover:bg-emerald-500/20"
      : status === "queued"
        ? "border-sky-300/45 bg-sky-500/10 text-sky-100/85 hover:bg-sky-500/20"
        : status === "failed"
          ? "border-rose-300/45 bg-rose-500/10 text-rose-100/85 hover:bg-rose-500/20"
          : status === "overdue"
            ? "border-amber-300/45 bg-amber-500/10 text-amber-100/85 hover:bg-amber-500/20"
            : "border-orange-300/45 bg-orange-500/10 text-orange-100/85 hover:bg-orange-500/20";

  return (
    <div className="flex w-full min-w-0 items-center gap-1" title={badgeTitle}>
      <div className="flex min-w-0 flex-1 items-center justify-start gap-1.5">
        <RelanceStatusDot
          status={status}
          animate={status === "scheduled"}
          size="sm"
        />
        <span
          className={`min-w-0 truncate text-[13px] font-semibold tabular-nums leading-tight ${styles.text} ${accentTextClass} ${paidStrikeClass}`}
        >
          {badgeLabel}
        </span>
      </div>
      <button
        type="button"
        onClick={onOpenTimeline}
        aria-label="Voir la timeline des relances"
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors ${arrowButtonClass}`}
      >
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
}
