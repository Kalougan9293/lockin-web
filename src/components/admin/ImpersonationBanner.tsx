"use client";

import { useTransition } from "react";

import { stopImpersonationAction } from "@/app/actions/admin";
import type { ImpersonationContext } from "@/lib/admin/impersonation";

type ImpersonationBannerProps = {
  context: ImpersonationContext;
};

export function ImpersonationBanner({ context }: ImpersonationBannerProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-500/15 via-violet-500/10 to-fuchsia-500/10 px-4 py-3">
      <p className="text-sm text-amber-100/95">
        Mode assistance — vous visualisez le tableau de{" "}
        <span className="font-semibold text-white">{context.targetPrenom}</span>
        {context.targetSociete ? (
          <span className="text-brand-muted"> ({context.targetSociete})</span>
        ) : null}
        .
      </p>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => stopImpersonationAction())}
        className="shrink-0 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/15 disabled:opacity-60"
      >
        {isPending ? "Retour…" : "Quitter l'incarnation"}
      </button>
    </div>
  );
}
