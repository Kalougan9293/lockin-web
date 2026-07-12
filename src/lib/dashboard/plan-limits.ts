import type { ClientRow, TableData } from "@/types/tableau";

/** Limites généreuses pendant la bêta (10 premiers clients, usage illimité). */
export const PLAN_LIMITS = {
  MAX_TABLES: 50,
  MAX_ROWS_PER_TABLE: 1000,
  MAX_TOTAL_ROWS: 10000,
} as const;

export function countTotalRows(tables: TableData[]): number {
  return tables.reduce((total, table) => total + table.rows.length, 0);
}

export function canAddTable(tables: TableData[]): boolean {
  return tables.length < PLAN_LIMITS.MAX_TABLES;
}

export function canAddRowToTable(tables: TableData[], tableId: string): boolean {
  const table = tables.find((entry) => entry.id === tableId);
  if (!table) return false;
  if (table.rows.length >= PLAN_LIMITS.MAX_ROWS_PER_TABLE) return false;
  if (countTotalRows(tables) >= PLAN_LIMITS.MAX_TOTAL_ROWS) return false;
  return true;
}

export function clampRowsForTable(
  tables: TableData[],
  tableId: string,
  rows: ClientRow[],
): ClientRow[] {
  const table = tables.find((entry) => entry.id === tableId);
  if (!table) return rows;

  const otherRows = countTotalRows(tables) - table.rows.length;
  const maxByTotal = Math.max(0, PLAN_LIMITS.MAX_TOTAL_ROWS - otherRows);
  const maxRows = Math.min(PLAN_LIMITS.MAX_ROWS_PER_TABLE, maxByTotal);

  return rows.slice(0, maxRows);
}

export function isTableRowsWithinLimits(
  tables: TableData[],
  tableId: string,
  nextRows: ClientRow[],
): boolean {
  const table = tables.find((entry) => entry.id === tableId);
  if (!table) return false;

  if (nextRows.length > PLAN_LIMITS.MAX_ROWS_PER_TABLE) return false;

  const otherRows = countTotalRows(tables) - table.rows.length;
  return otherRows + nextRows.length <= PLAN_LIMITS.MAX_TOTAL_ROWS;
}

/** Nombre de lignes encore importables dans un tableau. */
export function getImportRowCapacity(
  tables: TableData[],
  tableId: string,
): number {
  const table = tables.find((entry) => entry.id === tableId);
  if (!table) return 0;

  const perTable = PLAN_LIMITS.MAX_ROWS_PER_TABLE - table.rows.length;
  const totalRemaining = PLAN_LIMITS.MAX_TOTAL_ROWS - countTotalRows(tables);
  return Math.max(0, Math.min(perTable, totalRemaining));
}
