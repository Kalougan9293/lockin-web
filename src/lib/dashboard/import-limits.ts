export const IMPORT_LIMITS = {
  MAX_PDF_BYTES: 5 * 1024 * 1024,
  MAX_CSV_BYTES: 1 * 1024 * 1024,
  MAX_PDF_FILES: 20,
  MAX_CSV_ROWS: 100,
  MAX_CSV_COLUMNS: 20,
} as const;

export function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

export function isCsvFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "text/csv" ||
    file.type === "application/vnd.ms-excel" ||
    name.endsWith(".csv")
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
