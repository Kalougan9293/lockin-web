type RecoveryBadgeProps = {
  onClick: () => void;
  fullWidth?: boolean;
};

export function RecoveryBadge({ onClick, fullWidth = false }: RecoveryBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md bg-red-500/35 font-bold leading-tight text-red-50 shadow-[0_0_14px_rgba(239,68,68,0.45)] ring-1 ring-red-400/70 transition-colors hover:bg-red-500/45 ${
        fullWidth
          ? "pointer-events-auto box-border flex w-full max-w-full items-center justify-center gap-1.5 overflow-visible whitespace-nowrap px-2.5 py-1.5 text-sm"
          : "whitespace-nowrap px-1.5 py-1 text-[10px] sm:text-[11px]"
      }`}
      title="Ouvrir l'assistance recouvrement"
    >
      <span className="shrink-0" aria-hidden>
        🚨
      </span>
      <span>Recouvrement requis</span>
    </button>
  );
}
