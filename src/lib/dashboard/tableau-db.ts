import { handlePaidLigneSideEffects } from "@/lib/dashboard/cancel-queued-deliveries";
import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Database,
  LigneFactureRow,
  RelanceStepRow,
  TableauWithRelations,
} from "@/types/database";
import type { ClientRow, ColumnDef, RelanceStep, TableData } from "@/types/tableau";
import {
  STATUT_COLUMN_ID,
  defaultRelanceStepName,
  ensureDefaultRelanceSteps,
  relanceStepsLookUnconfigured,
  upgradeLegacyDefaultColumns,
} from "@/types/tableau";

type Supabase = SupabaseClient<Database>;

function mapRelanceStepRow(row: RelanceStepRow): RelanceStep {
  return {
    id: row.id,
    name: row.name,
    days: row.days,
    messageTemplate: row.message_template,
  };
}

function mapLigneRow(row: LigneFactureRow): ClientRow {
  return {
    id: row.id,
    values: row.values ?? {},
  };
}

export function mapTableauToTableData(tableau: TableauWithRelations): TableData {
  const relanceSteps = [...(tableau.relance_steps ?? [])]
    .sort((a, b) => a.ordre - b.ordre)
    .map(mapRelanceStepRow);

  const rows = [...(tableau.lignes_factures ?? [])]
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    .map(mapLigneRow);

  return ensureDefaultRelanceSteps(
    upgradeLegacyDefaultColumns({
      id: tableau.id,
      name: tableau.name,
      leftColumns: tableau.left_columns as ColumnDef[],
      hiddenLeftColumns: tableau.hidden_left_columns as ColumnDef[],
      rows,
      relanceSteps,
    }),
  );
}

