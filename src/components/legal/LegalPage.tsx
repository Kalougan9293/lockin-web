import Link from "next/link";

import { LegalPageCloseButton } from "@/components/legal/LegalPageCloseButton";

type LegalPageProps = {
  title: string;
  children: React.ReactNode;
};

export function LegalPage({ title, children }: LegalPageProps) {
  return (
    <article className="relative mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <LegalPageCloseButton />

      <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">{title}</h1>
      <p className="mb-10 text-sm text-brand-muted">
        Dernière mise à jour : 11 juin 2026 ·{" "}
        <Link href="/" className="text-violet-300 hover:text-violet-200">
          Retour à l&apos;accueil
        </Link>
      </p>

      <div className="legal-prose space-y-6 text-sm leading-relaxed text-brand-muted [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mt-6 [&_h3]:font-medium [&_h3]:text-violet-100 [&_li]:ml-5 [&_li]:list-disc [&_p]:text-brand-muted [&_strong]:text-white/90 [&_ul]:space-y-2">
        {children}
      </div>
    </article>
  );
}
