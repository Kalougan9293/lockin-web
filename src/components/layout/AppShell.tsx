import { signOutAction } from "@/app/actions/auth";
import { LockInLogo } from "@/components/brand/LockInLogo";

type AppShellProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
};

export function AppShell({ title, description, children }: AppShellProps) {
  const showHeading = Boolean(title || description);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/5 bg-brand-dark/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-center gap-6 px-6">
          <LockInLogo />
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-center text-sm text-brand-muted transition-colors hover:border-white/20 hover:text-white"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        {showHeading ? (
          <div className="mb-8">
            {title ? (
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            ) : null}
            {description ? (
              <p className={`text-sm text-brand-muted ${title ? "mt-2" : ""}`}>
                {description}
              </p>
            ) : null}
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