function rawTableauNeedsColumnUpgrade(
  raw: TableauWithRelations,
  table: TableData,
): boolean {
  const rawColumns = raw.left_columns as ColumnDef[];
  if (JSON.stringify(rawColumns) !== JSON.stringify(table.leftColumns)) {
    return true;
  }

  const rawRows = [...(raw.lignes_factures ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  return table.rows.some((row, index) => {
    const rawValues = rawRows[index]?.values ?? {};
    return JSON.stringify(rawValues) !== JSON.stringify(row.values);
  });
}

function tableNeedsRelanceStepsSeed(
  raw: TableauWithRelations,
  table: TableData,
): boolean {
  const rawSteps = [...(raw.relance_steps ?? [])]
    .sort((a, b) => a.ordre - b.ordre)
    .map(mapRelanceStepRow);

  if (rawSteps.length === 0 && table.relanceSteps.length > 0) return true;

  if (rawSteps.length === 0) return false;

  if (relanceStepsLookUnconfigured(rawSteps) && table.relanceSteps.length > rawSteps.length) {
    return true;
  }

  return (
    relanceStepsLookUnconfigured(rawSteps) &&
    JSON.stringify(rawSteps) !== JSON.stringify(table.relanceSteps)
  );
}

async function persistMigratedTables(
  supabase: Supabase,
  rawRows: TableauWithRelations[],
  tables: TableData[],
) {
  for (let index = 0; index < rawRows.length; index += 1) {
    const raw = rawRows[index];
    const table = tables[index];

    if (tableNeedsRelanceStepsSeed(raw, table)) {
      await syncRelanceSteps(supabase, table.id, table.relanceSteps);
    }

    if (!rawTableauNeedsColumnUpgrade(raw, table)) continue;

    await updateTableMeta(supabase, table);
    for (const row of table.rows) {
      await updateLigne(supabase, row);
    }
  }
}

async function fetchMappedTables(
  supabase: Supabase,
  data: TableauWithRelations[],
): Promise<TableData[]> {
  const tables = data.map(mapTableauToTableData);
  await persistMigratedTables(supabase, data, tables);
  return tables;
}

export async function fetchAllTables(supabase: Supabase): Promise<TableData[]> {
  const { data, error } = await supabase
    .from("tableaux")
    .select("*, relance_steps(*), lignes_factures(*)")
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!data?.length) return [];

  return fetchMappedTables(supabase, data as TableauWithRelations[]);
}

export async function fetchAllTablesForUser(
  supabase: Supabase,
  userId: string,
): Promise<TableData[]> {
  const { data, error } = await supabase
    .from("tableaux")
    .select("*, relance_steps(*), lignes_factures(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!data?.length) return [];

  return fetchMappedTables(supabase, data as TableauWithRelations[]);
}

function relanceStepsToInsert(tableauId: string, steps: RelanceStep[]) {
  return steps.map((step, ordre) => ({
    id: step.id,
    tableau_id: tableauId,
    name: step.name.trim() || defaultRelanceStepName(ordre),
    days: step.days,
    message_template: step.messageTemplate,
    ordre,
  }));
}

export async function insertFullTable(
  supabase: Supabase,
  userId: string,
  table: TableData,
): Promise<void> {
  const { error: tableauError } = await supabase.from("tableaux").insert({
    id: table.id,
    user_id: userId,
    name: table.name,
    left_columns: table.leftColumns,
    hidden_left_columns: table.hiddenLeftColumns,
  });

  if (tableauError) throw tableauError;

  if (table.relanceSteps.length > 0) {
    const { error: stepsError } = await supabase
      .from("relance_steps")
      .insert(relanceStepsToInsert(table.id, table.relanceSteps));

    if (stepsError) throw stepsError;
  }

  if (table.rows.length > 0) {
    const { error: rowsError } = await supabase.from("lignes_factures").insert(
      table.rows.map((row) => ({
        id: row.id,
        tableau_id: table.id,
        values: row.values,
      })),
    );

    if (rowsError) throw rowsError;
  }
}

export async function updateTableMeta(
  supabase: Supabase,
  table: Pick<TableData, "id" | "name" | "leftColumns" | "hiddenLeftColumns">,
): Promise<void> {
  const { error } = await supabase
    .from("tableaux")
    .update({
      name: table.name,
      left_columns: table.leftColumns,
      hidden_left_columns: table.hiddenLeftColumns,
    })
    .eq("id", table.id);

  if (error) throw error;
}

export async function syncRelanceSteps(
  supabase: Supabase,
  tableauId: string,
  steps: RelanceStep[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("relance_steps")
    .delete()
    .eq("tableau_id", tableauId);

  if (deleteError) throw deleteError;
  if (steps.length === 0) return;

  const { error: insertError } = await supabase
    .from("relance_steps")
    .insert(relanceStepsToInsert(tableauId, steps));

  if (insertError) throw insertError;
}

export async function insertLigne(
  supabase: Supabase,
  tableauId: string,
  row: ClientRow,
): Promise<void> {
  const { error } = await supabase.from("lignes_factures").insert({
    id: row.id,
    tableau_id: tableauId,
    values: row.values,
  });

  if (error) throw error;
}

export async function updateLigne(
  supabase: Supabase,
  row: ClientRow,
  previous?: ClientRow,
): Promise<void> {
  const { error } = await supabase
    .from("lignes_factures")
    .update({ values: row.values })
    .eq("id", row.id);

  if (error) throw error;

  await handlePaidLigneSideEffects(supabase, row, previous);
}

export async function deleteLigne(
  supabase: Supabase,
  rowId: string,
): Promise<void> {
  const { error } = await supabase
    .from("lignes_factures")
    .delete()
    .eq("id", rowId);

  if (error) throw error;
}

export async function deleteTable(
  supabase: Supabase,
  tableId: string,
): Promise<void> {
  const { error } = await supabase.from("tableaux").delete().eq("id", tableId);

  if (error) throw error;
}

export function tableMetaChanged(prev: TableData, next: TableData): boolean {
  return (
    prev.name !== next.name ||
    JSON.stringify(prev.leftColumns) !== JSON.stringify(next.leftColumns) ||
    JSON.stringify(prev.hiddenLeftColumns) !==
      JSON.stringify(next.hiddenLeftColumns)
  );
}

export function relanceStepsChanged(prev: TableData, next: TableData): boolean {
  return JSON.stringify(prev.relanceSteps) !== JSON.stringify(next.relanceSteps);
}

export function getAddedRows(prev: ClientRow[], next: ClientRow[]): ClientRow[] {
  const prevIds = new Set(prev.map((row) => row.id));
  return next.filter((row) => !prevIds.has(row.id));
}

export function getRemovedRows(prev: ClientRow[], next: ClientRow[]): ClientRow[] {
  const nextIds = new Set(next.map((row) => row.id));
  return prev.filter((row) => !nextIds.has(row.id));
}

export function getUpdatedRows(prev: ClientRow[], next: ClientRow[]): ClientRow[] {
  return next.filter((row) => {
    const previous = prev.find((entry) => entry.id === row.id);
    return (
      previous !== undefined &&
      JSON.stringify(previous.values) !== JSON.stringify(row.values)
    );
  });
}

/** Changement uniquement sur le champ statut (payé / non payé) — persistance immédiate. */
export function isPaymentStatusOnlyChange(
  previous: ClientRow,
  next: ClientRow,
): boolean {
  if (previous.values[STATUT_COLUMN_ID] === next.values[STATUT_COLUMN_ID]) {
    return false;
  }

  const keys = new Set([
    ...Object.keys(previous.values),
    ...Object.keys(next.values),
  ]);

  for (const key of keys) {
    if (key === STATUT_COLUMN_ID) continue;
    if ((previous.values[key] ?? "") !== (next.values[key] ?? "")) {
      return false;
    }
  }

  return true;
}

export async function applyTableDiff(
  supabase: Supabase,
  prev: TableData,
  next: TableData,
): Promise<void> {
  if (tableMetaChanged(prev, next)) {
    await updateTableMeta(supabase, next);
  }

  if (relanceStepsChanged(prev, next)) {
    await syncRelanceSteps(supabase, next.id, next.relanceSteps);
  }

  for (const row of getRemovedRows(prev.rows, next.rows)) {
    await deleteLigne(supabase, row.id);
  }

  for (const row of getAddedRows(prev.rows, next.rows)) {
    await insertLigne(supabase, next.id, row);
  }

  for (const row of getUpdatedRows(prev.rows, next.rows)) {
    const previous = prev.rows.find((entry) => entry.id === row.id);
    await updateLigne(supabase, row, previous);
  }
}
