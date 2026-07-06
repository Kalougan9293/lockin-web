import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { DashboardWorkspace } from "@/components/dashboard/DashboardWorkspace";
import { ClientShell } from "@/components/layout/ClientShell";
import {
  getImpersonatedUserId,
  getImpersonationDisplayContext,
  resolveDashboardUserId,
} from "@/lib/admin/impersonation";
import { isAdminEmail } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/lib/auth/session";
import { loadDashboardDataForUser } from "@/lib/dashboard/load-dashboard-data";
import { DEMO_SEARCH_PARAM, shouldUseDemoWorkspace } from "@/lib/mvp-demo";

export const dynamic = "force-dynamic";

type ClientDashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ClientDashboardPage({
  searchParams,
}: ClientDashboardPageProps) {
  const params = await searchParams;
  const demoParam = params[DEMO_SEARCH_PARAM];
  const isEphemeralDemo = demoParam === "1" || demoParam?.[0] === "1";

  const user = await getCurrentUser();
  const isDemoWorkspace = shouldUseDemoWorkspace(isEphemeralDemo, Boolean(user));

  let initialDisplayName: string | null = null;

  if (user && !isEphemeralDemo) {
    initialDisplayName =
      String(user.user_metadata?.prenom_client ?? "").trim() || null;

    const impersonatedId = await getImpersonatedUserId();
    if (isAdminEmail(user.email) && !impersonatedId) {
      redirect("/admin");
    }
  } else if (!user && !shouldUseDemoWorkspace(isEphemeralDemo, false)) {
    redirect("/login");
  }

  const impersonation = isDemoWorkspace
    ? null
    : await getImpersonationDisplayContext();
  const dashboardUserId = isDemoWorkspace
    ? null
    : await resolveDashboardUserId();

  const initialDashboardData = dashboardUserId
    ? await loadDashboardDataForUser(dashboardUserId)
    : null;

  return (
    <ClientShell
      initialDisplayName={initialDisplayName}
      isDemoWorkspace={isDemoWorkspace}
    >
      {impersonation ? <ImpersonationBanner context={impersonation} /> : null}
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-brand-muted">
            Chargement de vos tableaux…
          </div>
        }
      >
        <DashboardWorkspace
          impersonationActive={Boolean(impersonation)}
          initialDashboardData={initialDashboardData}
          isDemoWorkspace={isDemoWorkspace}
        />
      </Suspense>
    </ClientShell>
  );
}
