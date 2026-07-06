import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import type { IssuerContext } from "./issuer-context";

type AdminClient = SupabaseClient<Database>;

const FALLBACK_COMPANY = "Votre créancier";

export async function fetchIssuerForImport(
  admin: AdminClient,
  userId: string,
  sessionEmail: string | null | undefined,
  sessionMetadata: Record<string, unknown> | undefined,
): Promise<IssuerContext> {
  const { data: client } = await admin
    .from("clients_lockin")
    .select("nom_societe")
    .eq("id_client", userId)
    .maybeSingle();

  const metadataSociete = String(sessionMetadata?.nom_societe ?? "").trim();
  const companyName =
    client?.nom_societe?.trim() || metadataSociete || FALLBACK_COMPANY;

  return {
    companyName,
    email: sessionEmail?.trim() ?? "",
  };
}
