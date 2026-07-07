import type { ClientRow, ColumnDef, RelanceStep } from "@/types/tableau";

import {
  addDaysDateOnly,
  formatDateOnlyIso,
  isDateOnOrBefore,
  normalizeDateOnlyInput,
  parseDateOnly,
  startOfDay,
  todayDateOnly,
} from "./date-only";

export type RelanceScheduleItem = {
  stepId: string;
  scheduledDate: Date;
};

/** Colonne « Échéance » uniquement — pas la colonne « Date » facture. */
export function isDueDateColumnLabel(label: string) {
  const normalized = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

  return normalized.includes("echeance");
}

export {
  formatDateOnlyIso,
  normalizeDateOnlyInput,
  parseDateOnly,
  startOfDay,
  todayDateOnly,
} from "./date-only";

export function parseFlexibleDate(value: string): Date | null {
  return parseDateOnly(value);
}

export function formatRelanceDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(startOfDay(date));
}

/** Date courte pour les cellules de relance (sans année). */
export function formatRelanceCompactDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  }).format(startOfDay(date));
}

/** Date de relance = date d'échéance + days, à 00:00:00.000. */
export function computeRelanceDate(dueDate: Date, days: number) {
  return addDaysDateOnly(dueDate, days);
}

export function resolveDueDateValue(
  row: ClientRow,
  columns: ColumnDef[],
): string {
  const dueColumn = columns.find((column) => isDueDateColumnLabel(column.label));
  if (!dueColumn) return "";

  return row.values[dueColumn.id]?.trim() ?? "";
}

export function normalizeDueDateValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return normalizeDateOnlyInput(trimmed) ?? trimmed;
}

export function resolveNormalizedDueDateValue(
  row: ClientRow,
  columns: ColumnDef[],
): string {
  return normalizeDueDateValue(resolveDueDateValue(row, columns));
}

/** Compare l'échéance persistée entre deux versions d'une ligne. */
export function didDueDateChange(
  previous: ClientRow,
  next: ClientRow,
  columns?: ColumnDef[],
): boolean {
  if (columns && columns.length > 0) {
    return (
      resolveNormalizedDueDateValue(previous, columns) !==
      resolveNormalizedDueDateValue(next, columns)
    );
  }

  return (
    normalizeDueDateValue(previous.values.echeance ?? "") !==
    normalizeDueDateValue(next.values.echeance ?? "")
  );
}

export function rowMissingDueDate(row: ClientRow, columns: ColumnDef[]): boolean {
  const dueRaw = resolveDueDateValue(row, columns);
  if (!dueRaw) return true;
  return parseDateOnly(dueRaw) === null;
}

export function buildRelanceScheduleForRow(
  row: ClientRow,
  columns: ColumnDef[],
  relanceSteps: RelanceStep[],
): Map<string, RelanceScheduleItem> {
  const schedule = new Map<string, RelanceScheduleItem>();
  const dueRaw = resolveDueDateValue(row, columns);
  const dueDate = parseDateOnly(dueRaw);

  if (!dueDate) return schedule;

  for (const step of relanceSteps) {
    const scheduledDate = computeRelanceDate(dueDate, step.days);
    schedule.set(step.id, {
      stepId: step.id,
      scheduledDate,
    });
  }

  return schedule;
}

export const DUE_DATE_MUST_BE_TOMORROW_ERROR =
  "La date d'échéance doit être fixée au moins à demain (J+1) pour pouvoir planifier les relances correctement.";

/** Échéance au plus tard aujourd'hui → invalide pour planifier les relances. */
export function isDueDateOnOrBeforeToday(isoDate: string): boolean {
  const dueDate = parseDateOnly(isoDate);
  if (!dueDate) return false;

  return isDateOnOrBefore(dueDate, todayDateOnly());
}

export function validateDueDateForRelance(isoDate: string): string | null {
  const trimmed = isoDate.trim();
  if (!trimmed) return null;

  const dueDate = parseDateOnly(trimmed);
  if (!dueDate) {
    return "Date d'échéance invalide.";
  }

  if (isDueDateOnOrBeforeToday(trimmed)) {
    return DUE_DATE_MUST_BE_TOMORROW_ERROR;
  }

  return null;
}

export function getDueDateFromPayload(
  payload: Record<string, string>,
): string {
  for (const [label, value] of Object.entries(payload)) {
    if (isDueDateColumnLabel(label)) {
      return value.trim();
    }
  }
  return "";
}
