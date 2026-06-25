import {
  IMPORT_LIMITS,
  isCsvFile,
  isPdfFile,
  validateCsvFile,
  validatePdfFile,
} from "@/lib/dashboard/import-limits";

import { extractTextFromPdf } from "./extract-pdf-text";
import {
  hasUsableInvoiceFields,
  parseInvoiceFields,
  type ParsedInvoiceFields,
} from "./parse-invoice-fields";
import { parseCsvFileToInvoiceRows } from "./parse-csv";

export type BulkImportEntry = {
  id: string;
  source: string;
  fields: ParsedInvoiceFields;
  skipped: boolean;
};

export type ProcessImportResult = {
  entries: BulkImportEntry[];
  errors: string[];
};

function createEntry(
  source: string,
  fields: ParsedInvoiceFields,
): BulkImportEntry {
  return {
    id: crypto.randomUUID(),
    source,
    fields,
    skipped: false,
  };
}

export function classifyImportFiles(files: File[]): {
  pdfs: File[];
  csvs: File[];
  invalid: File[];
} {
  const pdfs: File[] = [];
  const csvs: File[] = [];
  const invalid: File[] = [];

  for (const file of files) {
    if (isPdfFile(file)) pdfs.push(file);
    else if (isCsvFile(file)) csvs.push(file);
    else invalid.push(file);
  }

  return { pdfs, csvs, invalid };
}

async function processPdfFile(file: File): Promise<{
  entry: BulkImportEntry | null;
  error: string | null;
}> {
  const validationError = validatePdfFile(file);
  if (validationError) {
    return { entry: null, error: `${file.name} : ${validationError}` };
  }

  try {
    const text = await extractTextFromPdf(file);
    if (!text.trim()) {
      return {
        entry: null,
        error: `${file.name} : aucun texte lisible (scan non supporté).`,
      };
    }

    const fields = parseInvoiceFields(text);
    if (!hasUsableInvoiceFields(fields)) {
      return {
        entry: null,
        error: `${file.name} : informations non détectées.`,
      };
    }

    return { entry: createEntry(file.name, fields), error: null };
  } catch {
    return { entry: null, error: `${file.name} : lecture impossible.` };
  }
}

async function processCsvFile(file: File): Promise<{
  entries: BulkImportEntry[];
  error: string | null;
}> {
  const validationError = validateCsvFile(file);
  if (validationError) {
    return { entries: [], error: `${file.name} : ${validationError}` };
  }

  try {
    const rows = await parseCsvFileToInvoiceRows(file);
    if (rows.length === 0) {
      return {
        entries: [],
        error: `${file.name} : aucune ligne exploitable (vérifiez les en-têtes).`,
      };
    }

    return {
      entries: rows.map((fields, index) =>
        createEntry(`${file.name} — ligne ${index + 1}`, fields),
      ),
      error: null,
    };
  } catch {
    return { entries: [], error: `${file.name} : lecture impossible.` };
  }
}

export async function processImportFiles(
  files: File[],
): Promise<ProcessImportResult> {
  const errors: string[] = [];
  const entries: BulkImportEntry[] = [];

  if (files.length === 0) {
    return { entries, errors: ["Aucun fichier sélectionné."] };
  }

  const { pdfs, csvs, invalid } = classifyImportFiles(files);

  if (invalid.length > 0) {
    errors.push("Formats acceptés : PDF et CSV.");
    return { entries, errors };
  }

  if (csvs.length > 0 && pdfs.length > 0) {
    errors.push("Importez soit un fichier CSV, soit des PDF — pas les deux.");
    return { entries, errors };
  }

  if (csvs.length > 1) {
    errors.push("Un seul fichier CSV à la fois.");
    return { entries, errors };
  }

  if (csvs.length === 1) {
    const { entries: csvEntries, error } = await processCsvFile(csvs[0]);
    if (error) errors.push(error);
    return { entries: csvEntries, errors };
  }

  if (pdfs.length > IMPORT_LIMITS.MAX_PDF_FILES) {
    errors.push(`Maximum ${IMPORT_LIMITS.MAX_PDF_FILES} PDF par import.`);
    return { entries, errors };
  }

  for (const pdf of pdfs) {
    const { entry, error } = await processPdfFile(pdf);
    if (entry) entries.push(entry);
    if (error) errors.push(error);
  }

  return { entries, errors };
}

export function isSinglePdfImport(files: File[]): boolean {
  const { pdfs, csvs, invalid } = classifyImportFiles(files);
  return pdfs.length === 1 && csvs.length === 0 && invalid.length === 0;
}
