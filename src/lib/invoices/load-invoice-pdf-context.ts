import type { SupabaseClient } from "@supabase/supabase-js";

import {
  fetchCreditorContexts,
  getCreditorContext,
} from "@/lib/dashboard/creditor-context";
import { mapTableauToTableData } from "@/lib/dashboard/tableau-db";
import type { Database } from "@/types/database";
import type { ColumnDef } from "@/types/tableau";

import {
  buildRelancePdfInvoiceRow,
  generateRelancePdfBuffer,
  type RelancePdfData,
} from "./relance-pdf";

type Supabase = SupabaseClient<Database>;

function getAllColumns(table: ReturnType<typeof mapTableauToTableData>): ColumnDef[] {
  return [...table.leftColumns, ...table.hiddenLeftColumns];
}

export async function loadInvoicePdfData(
  supabase: Supabase,
  userId: string,
  ligneIds: string[],
  messageBody = "",
): Promise<RelancePdfData | null> {
  const uniqueIds = [...new Set(ligneIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return null;

  const { data: lignes, error: lignesError } = await supabase
    .from("lignes_factures")
    .select("id, tableau_id, values")
    .in("id", uniqueIds);

  if (lignesError) throw lignesError;
  if (!lignes?.length) return null;

  const tableauId = lignes[0].tableau_id;
  const allSameTableau = lignes.every((ligne) => ligne.tableau_id === tableauId);
  if (!allSameTableau) return null;

  const { data: tableau, error: tableauError } = await supabase
    .from("tableaux")
    .select("*, relance_steps(*), lignes_factures(*)")
    .eq("id", tableauId)
    .maybeSingle();

  if (tableauError) throw tableauError;
  if (!tableau || tableau.user_id !== userId) return null;

  const table = mapTableauToTableData(tableau);
  const columns = getAllColumns(table);
  const creditorContexts = await fetchCreditorContexts(supabase, [userId]);
  const creditor = getCreditorContext(creditorContexts, userId);

  const invoices = uniqueIds
    .map((ligneId) => {
      const row = table.rows.find((entry) => entry.id === ligneId);
      if (!row) return null;
      return buildRelancePdfInvoiceRow(row, columns);
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (invoices.length === 0) return null;

  return {
    creditor,
    invoices,
    messageBody,
  };
}

export async function generateInvoicePdfForLignes(
  supabase: Supabase,
  userId: string,
  ligneIds: string[],
  messageBody = "",
): Promise<Buffer | null> {
  const data = await loadInvoicePdfData(supabase, userId, ligneIds, messageBody);
  if (!data) return null;
  return generateRelancePdfBuffer(data);
}
