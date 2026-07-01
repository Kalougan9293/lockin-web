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

  return (
    <div className="flex w-full min-w-0 items-center gap-1 px-0.5">
      <div
        className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border px-1.5 py-1 ${stepStyle.accent === "green" ? "border-emerald-400/20 bg-emerald-500/10" : stepStyle.accent === "yellow" ? "border-amber-400/20 bg-amber-400/10" : stepStyle.accent === "orange" ? "border-orange-400/20 bg-orange-500/10" : stepStyle.accent === "red" ? "border-rose-400/20 bg-rose-500/10" : "border-fuchsia-400/20 bg-fuchsia-500/10"}`}
        title={badgeTitle}
      >
        <RelanceStatusDot
          status={status}
          animate={status === "scheduled"}
          size="sm"
        />
        <span
          className={`min-w-0 truncate text-[11px] font-medium tabular-nums leading-tight ${styles.text} ${paidStrikeClass}`}
        >
          {badgeLabel}
        </span>
      </div>
      <button
        type="button"
        onClick={onOpenTimeline}
        aria-label="Voir la timeline des relances"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-brand-muted transition-colors hover:border-violet-400/30 hover:bg-violet-500/15 hover:text-violet-100"
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
