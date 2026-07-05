"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { useBodyWaitCursor } from "@/components/navigation/link-pending-feedback";
import { buildDemoDashboardUrl } from "@/lib/mvp-demo";

export function DemoEntryLink() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  useBodyWaitCursor(isPending);

  function handleStartDemo() {
    startTransition(() => {
      router.push(buildDemoDashboardUrl());
    });
  }

  return (
    <button
      type="button"
      onClick={handleStartDemo}
      disabled={isPending}
      aria-busy={isPending}
      className="demo-cta-btn demo-cta-pulse flex w-full items-center justify-center gap-2.5 rounded-xl bg-brand-accent px-8 py-4 font-semibold transition-opacity disabled:cursor-wait disabled:opacity-90 sm:w-auto"
    >
      {isPending ? (
        <>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
            aria-hidden
          />
          Chargement…
        </>
      ) : (
        "Commencer la démo"
      )}
    </button>
  );
}
