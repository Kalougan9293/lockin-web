import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { isRowPaid, type ClientRow, type ColumnDef } from "@/types/tableau";

import { didDueDateChange } from "./relance-schedule";

type Supabase = SupabaseClient<Database>;

const CANCELLABLE_STATUSES = ["queued", "pending"] as const;

function isCancellableStatus(status: string): boolean {
  return CANCELLABLE_STATUSES.includes(
    status as (typeof CANCELLABLE_STATUSES)[number],
  );
}

export function markDeliveriesCancelledLocally<T extends { ligne_id: string; status: string }>(
  deliveries: T[],
  ligneId: string,
): T[] {
  return deliveries.map((delivery) => {
    if (delivery.ligne_id !== ligneId) return delivery;
    if (!isCancellableStatus(delivery.status)) {
      return delivery;
    }
    return { ...delivery, status: "cancelled" };
  });
}

export function markDeliveriesCancelledLocallyForTableau<
  T extends { tableau_id: string; status: string },
>(deliveries: T[], tableauId: string): T[] {
  return deliveries.map((delivery) => {
    if (delivery.tableau_id !== tableauId) return delivery;
    if (!isCancellableStatus(delivery.status)) {
      return delivery;
    }
    return { ...delivery, status: "cancelled" };
  });
}

export async function cancelCancellableDeliveriesForLigne(
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

export async function cancelCancellableDeliveriesForTableau(
  supabase: Supabase,
  tableauId: string,
): Promise<void> {
  const { error } = await supabase
    .from("relance_deliveries")
    .update({ status: "cancelled" })
    .eq("tableau_id", tableauId)
    .in("status", [...CANCELLABLE_STATUSES]);

  if (error) throw error;
}

export async function cancelQueuedDeliveriesForPaidLigne(
  supabase: Supabase,
  ligneId: string,
): Promise<void> {
  await cancelCancellableDeliveriesForLigne(supabase, ligneId);
}

export async function handleDueDateChangeSideEffects(
  supabase: Supabase,
  row: ClientRow,
  previous?: ClientRow,
  columns?: ColumnDef[],
): Promise<boolean> {
  if (!previous) return false;
  if (!didDueDateChange(previous, row, columns)) return false;

  await cancelCancellableDeliveriesForLigne(supabase, row.id);
  return true;
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
