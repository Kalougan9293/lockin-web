import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type ClientPayload = {
  idClient: string;
  prenomClient: string;
  nomSociete: string;
};

function buildClientRow({ idClient, prenomClient, nomSociete }: ClientPayload) {
  return {
    id_client: idClient,
    prenom_client: prenomClient,
    nom_societe: nomSociete,
    forfait: "freemium" as const,
    pays: "France",
  };
}

export async function ensureClientWithAdmin(
  payload: ClientPayload,
): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("clients_lockin")
      .upsert(buildClientRow(payload), { onConflict: "id_client" });

    return error?.message ?? null;
  } catch (error) {
    return error instanceof Error ? error.message : "Erreur inconnue";
  }
}

export async function ensureClientWithSession(
  supabase: SupabaseClient<Database>,
  payload: ClientPayload,
): Promise<string | null> {
  const { error } = await supabase
    .from("clients_lockin")
    .upsert(buildClientRow(payload), { onConflict: "id_client" });

  return error?.message ?? null;
}
