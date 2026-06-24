import { createAdminClient } from "@/lib/supabase/admin";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { isAdminEmail } from "@/lib/auth/redirect";

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
  pays: string;
  dateInscription: string;
};

export type AdminDashboardData = {
  kpis: AdminKpis;
  providers: AdminProviderRow[];
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

  const tableauOwner = new Map(
    (tableaux ?? []).map((tableau) => [tableau.id, tableau.user_id]),
  );

  const invoiceCountByUser = new Map<string, number>();
  for (const ligne of lignes ?? []) {
    const ownerId = tableauOwner.get(ligne.tableau_id);
    if (!ownerId) continue;
    invoiceCountByUser.set(ownerId, (invoiceCountByUser.get(ownerId) ?? 0) + 1);
  }

  const providers: AdminProviderRow[] = (clients ?? [])
    .map((client) => ({
      id: client.id_client,
      prenom: client.prenom_client,
      nomSociete: client.nom_societe,
      email: emailById.get(client.id_client) ?? "—",
      invoiceCount: invoiceCountByUser.get(client.id_client) ?? 0,
      relanceCount: 0,
      pays: client.pays,
      dateInscription: client.date_inscription,
    }))
    .filter((provider) => !isAdminEmail(provider.email));

  return {
    kpis: {
      providerCount: providers.length,
      invoiceCount: invoiceCount ?? 0,
      relanceCount: 0,
    },
    providers,
  };
}
