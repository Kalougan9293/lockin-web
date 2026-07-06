import { createAdminClient } from "@/lib/supabase/admin";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { isAdminEmail } from "@/lib/auth/redirect";
import { getActivityDomainFromAuthUser } from "@/lib/auth/client-from-user";
import { resolveMonthlyImportCount } from "@/lib/import/import-usage";

import {
  buildActivityDomainStats,
  type ActivityDomainStat,
} from "./activity-domain-stats";
import {
  buildVigilanceScore,
  compareVigilanceDesc,
  type VigilanceScore,
} from "./vigilance-score";

export type AdminKpis = {
  providerCount: number;
  invoiceCount: number;
  relanceCount: number;
};

export type AdminProviderRow = {
  id: string;
  prenom: string;
  nomSociete: string;
  email: string;
  invoiceCount: number;
  relanceCount: number;
  vigilance: VigilanceScore;
  dateInscription: string;
};

export type AdminDashboardData = {
  kpis: AdminKpis;
  providers: AdminProviderRow[];
  activityDomainStats: ActivityDomainStat[];
};

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const admin = createAdminClient();

  const [
    { count: invoiceCount, error: invoicesError },
    { data: clients, error: clientsError },
    { data: tableaux, error: tableauxError },
    { data: lignes, error: lignesError },
    authUsersResult,
  ] = await Promise.all([
    admin.from("lignes_factures").select("*", { count: "exact", head: true }),
    admin.from("clients_lockin").select("*").order("date_inscription", { ascending: false }),
    admin.from("tableaux").select("id, user_id"),
    admin.from("lignes_factures").select("id, tableau_id"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (invoicesError) throw new Error(formatSupabaseError(invoicesError));
  if (clientsError) throw new Error(formatSupabaseError(clientsError));
  if (tableauxError) throw new Error(formatSupabaseError(tableauxError));
  if (lignesError) throw new Error(formatSupabaseError(lignesError));
  if (authUsersResult.error) {
    throw new Error(formatSupabaseError(authUsersResult.error));
  }

  const emailById = new Map(
    (authUsersResult.data.users ?? []).map((user) => [user.id, user.email ?? ""]),
  );

  const domaineById = new Map(
    (authUsersResult.data.users ?? []).map((user) => [
      user.id,
      getActivityDomainFromAuthUser(user),
    ]),
  );

  const clientsList = [...(clients ?? [])];
  const domaineBackfill = clientsList
    .filter((client) => !client.domaine_activite)
    .flatMap((client) => {
      const domaine = domaineById.get(client.id_client);
      if (!domaine) return [];
      return [{ id_client: client.id_client, domaine_activite: domaine }];
    });

  if (domaineBackfill.length > 0) {
    const backfillResults = await Promise.all(
      domaineBackfill.map((row) =>
        admin
          .from("clients_lockin")
          .update({ domaine_activite: row.domaine_activite })
          .eq("id_client", row.id_client),
      ),
    );

    const backfillError = backfillResults.find((result) => result.error)?.error;
    if (backfillError) {
      console.warn("[admin] domaine_activite backfill:", backfillError.message);
    } else {
      for (const row of domaineBackfill) {
        const client = clientsList.find((item) => item.id_client === row.id_client);
        if (client) client.domaine_activite = row.domaine_activite;
      }
    }
  }

  const tableauOwner = new Map(
    (tableaux ?? []).map((tableau) => [tableau.id, tableau.user_id]),
  );

  const invoiceCountByUser = new Map<string, number>();
  for (const ligne of lignes ?? []) {
    const ownerId = tableauOwner.get(ligne.tableau_id);
    if (!ownerId) continue;
    invoiceCountByUser.set(ownerId, (invoiceCountByUser.get(ownerId) ?? 0) + 1);
  }

  const tableCountByUser = new Map<string, number>();
  for (const tableau of tableaux ?? []) {
    tableCountByUser.set(
      tableau.user_id,
      (tableCountByUser.get(tableau.user_id) ?? 0) + 1,
    );
  }

  const providers: AdminProviderRow[] = clientsList
    .map((client) => {
      const invoiceCount = invoiceCountByUser.get(client.id_client) ?? 0;
      const tableCount = tableCountByUser.get(client.id_client) ?? 0;
      const importsIaThisMonth = resolveMonthlyImportCount(
        client.imports_ia_count,
        client.imports_ia_month,
      );

      return {
        id: client.id_client,
        prenom: client.prenom_client,
        nomSociete: client.nom_societe,
        email: emailById.get(client.id_client) ?? "—",
        invoiceCount,
        relanceCount: 0,
        vigilance: buildVigilanceScore({
          invoiceCount,
          tableCount,
          importsIaThisMonth,
        }),
        dateInscription: client.date_inscription,
      };
    })
    .filter((provider) => !isAdminEmail(provider.email))
    .sort((a, b) => compareVigilanceDesc(a.vigilance, b.vigilance));

  return {
    kpis: {
      providerCount: providers.length,
      invoiceCount: invoiceCount ?? 0,
      relanceCount: 0,
    },
    providers,
    activityDomainStats: buildActivityDomainStats(clientsList, emailById, domaineById),
  };
}
