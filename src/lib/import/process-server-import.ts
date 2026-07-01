import {
  IMPORT_LIMITS,
  isCsvFile,
  isPdfFile,
  validateCsvFile,
  validatePdfFile,
} from "@/lib/dashboard/import-limits";

import { applyValidatedRowsToTable } from "./apply-import-to-table";
import {
  extractInvoiceFromCsvText,
  extractInvoiceFromPdf,
} from "./extract-invoice-with-anthropic";
import {
  validateRowsForImport,
  type ValidatedInvoiceRow,
} from "./invoice-schema";
import type { IssuerContext } from "./issuer-context";

export type ServerImportFileResult = {
  source: string;
  rows: ValidatedInvoiceRow[];
  errors: string[];
};

export function classifyServerImportFiles(files: File[]): {
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

function formatRejectionMessage(
  fileName: string,
  rejected: number,
  issuerRejected: number,
): string | null {
  if (rejected === 0) return null;

  if (issuerRejected > 0) {
    return `${fileName} : ${issuerRejected} ligne(s) rejetée(s) — coordonnées de l'émetteur détectées au lieu du client final.`;
  }

  return `${fileName} : ${rejected} ligne(s) rejetée(s) (nom, référence, échéance J+1 ou validation échouée).`;
}

async function processPdfFile(
  file: File,
  issuer: IssuerContext,
): Promise<ServerImportFileResult> {
  const validationError = validatePdfFile(file);
  if (validationError) {
    return { source: file.name, rows: [], errors: [`${file.name} : ${validationError}`] };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const extraction = await extractInvoiceFromPdf(buffer, file.name, issuer);
    const { accepted, rejected, issuerRejected } = validateRowsForImport(
      extraction.rows,
      issuer,
    );

    const errors: string[] = [];
    if (accepted.length === 0) {
      errors.push(
        `${file.name} : aucune ligne valide — vérifiez que le client final (débiteur), la référence et l'échéance sont lisibles.`,
      );
    } else {
      const rejectionMsg = formatRejectionMessage(
        file.name,
        rejected,
        issuerRejected,
      );
      if (rejectionMsg) errors.push(rejectionMsg);
    }

    return { source: file.name, rows: accepted, errors };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur d'extraction IA.";
    return {
      source: file.name,
      rows: [],
      errors: [`${file.name} : ${message}`],
    };
  }
}

async function processCsvFile(
  file: File,
  issuer: IssuerContext,
): Promise<ServerImportFileResult> {
  const validationError = validateCsvFile(file);
  if (validationError) {
    return { source: file.name, rows: [], errors: [`${file.name} : ${validationError}`] };
  }

  try {
    const csvText = await file.text();
    const extraction = await extractInvoiceFromCsvText(csvText, file.name, issuer);
    const { accepted, rejected, issuerRejected } = validateRowsForImport(
      extraction.rows,
      issuer,
    );

    const errors: string[] = [];
    if (accepted.length === 0) {
      errors.push(
        `${file.name} : aucune ligne valide (client final, référence et échéance J+1 requis).`,
      );
    } else {
      const rejectionMsg = formatRejectionMessage(
        file.name,
        rejected,
        issuerRejected,
      );
      if (rejectionMsg) errors.push(rejectionMsg);
    }

    return { source: file.name, rows: accepted, errors };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur d'extraction IA.";
    return {
      source: file.name,
      rows: [],
      errors: [`${file.name} : ${message}`],
    };
  }
}

export async function processServerImportFiles(
  files: File[],
  issuer: IssuerContext,
): Promise<{
  rows: ValidatedInvoiceRow[];
  errors: string[];
}> {
  const errors: string[] = [];
  const rows: ValidatedInvoiceRow[] = [];

  if (files.length === 0) {
    return { rows, errors: ["Aucun fichier sélectionné."] };
  }

  const { pdfs, csvs, invalid } = classifyServerImportFiles(files);

  if (invalid.length > 0) {
    return { rows, errors: ["Formats acceptés : PDF et CSV."] };
  }

  if (pdfs.length > 0 && csvs.length > 0) {
    return {
      rows,
      errors: ["Importez soit un fichier CSV, soit des PDF — pas les deux."],
    };
  }

  if (csvs.length > 1) {
    return { rows, errors: ["Un seul fichier CSV à la fois."] };
  }

  if (csvs.length === 1) {
    const result = await processCsvFile(csvs[0], issuer);
    errors.push(...result.errors);
    rows.push(...result.rows);
    return { rows, errors };
  }

  if (pdfs.length > IMPORT_LIMITS.MAX_PDF_FILES) {
    return {
      rows,
      errors: [`Maximum ${IMPORT_LIMITS.MAX_PDF_FILES} PDF par import.`],
    };
  }

  for (const pdf of pdfs) {
    const result = await processPdfFile(pdf, issuer);
    errors.push(...result.errors);
    rows.push(...result.rows);
  }

  return { rows, errors };
}

export { applyValidatedRowsToTable };
