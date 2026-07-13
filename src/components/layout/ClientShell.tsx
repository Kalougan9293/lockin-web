import { LockInLogo } from "@/components/brand/LockInLogo";
import { AuthenticatedProfileMenu } from "@/components/auth/AuthenticatedProfileMenu";
import { HeaderTodayDate } from "@/components/layout/HeaderTodayDate";
import { ResponsiveDesktopGate } from "@/components/layout/ResponsiveDesktopGate";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";
import { ImportZoneProvider } from "@/contexts/ImportZoneContext";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { DashboardSummaryProvider } from "@/contexts/DashboardSummaryContext";

type ClientShellProps = {
  children: React.ReactNode;
  initialDisplayName?: string | null;
  isDemoWorkspace?: boolean;
};

export function ClientShell({
  children,
  initialDisplayName = null,
  isDemoWorkspace = false,
}: ClientShellProps) {
  return (
    <ResponsiveDesktopGate>
      <UserPreferencesProvider>
        <ImportZoneProvider>
          <TutorialProvider>
            <DashboardSummaryProvider>
              <div className="flex min-h-screen flex-col">
                <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-dark/90 backdrop-blur-md">
                  <div className="relative mx-auto flex h-16 w-full max-w-[88rem] items-center justify-between px-4 sm:px-6 lg:px-8">
                    <LockInLogo />
                    <HeaderTodayDate />
                    <AuthenticatedProfileMenu
                      initialDisplayName={initialDisplayName}
                      isDemoWorkspace={isDemoWorkspace}
                    />
                  </div>
                </header>

                <main className="mx-auto w-full max-w-[88rem] flex-1 px-4 pt-5 pb-8 sm:px-6 lg:px-8">
                  {children}
                </main>
              </div>
            </DashboardSummaryProvider>
          </TutorialProvider>
        </ImportZoneProvider>
      </UserPreferencesProvider>
    </ResponsiveDesktopGate>
  );
}
