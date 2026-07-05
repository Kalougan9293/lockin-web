export function RouteLoadingFallback({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400"
        aria-hidden
      />
      <p className="text-sm text-brand-muted">{label}</p>
    </div>
  );
}
