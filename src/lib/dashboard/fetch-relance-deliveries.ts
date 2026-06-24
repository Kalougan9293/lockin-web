import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, RelanceDeliveryRow } from "@/types/database";

type Supabase = SupabaseClient<Database>;

export async function fetchRelanceDeliveriesForTableaux(
  supabase: Supabase,
  tableauIds: string[],
): Promise<RelanceDeliveryRow[]> {
  if (tableauIds.length === 0) return [];

  const { data, error } = await supabase
    .from("relance_deliveries")
    .select("*")
    .in("tableau_id", tableauIds);

  if (error) throw error;
  return data ?? [];
}
