import { parseDateInputToIso } from "@/lib/preferences/date-format";
import type { ClientRow, ColumnDef, RelanceStep } from "@/types/tableau";

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

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseFlexibleDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  for (const format of ["fr", "iso"] as const) {
    const iso = parseDateInputToIso(trimmed, format);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) continue;

    const [year, month, day] = iso.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

export function formatRelanceDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/** Date courte pour les cellules de relance (sans année). */
export function formatRelanceCompactDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

/** Date de relance = date d'échéance + days (chaque étape). */
export function computeRelanceDate(dueDate: Date, days: number) {
  const result = new Date(dueDate);
  result.setDate(result.getDate() + days);
  return startOfDay(result);
}

export function resolveDueDateValue(
  row: ClientRow,
  columns: ColumnDef[],
): string {
  const dueColumn = columns.find((column) => isDueDateColumnLabel(column.label));
  if (!dueColumn) return "";

  return row.values[dueColumn.id]?.trim() ?? "";
}

export function rowMissingDueDate(row: ClientRow, columns: ColumnDef[]): boolean {
  const dueRaw = resolveDueDateValue(row, columns);
  if (!dueRaw) return true;
  return parseFlexibleDate(dueRaw) === null;
}

export function buildRelanceScheduleForRow(
  row: ClientRow,
  columns: ColumnDef[],
  relanceSteps: RelanceStep[],
  referenceDate: Date = new Date(),
): Map<string, RelanceScheduleItem> {
  const schedule = new Map<string, RelanceScheduleItem>();
  const dueRaw = resolveDueDateValue(row, columns);
  const dueDate = parseFlexibleDate(dueRaw);

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
  const dueDate = parseFlexibleDate(isoDate);
  if (!dueDate) return false;

  const today = startOfDay(new Date());
  return startOfDay(dueDate).getTime() <= today.getTime();
}

export function validateDueDateForRelance(isoDate: string): string | null {
  const trimmed = isoDate.trim();
  if (!trimmed) return null;

  const dueDate = parseFlexibleDate(trimmed);
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
