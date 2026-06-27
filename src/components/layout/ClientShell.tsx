import { LockInLogo } from "@/components/brand/LockInLogo";
import { AuthenticatedProfileMenu } from "@/components/auth/AuthenticatedProfileMenu";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";

type ClientShellProps = {
  children: React.ReactNode;
  initialDisplayName?: string | null;
};

export function ClientShell({ children, initialDisplayName = null }: ClientShellProps) {
  return (
    <UserPreferencesProvider>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-dark/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full max-w-[88rem] items-center justify-between px-4 sm:px-6 lg:px-8">
            <LockInLogo />
            <AuthenticatedProfileMenu initialDisplayName={initialDisplayName} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[88rem] flex-1 px-4 pt-5 pb-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </UserPreferencesProvider>
  );
}
