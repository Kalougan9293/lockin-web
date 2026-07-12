import PDFDocument from "pdfkit";
import type PDFKit from "pdfkit";

import { formatAmountForDisplay } from "@/lib/preferences/currency-format";
import {
  formatDateForDisplay,
  parseDateInputToIso,
} from "@/lib/preferences/date-format";
import { getRowFieldValue } from "@/lib/dashboard/recovery";
import type { ClientRow, ColumnDef } from "@/types/tableau";

import type { RelanceEmailCreditor } from "../dashboard/relance-email-body";

export type RelancePdfInvoiceRow = {
  reference: string;
  date: string;
  amount: string;
  remaining: string;
};

export type RelancePdfData = {
  creditor: RelanceEmailCreditor;
  invoices: RelancePdfInvoiceRow[];
  messageBody: string;
};

function formatPdfDate(raw: string): string {
  if (!raw.trim()) return "—";
  const iso = parseDateInputToIso(raw, "fr");
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return formatDateForDisplay(iso, "fr");
  }
  return raw.trim();
}

function formatPdfAmount(raw: string): string {
  if (!raw.trim()) return "—";
  return formatAmountForDisplay(raw);
}

export function buildRelancePdfInvoiceRow(
  row: ClientRow,
  columns: ColumnDef[],
): RelancePdfInvoiceRow {
  const reference =
    getRowFieldValue(
      row,
      columns,
      "N°Facture",
      "Référence",
      "reference",
      "Facture",
    ) || "—";
  const dateRaw = getRowFieldValue(row, columns, "Date");
  const amountRaw = getRowFieldValue(row, columns, "Montant", "montant");
  const amount = formatPdfAmount(amountRaw);

  return {
    reference,
    date: formatPdfDate(dateRaw),
    amount,
    remaining: amount,
  };
}

function drawTableHeader(doc: PDFKit.PDFDocument, y: number): number {
  const left = 50;
  const widths = [120, 90, 110, 110];
  const headers = ["N° Facture", "Date", "Montant", "Reste à payer"];

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#111827");

  let x = left;
  for (let index = 0; index < headers.length; index += 1) {
    doc.text(headers[index], x, y, { width: widths[index], align: "left" });
    x += widths[index];
  }

  doc
    .moveTo(left, y + 16)
    .lineTo(left + widths.reduce((sum, width) => sum + width, 0), y + 16)
    .strokeColor("#d1d5db")
    .stroke();

  return y + 24;
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  row: RelancePdfInvoiceRow,
  y: number,
): number {
  const left = 50;
  const widths = [120, 90, 110, 110];
  const values = [row.reference, row.date, row.amount, row.remaining];

  doc.font("Helvetica").fontSize(10).fillColor("#374151");

  let x = left;
  for (let index = 0; index < values.length; index += 1) {
    doc.text(values[index], x, y, { width: widths[index], align: "left" });
    x += widths[index];
  }

  return y + 18;
}

function drawMessageBody(doc: PDFKit.PDFDocument, messageBody: string, y: number) {
  const paragraphs = messageBody
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  doc.font("Helvetica-Bold").fontSize(12).fillColor("#111827").text("Message", 50, y);
  let cursorY = y + 22;

  doc.font("Helvetica").fontSize(11).fillColor("#374151");

  for (const paragraph of paragraphs) {
    doc.text(paragraph, 50, cursorY, {
      width: 495,
      align: "left",
      lineGap: 4,
    });
    cursorY = doc.y + 12;
  }

  return cursorY;
}

export async function generateRelancePdfBuffer(
  data: RelancePdfData,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const companyName = data.creditor.companyName.trim() || "Votre créancier";
    const creditorEmail = data.creditor.email.trim();

    doc.font("Helvetica-Bold").fontSize(18).fillColor("#111827").text(companyName, 50, 50);

    if (creditorEmail) {
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#6b7280")
        .text(creditorEmail, 50, doc.y + 4);
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#111827")
      .text("Récapitulatif des factures impayées", 50, doc.y + 24);

    let tableY = drawTableHeader(doc, doc.y + 12);
    for (const invoice of data.invoices) {
      tableY = drawTableRow(doc, invoice, tableY);
    }

    const bodyY = drawMessageBody(doc, data.messageBody, tableY + 20);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#6b7280")
      .text("Cordialement,", 50, bodyY + 16)
      .text(companyName, 50, doc.y + 4);

    doc
      .font("Helvetica-Oblique")
      .fontSize(9)
      .fillColor("#9ca3af")
      .text(
        "Ceci est un document de suivi de paiement. La facture originale est disponible auprès de votre prestataire.",
        50,
        doc.y + 28,
        { width: 495, align: "left", lineGap: 3 },
      );

    doc.end();
  });
}
