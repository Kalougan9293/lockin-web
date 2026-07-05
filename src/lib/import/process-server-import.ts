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
  formatRowRejectionReason,
  getLlmRowReviewMeta,
  mapLlmRowToReviewPayload,
  validateRowsForImport,
} from "./invoice-schema";
import type { IssuerContext } from "./issuer-context";

export type ImportReviewQueueItem = {
  fields: Record<string, string>;
  fileName: string;
  ambigu: boolean;
  notes: string;
};

export type ServerImportFileResult = {
  source: string;
  errors: string[];
  reviewQueue: ImportReviewQueueItem[];
};

function buildNoValidRowsMessage(
  fileName: string,
  rejectionReasons: ReturnType<typeof validateRowsForImport>["rejectionReasons"],
  hasReviewRows: boolean,
): string {
  const primaryReason = rejectionReasons[0];
  const detail = primaryReason
    ? formatRowRejectionReason(primaryReason)
    : "données incomplètes";

  if (hasReviewRows) {
    return `${fileName} : ${detail} — complétez les champs dans la fenêtre d'ajout.`;
  }

  return `${fileName} : aucune ligne valide (${detail}). Vérifiez que le client final (débiteur), la référence et l'échéance sont lisibles.`;
}

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
    return {
      source: file.name,
      errors: [`${file.name} : ${validationError}`],
      reviewQueue: [],
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const extraction = await extractInvoiceFromPdf(buffer, file.name, issuer);
    const { rejected, issuerRejected, rejectionReasons } = validateRowsForImport(
      extraction.rows,
      issuer,
    );

    const reviewQueue = extraction.rows
      .map((row) => {
        const fields = mapLlmRowToReviewPayload(row);
        if (!fields) return null;
        const meta = getLlmRowReviewMeta(row);
        return {
          fields,
          fileName: file.name,
          ambigu: meta.ambigu,
          notes: meta.notes,
        };
      })
      .filter((item): item is ImportReviewQueueItem => item !== null);

    const errors: string[] = [];
    if (reviewQueue.length === 0) {
      errors.push(
        buildNoValidRowsMessage(file.name, rejectionReasons, false),
      );
    } else if (rejected > 0) {
      const rejectionMsg = formatRejectionMessage(
        file.name,
        rejected,
        issuerRejected,
      );
      if (rejectionMsg) errors.push(rejectionMsg);
    }

    return { source: file.name, errors, reviewQueue };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur d'extraction IA.";
    return {
      source: file.name,
      errors: [`${file.name} : ${message}`],
      reviewQueue: [],
    };
  }
}

async function processCsvFile(
  file: File,
  issuer: IssuerContext,
): Promise<ServerImportFileResult> {
  const validationError = validateCsvFile(file);
  if (validationError) {
    return {
      source: file.name,
      errors: [`${file.name} : ${validationError}`],
      reviewQueue: [],
    };
  }

  try {
    const csvText = await file.text();
    const extraction = await extractInvoiceFromCsvText(csvText, file.name, issuer);
    const { rejected, issuerRejected, rejectionReasons } = validateRowsForImport(
      extraction.rows,
      issuer,
    );

    const reviewQueue = extraction.rows
      .map((row) => {
        const fields = mapLlmRowToReviewPayload(row);
        if (!fields) return null;
        const meta = getLlmRowReviewMeta(row);
        return {
          fields,
          fileName: file.name,
          ambigu: meta.ambigu,
          notes: meta.notes,
        };
      })
      .filter((item): item is ImportReviewQueueItem => item !== null);

    const errors: string[] = [];
    if (reviewQueue.length === 0) {
      errors.push(
        buildNoValidRowsMessage(file.name, rejectionReasons, false),
      );
    } else if (rejected > 0) {
      const rejectionMsg = formatRejectionMessage(
        file.name,
        rejected,
        issuerRejected,
      );
      if (rejectionMsg) errors.push(rejectionMsg);
    }

    return { source: file.name, errors, reviewQueue };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur d'extraction IA.";
    return {
      source: file.name,
      errors: [`${file.name} : ${message}`],
      reviewQueue: [],
    };
  }
}

export async function processServerImportFiles(
  files: File[],
  issuer: IssuerContext,
): Promise<{
  reviewQueue: ImportReviewQueueItem[];
  errors: string[];
}> {
  const errors: string[] = [];
  const reviewQueue: ImportReviewQueueItem[] = [];

  if (files.length === 0) {
    return { reviewQueue, errors: ["Aucun fichier sélectionné."] };
  }

  const { pdfs, csvs, invalid } = classifyServerImportFiles(files);

  if (invalid.length > 0) {
    return { reviewQueue, errors: ["Formats acceptés : PDF et CSV."] };
  }

  if (pdfs.length > 0 && csvs.length > 0) {
    return {
      reviewQueue,
      errors: ["Importez soit un fichier CSV, soit des PDF — pas les deux."],
    };
  }

  if (csvs.length > 1) {
    return { reviewQueue, errors: ["Un seul fichier CSV à la fois."] };
  }

  if (csvs.length === 1) {
    const result = await processCsvFile(csvs[0], issuer);
    errors.push(...result.errors);
    reviewQueue.push(...result.reviewQueue);
    return { reviewQueue, errors };
  }

  if (pdfs.length > IMPORT_LIMITS.MAX_PDF_FILES) {
    return {
      reviewQueue,
      errors: [`Maximum ${IMPORT_LIMITS.MAX_PDF_FILES} PDF par import.`],
    };
  }

  for (const pdf of pdfs) {
    const result = await processPdfFile(pdf, issuer);
    errors.push(...result.errors);
    reviewQueue.push(...result.reviewQueue);
  }

  return { reviewQueue, errors };
}

export { applyValidatedRowsToTable };
