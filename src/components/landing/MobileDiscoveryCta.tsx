import Link from "next/link";

import { LinkPendingSpinner } from "@/components/navigation/link-pending-feedback";

/** CTA accueil mobile : pas de démo, inscription / connexion possibles. */
export function MobileDiscoveryCta() {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 md:hidden">
      <p className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm leading-relaxed text-violet-100/90">
        La démo et le tableau de bord s&apos;utilisent sur{" "}
        <span className="font-medium text-white">ordinateur</span>. Créez votre
        compte dès maintenant, connectez-vous sur PC ensuite.
      </p>

      <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
        <Link
          href="/signup"
          prefetch
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-accent px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
        >
          <span>Créer un compte</span>
          <LinkPendingSpinner />
        </Link>
        <Link
          href="/login"
          prefetch
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/5 sm:w-auto"
        >
          <span>Se connecter</span>
          <LinkPendingSpinner />
        </Link>
      </div>
    </div>
  );
}
