import type { SupabaseClient } from "@supabase/supabase-js";

import {
  applyTableDiff,
  fetchAllTablesForUser,
} from "@/lib/dashboard/tableau-db";
import {
  getImportRowCapacity,
  isTableRowsWithinLimits,
} from "@/lib/dashboard/plan-limits";
import type { Database } from "@/types/database";
import type { ClientRow, TableData } from "@/types/tableau";
import { mergeMultipleClientsIntoTable } from "@/types/tableau";

import type { ValidatedInvoiceRow } from "./invoice-schema";

type Supabase = SupabaseClient<Database>;

export type ImportApplyResult = {
  table: TableData;
  importedRows: ClientRow[];
  skippedCount: number;
};

export async function applyValidatedRowsToTable(
  supabase: Supabase,
  userId: string,
  tableId: string,
  rows: ValidatedInvoiceRow[],
): Promise<ImportApplyResult> {
  const tables = await fetchAllTablesForUser(supabase, userId);
  const result = applyValidatedRowsLocally(tables, tableId, rows);

  await applyTableDiff(supabase, tables.find((t) => t.id === tableId)!, result.table);

  return result;
}

/** Fusion locale (mode démo) — aucune écriture Supabase. */
export function applyValidatedRowsLocally(
  tables: TableData[],
  tableId: string,
  rows: ValidatedInvoiceRow[],
): ImportApplyResult {
  const table = tables.find((entry) => entry.id === tableId);

  if (!table) {
    throw new Error("Tableau introuvable.");
  }

  const capacity = getImportRowCapacity(tables, tableId);
  const rowsToImport = rows.slice(0, capacity);
  const skippedCount = rows.length - rowsToImport.length;

  if (rowsToImport.length === 0) {
    throw new Error("Limite de lignes atteinte — aucune ligne importée.");
  }

  const payloads = rowsToImport.map((row) => ({ ...row }));
  const nextTable = mergeMultipleClientsIntoTable(table, payloads);

  if (!isTableRowsWithinLimits(tables, tableId, nextTable.rows)) {
    throw new Error("Import refusé : dépassement des limites du forfait.");
  }

  const prevIds = new Set(table.rows.map((row) => row.id));
  const importedRows = nextTable.rows.filter((row) => !prevIds.has(row.id));

  return {
    table: nextTable,
    importedRows,
    skippedCount,
  };
}
