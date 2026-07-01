import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import type { RelanceEmailCreditor } from "./relance-email-body";

type Supabase = SupabaseClient<Database>;

const FALLBACK_COMPANY = "Votre créancier";

export async function fetchCreditorContexts(
  supabase: Supabase,
  userIds: string[],
): Promise<Map<string, RelanceEmailCreditor>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const contexts = new Map<string, RelanceEmailCreditor>();

  if (uniqueIds.length === 0) return contexts;

  const { data: clients, error: clientsError } = await supabase
    .from("clients_lockin")
    .select("id_client, nom_societe")
    .in("id_client", uniqueIds);

  if (clientsError) throw clientsError;

  const companyByUserId = new Map(
    (clients ?? []).map((client) => [
      client.id_client,
      client.nom_societe?.trim() ?? "",
    ]),
  );

  await Promise.all(
    uniqueIds.map(async (userId) => {
      const { data, error } = await supabase.auth.admin.getUserById(userId);

      if (error) {
        console.warn(`[creditor-context] getUserById ${userId}:`, error.message);
      }

      const user = data.user;
      const metadataSociete = String(user?.user_metadata?.nom_societe ?? "").trim();
      const companyName =
        companyByUserId.get(userId) || metadataSociete || FALLBACK_COMPANY;
      const email = user?.email?.trim() ?? "";

      contexts.set(userId, { companyName, email });
    }),
  );

  return contexts;
}

export function getCreditorContext(
  contexts: Map<string, RelanceEmailCreditor>,
  userId: string,
): RelanceEmailCreditor {
  return (
    contexts.get(userId) ?? {
      companyName: FALLBACK_COMPANY,
      email: "",
    }
  );
}
