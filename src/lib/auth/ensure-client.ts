import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { ClientProfilePayload } from "@/lib/auth/client-from-user";
import { buildClientPayloadFromAuthUser } from "@/lib/auth/client-from-user";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type ClientPayload = ClientProfilePayload;

function buildClientRow({
  idClient,
  prenomClient,
  nomSociete,
  domaineActivite,
}: ClientPayload) {
  return {
    id_client: idClient,
    prenom_client: prenomClient,
    nom_societe: nomSociete,
    ...(domaineActivite ? { domaine_activite: domaineActivite } : {}),
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

export async function ensureClientFromAuthUser(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<string | null> {
  return ensureClientWithSession(supabase, buildClientPayloadFromAuthUser(user));
}
