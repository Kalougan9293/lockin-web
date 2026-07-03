import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { ClientRow } from "@/types/tableau";
import { isRowPaid } from "@/types/tableau";

type Supabase = SupabaseClient<Database>;

const ACTIVE_DELIVERY_STATUSES = ["queued", "pending"] as const;

/**
 * Indique si une relance peut encore être envoyée pour une ligne donnée.
 * Retourne false si la ligne est absente, payée, ou sans relance en file active.
 */
export async function shouldSendRelanceForLigne(
  supabase: Supabase,
  ligneId: string,
): Promise<boolean> {
  const { data: ligne, error: ligneError } = await supabase
    .from("lignes_factures")
    .select("id, values")
    .eq("id", ligneId)
    .maybeSingle();

  if (ligneError) throw ligneError;
  if (!ligne) return false;

  const row: ClientRow = {
    id: ligne.id,
    values: (ligne.values as ClientRow["values"]) ?? {},
  };

  if (isRowPaid(row)) return false;

  const { count, error: deliveryError } = await supabase
    .from("relance_deliveries")
    .select("id", { count: "exact", head: true })
    .eq("ligne_id", ligneId)
    .in("status", [...ACTIVE_DELIVERY_STATUSES]);

  if (deliveryError) throw deliveryError;

  return (count ?? 0) > 0;
}

/** Toutes les lignes doivent encore être éligibles (anti-envoi si une facture vient d'être payée). */
export async function shouldSendRelanceForLignes(
  supabase: Supabase,
  ligneIds: string[],
): Promise<boolean> {
  const uniqueIds = [...new Set(ligneIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return false;

  for (const ligneId of uniqueIds) {
    const eligible = await shouldSendRelanceForLigne(supabase, ligneId);
    if (!eligible) return false;
  }

  return true;
}
