import { AdminKpiCards } from "@/components/admin/AdminKpiCards";
import { AdminProvidersTable } from "@/components/admin/AdminProvidersTable";
import { AppShell } from "@/components/layout/AppShell";
import { fetchAdminDashboardData } from "@/lib/admin/queries";
import { requireAdminUser } from "@/lib/admin/impersonation";

export default async function AdminDashboardPage() {
  await requireAdminUser();

  try {
    const { kpis, providers } = await fetchAdminDashboardData();

    return (
      <AppShell>
        <div className="space-y-8">
          <AdminKpiCards kpis={kpis} />
          <section>
            <h2 className="mb-4 text-center text-lg font-semibold text-white">
              Clients inscrits
            </h2>
            <AdminProvidersTable providers={providers} />
          </section>
        </div>
      </AppShell>
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de charger l'administration.";

    return (
      <AppShell>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          <p className="font-semibold">Erreur de chargement</p>
          <p className="mt-2 text-red-100/90">{message}</p>
          <p className="mt-3 text-xs text-red-200/70">
            Vérifiez que{" "}
            <code className="rounded bg-black/20 px-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            dans <code className="rounded bg-black/20 px-1">lockin-web/.env.local</code>{" "}
            est la clé <strong>service_role</strong> / <strong>secret</strong> (sans texte
            ajouté), puis redémarrez <code className="rounded bg-black/20 px-1">npm run dev</code>.
          </p>
        </div>
      </AppShell>
    );
  }
}
