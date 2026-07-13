"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { LockInLogo } from "@/components/brand/LockInLogo";
import { fredoka } from "@/lib/fonts/fredoka";

type DesktopOnlyScreenProps = {
  /** Lien à copier (ex. dashboard, démo). Par défaut : page actuelle. */
  copyUrl?: string;
};

export function DesktopOnlyScreen({ copyUrl }: DesktopOnlyScreenProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const url =
      copyUrl?.trim() ||
      (typeof window !== "undefined" ? window.location.href : "");

    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copiez ce lien pour l'ouvrir sur votre ordinateur :", url);
    }
  }, [copyUrl]);

  return (
    <div className="flex min-h-screen flex-col bg-brand-dark">
      <header className="border-b border-white/10 px-6 py-4">
        <LockInLogo />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="pointer-events-none mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/10 text-4xl">
          💻
        </div>

        <h1
          className={`${fredoka.className} max-w-sm text-2xl font-bold leading-snug text-white`}
        >
          LockIn est pensé pour ordinateur
        </h1>

        <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-muted">
          Découvrez LockIn sur mobile, gérez vos relances sur PC. Importez vos
          factures, configurez vos messages et suivez vos impayés sur un grand
          écran.
        </p>

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-xl bg-brand-accent px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {copied ? "Lien copié !" : "Copier le lien pour mon PC"}
          </button>

          <Link
            href="/"
            className="rounded-xl border border-white/10 px-6 py-3.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/5"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
