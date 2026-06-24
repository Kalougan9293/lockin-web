import Link from "next/link";
import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-white/10 bg-brand-card p-8 shadow-xl shadow-black/20">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              {description}
            </p>
          ) : null}
        </div>
        {children}
        {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
      </div>
      <p className="mt-6 text-center text-sm text-brand-muted">
        <Link href="/" className="transition-colors hover:text-white">
          ← Retour à l&apos;accueil
        </Link>
      </p>
    </main>
  );
}
