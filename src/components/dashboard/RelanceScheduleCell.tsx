import {
  getRelanceDisplayCompactLabel,
  getRelanceDisplayFullDate,
  getRelanceDisplayTitle,
  type RelanceDisplayItem,
  type RelanceDisplayStatus,
} from "@/lib/dashboard/relance-delivery-display";

type RelanceScheduleCellProps = {
  item: RelanceDisplayItem | null;
  paid?: boolean;
  missingDueDate?: boolean;
};

const STATUS_STYLES = {
  scheduled: {
    pulse: "bg-orange-400/30",
    dot: "animate-breathe bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.7)]",
    text: "text-orange-100/85",
  },
  queued: {
    pulse: "bg-sky-400/25",
    dot: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.55)]",
    text: "text-sky-100/85",
  },
  sent: {
    pulse: "bg-emerald-400/15",
    dot: "bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.6)]",
    text: "text-emerald-100/85",
  },
  failed: {
    pulse: "bg-rose-400/20",
    dot: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]",
    text: "text-rose-100/85",
  },
  overdue: {
    pulse: "bg-amber-400/20",
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.55)]",
    text: "text-amber-100/90",
  },
} as const;

export { STATUS_STYLES };

export function RelanceStatusDot({
  status,
  animate = false,
  size = "md",
}: {
  status: RelanceDisplayStatus;
  animate?: boolean;
  size?: "sm" | "md";
}) {
  const styles = STATUS_STYLES[status];
  const outer = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const inner = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  const shouldAnimate = animate || status === "scheduled";

  return (
    <span className={`relative flex ${outer} shrink-0 items-center justify-center`}>
      {shouldAnimate ? (
        <span
          aria-hidden
          className={`absolute inset-0 rounded-full ${styles.pulse} animate-breathe`}
        />
      ) : (
        <span aria-hidden className={`absolute inset-0 rounded-full ${styles.pulse}`} />
      )}
      <span
        aria-hidden
        className={`relative ${inner} rounded-full ${styles.dot} ${
          shouldAnimate ? "animate-breathe" : ""
        }`}
      />
    </span>
  );
}

export function RelanceScheduleCell({ item, paid = false, missingDueDate = false }: RelanceScheduleCellProps) {
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

  if (!item) {
    return (
      <span className="text-xs text-brand-muted/40" aria-hidden>
        —
      </span>
    );
  }

  const styles = STATUS_STYLES[item.status];
  const compactLabel = getRelanceDisplayCompactLabel(item);
  const fullDate = getRelanceDisplayFullDate(item);
  const statusTitle = getRelanceDisplayTitle(item.status);
  const paidStrikeClass = paid
    ? "line-through decoration-[2.5px] decoration-solid decoration-white/60"
    : "";
  const animatePulse = item.status === "scheduled";

  return (
    <div
      className="flex w-full min-w-0 flex-col items-center justify-center gap-1 px-0.5"
      title={`${statusTitle} le ${fullDate}`}
    >
      <RelanceStatusDot status={item.status} animate={animatePulse} />
      <span
        className={`whitespace-nowrap text-xs font-medium tabular-nums leading-tight ${styles.text} ${paidStrikeClass}`}
      >
        {compactLabel}
      </span>
    </div>
  );
}
