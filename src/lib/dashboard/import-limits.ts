export const IMPORT_LIMITS = {
  /** Sous la limite body Vercel (~4,5 Mo) avec marge multipart. */
  MAX_PDF_BYTES: 4 * 1024 * 1024,
  MAX_CSV_BYTES: 1 * 1024 * 1024,
  /** Garde-fou multi-PDF (1 appel IA / fichier, enchaînés côté client). */
  MAX_PDF_FILES: 10,
  MAX_CSV_ROWS: 100,
  MAX_CSV_COLUMNS: 20,
} as const;

function fileNameLower(file: File): string {
  return file.name.trim().toLowerCase();
}

function fileTypeLower(file: File): string {
  return (file.type || "").trim().toLowerCase();
}

export function isPdfFile(file: File): boolean {
  const name = fileNameLower(file);
  const type = fileTypeLower(file);
  // Extension d'abord : sous Windows le MIME est souvent vide / octet-stream.
  return (
    name.endsWith(".pdf") ||
    type === "application/pdf" ||
    type === "application/x-pdf" ||
    type === "application/acrobat" ||
    type.endsWith("/pdf")
  );
}

export function isCsvFile(file: File): boolean {
  const name = fileNameLower(file);
  const type = fileTypeLower(file);
  return (
    name.endsWith(".csv") ||
    type === "text/csv" ||
    type === "application/csv" ||
    type === "application/vnd.ms-excel"
  );
}

export function formatMaxFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${Math.round(bytes / (1024 * 1024))} Mo`;
  }
  return `${Math.round(bytes / 1024)} Ko`;
}

export function validatePdfFile(file: File): string | null {
  if (!isPdfFile(file)) return "Format non supporté.";
  if (file.size > IMPORT_LIMITS.MAX_PDF_BYTES) {
    return `Fichier trop volumineux (max. ${formatMaxFileSize(IMPORT_LIMITS.MAX_PDF_BYTES)}).`;
  }
  return null;
}

export function validateCsvFile(file: File): string | null {
  if (!isCsvFile(file)) return "Format non supporté.";
  if (file.size > IMPORT_LIMITS.MAX_CSV_BYTES) {
    return `Fichier trop volumineux (max. ${formatMaxFileSize(IMPORT_LIMITS.MAX_CSV_BYTES)}).`;
  }
  return null;
}
