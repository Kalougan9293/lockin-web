import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { isRowPaid, type ClientRow } from "@/types/tableau";

type Supabase = SupabaseClient<Database>;

const CANCELLABLE_STATUSES = ["queued", "pending"] as const;

export function markDeliveriesCancelledLocally<T extends { ligne_id: string; status: string }>(
  deliveries: T[],
  ligneId: string,
): T[] {
  return deliveries.map((delivery) => {
    if (delivery.ligne_id !== ligneId) return delivery;
    if (!CANCELLABLE_STATUSES.includes(delivery.status as (typeof CANCELLABLE_STATUSES)[number])) {
      return delivery;
    }
    return { ...delivery, status: "cancelled" };
  });
}

export async function cancelQueuedDeliveriesForPaidLigne(
  supabase: Supabase,
  ligneId: string,
): Promise<void> {
  const { error } = await supabase
    .from("relance_deliveries")
    .update({ status: "cancelled" })
    .eq("ligne_id", ligneId)
    .in("status", [...CANCELLABLE_STATUSES]);

  if (error) throw error;
}

export async function handlePaidLigneSideEffects(
  supabase: Supabase,
  row: ClientRow,
  previous?: ClientRow,
): Promise<boolean> {
  const becamePaid = isRowPaid(row) && !(previous && isRowPaid(previous));
  if (!becamePaid) return false;

  await cancelQueuedDeliveriesForPaidLigne(supabase, row.id);
  return true;
}
