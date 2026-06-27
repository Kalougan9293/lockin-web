"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

export function LegalPageCloseButton() {
  const router = useRouter();

  const handleClose = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }, [router]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  return (
    <button
      type="button"
      onClick={handleClose}
      aria-label="Fermer"
      className="fixed right-4 top-20 z-40 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-brand-card/90 text-xl leading-none text-brand-muted backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white sm:right-6"
    >
      ×
    </button>
  );
}
