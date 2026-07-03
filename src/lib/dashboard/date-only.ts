import { parseDateInputToIso } from "@/lib/preferences/date-format";

/**
 * Dates calendaires (YYYY-MM-DD) à 00:00:00.000 en heure locale.
 * Aucune comparaison de relance ne tient compte de l'heure ni du fuseau.
 */

const ISO_DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;

export function startOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );
}

export function todayDateOnly(): Date {
  return startOfDay(new Date());
}

export function formatDateOnlyIso(date: Date): string {
  const normalized = startOfDay(date);
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, "0");
  const day = String(normalized.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromParts(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (Number.isNaN(date.getTime())) return null;

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/** Parse une valeur en date pure ; ignore toute composante horaire ou fuseau. */
export function parseDateOnly(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoPrefix = trimmed.match(ISO_DATE_PREFIX);
  if (isoPrefix) {
    return fromParts(
      Number(isoPrefix[1]),
      Number(isoPrefix[2]),
      Number(isoPrefix[3]),
    );
  }

  for (const format of ["fr", "iso"] as const) {
    const iso = parseDateInputToIso(trimmed, format);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) continue;

    const [year, month, day] = iso.split("-").map(Number);
    const parsed = fromParts(year, month, day);
    if (parsed) return parsed;
  }

  return null;
}

export function addDaysDateOnly(date: Date, days: number): Date {
  const base = startOfDay(date);
  base.setDate(base.getDate() + days);
  return startOfDay(base);
}

export function compareDateOnly(a: Date, b: Date): number {
  return startOfDay(a).getTime() - startOfDay(b).getTime();
}

export function isDateOnOrBefore(target: Date, reference: Date): boolean {
  return compareDateOnly(target, reference) <= 0;
}

export function isDateAfter(target: Date, reference: Date): boolean {
  return compareDateOnly(target, reference) > 0;
}

/** Normalise vers YYYY-MM-DD ; renvoie null si la valeur est illisible. */
export function normalizeDateOnlyInput(value: string): string | null {
  const parsed = parseDateOnly(value);
  return parsed ? formatDateOnlyIso(parsed) : null;
}
