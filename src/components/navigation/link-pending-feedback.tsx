"use client";

import { useEffect } from "react";
import { useLinkStatus } from "next/link";

/** Curseur « chargement » sur toute la page pendant une navigation. */
export function useBodyWaitCursor(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const previous = document.body.style.cursor;
    document.body.style.cursor = "wait";

    return () => {
      document.body.style.cursor = previous;
    };
  }, [active]);
}

/** À placer à l'intérieur d'un composant <Link> Next.js. */
export function LinkPendingSpinner({ className = "" }: { className?: string }) {
  const { pending } = useLinkStatus();
  useBodyWaitCursor(pending);

  if (!pending) {
    return (
      <span
        className={`inline-block h-3.5 w-3.5 shrink-0 ${className}`}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={`inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70 ${className}`}
      aria-hidden
    />
  );
}
