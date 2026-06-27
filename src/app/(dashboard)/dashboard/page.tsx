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
import { DEMO_SEARCH_PARAM, isMvpDemoMode } from "@/lib/mvp-demo";

export const dynamic = "force-dynamic";

type ClientDashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ClientDashboardPage({
  searchParams,
}: ClientDashboardPageProps) {
  const params = await searchParams;
  const demoParam = params[DEMO_SEARCH_PARAM];
  const isDemo = demoParam === "1" || demoParam?.[0] === "1";

  let initialDisplayName: string | null = null;

  if (!isDemo && !isMvpDemoMode()) {
    const user = await getCurrentUser();
    if (!user) {
      redirect("/login");
    }

    initialDisplayName =
      String(user.user_metadata?.prenom_client ?? "").trim() || null;

    const impersonatedId = await getImpersonatedUserId();
    if (isAdminEmail(user.email) && !impersonatedId) {
      redirect("/admin");
    }
  }

  const impersonation = isDemo ? null : await getImpersonationDisplayContext();
  const dashboardUserId =
    isDemo || isMvpDemoMode() ? null : await resolveDashboardUserId();

  const initialDashboardData = dashboardUserId
    ? await loadDashboardDataForUser(dashboardUserId)
    : null;

  return (
    <ClientShell initialDisplayName={initialDisplayName}>
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
        />
      </Suspense>
    </ClientShell>
  );
}
