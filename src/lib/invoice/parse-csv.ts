import Papa from "papaparse";

import { IMPORT_LIMITS } from "@/lib/dashboard/import-limits";

import {
  hasUsableInvoiceFields,
  type ParsedInvoiceFields,
} from "./parse-invoice-fields";

const HEADER_ALIASES: Record<string, string> = {
  nom: "Nom",
  name: "Nom",
  client: "Nom",
  societe: "Nom",
  société: "Nom",
  entreprise: "Nom",
  mail: "Mail",
  email: "Mail",
  "e-mail": "Mail",
  courriel: "Mail",
  montant: "Montant",
  amount: "Montant",
  total: "Montant",
  "total ttc": "Montant",
  date: "Date",
  "date facture": "Date",
  echeance: "Échéance",
  échéance: "Échéance",
  "date echeance": "Échéance",
  "date échéance": "Échéance",
  reference: "Référence",
  référence: "Référence",
  ref: "Référence",
  facture: "Référence",
  numero: "Numéro",
  numéro: "Numéro",
  tel: "Numéro",
  telephone: "Numéro",
  téléphone: "Numéro",
  phone: "Numéro",
  info: "Info",
  notes: "Info",
};

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function mapHeaderToField(header: string): string | null {
  const normalized = normalizeHeader(header);
  return HEADER_ALIASES[normalized] ?? null;
}

function rowToFields(
  headers: string[],
  cells: string[],
): ParsedInvoiceFields | null {
  const fields: ParsedInvoiceFields = {};

  for (let index = 0; index < headers.length; index += 1) {
    const mapped = mapHeaderToField(headers[index]);
    const value = cells[index]?.trim() ?? "";
    if (!mapped || !value) continue;
    fields[mapped] = value;
  }

  return hasUsableInvoiceFields(fields) ? fields : null;
}

export function parseCsvToInvoiceRows(csvText: string): ParsedInvoiceFields[] {
  const parsed = Papa.parse<string[]>(csvText, {
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0 || !parsed.data.length) {
    return [];
  }

  const [headerRow, ...dataRows] = parsed.data;
  if (!headerRow?.length) return [];

  const headers = headerRow.slice(0, IMPORT_LIMITS.MAX_CSV_COLUMNS);
  const rows: ParsedInvoiceFields[] = [];

  for (const cells of dataRows) {
    if (rows.length >= IMPORT_LIMITS.MAX_CSV_ROWS) break;
    const fields = rowToFields(headers, cells);
    if (fields) rows.push(fields);
  }

  return rows;
}

export async function parseCsvFileToInvoiceRows(
  file: File,
): Promise<ParsedInvoiceFields[]> {
  const text = await file.text();
  return parseCsvToInvoiceRows(text);
}
