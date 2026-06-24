export type DateFormatPreference = "fr" | "iso";

export const DATE_FORMAT_STORAGE_KEY = "lockin-date-format";

export const DATE_FORMAT_OPTIONS: {
  id: DateFormatPreference;
  label: string;
  example: string;
  placeholder: string;
}[] = [
  {
    id: "fr",
    label: "JJ/MM/AAAA",
    example: "31/12/2026",
    placeholder: "JJ/MM/AAAA",
  },
  {
    id: "iso",
    label: "AAAA-MM-JJ",
    example: "2026-12-31",
    placeholder: "AAAA-MM-JJ",
  },
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseIsoParts(value: string) {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { year, month, day };
}

function parseFrParts(value: string) {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { year, month, day };
}

export function toIsoDate(parts: {
  year: number;
  month: number;
  day: number;
}) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function formatDateForDisplay(
  value: string,
  format: DateFormatPreference,
): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const isoParts = parseIsoParts(trimmed);
  if (isoParts) {
    if (format === "fr") {
      return `${pad(isoParts.day)}/${pad(isoParts.month)}/${isoParts.year}`;
    }
    return toIsoDate(isoParts);
  }

  const frParts = parseFrParts(trimmed);
  if (frParts) {
    if (format === "fr") {
      return `${pad(frParts.day)}/${pad(frParts.month)}/${frParts.year}`;
    }
    return toIsoDate(frParts);
  }

  return trimmed;
}

export function parseDateInputToIso(
  value: string,
  format: DateFormatPreference,
): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (format === "iso") {
    const isoParts = parseIsoParts(trimmed);
    return isoParts ? toIsoDate(isoParts) : trimmed;
  }

  const frParts = parseFrParts(trimmed);
  return frParts ? toIsoDate(frParts) : trimmed;
}

export function isDateColumnLabel(label: string) {
  const normalized = label.toLowerCase();
  return (
    normalized.includes("date") ||
    normalized.includes("échéance") ||
    normalized.includes("echeance")
  );
}

export function getDatePlaceholder(format: DateFormatPreference) {
  return DATE_FORMAT_OPTIONS.find((option) => option.id === format)?.placeholder ?? "";
}

/** Formate la saisie en direct : JJ/MM/AAAA ou AAAA-MM-JJ selon la préférence. */
export function formatDateInputAsYouType(
  value: string,
  format: DateFormatPreference,
): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (format === "fr") {
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}
