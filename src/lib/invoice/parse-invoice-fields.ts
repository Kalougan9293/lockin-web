export type ParsedInvoiceFields = Record<string, string>;

const EMAIL_PATTERN = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g;
const PHONE_PATTERN = /(?:\+33\s*|0)[1-9](?:[\s.\-]*\d{2}){4}/g;

const CLIENT_BLOCK_START =
  /(?:factur[ée]\s*[àa]|client|destinataire|adresse\s+de\s+facturation|bill\s+to)\s*:?\s*/i;

const CLIENT_BLOCK_STOP =
  /^(?:d[ée]tail|d[ée]signation|prestation|description|total|montant|tva|iban|bic|conditions|mode\s+de\s+paiement|paiement|objet|quantit[ée])/i;

const PERSON_NAME_PATTERN =
  /^[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ'’-]+(?:\s+[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ'’-]+){1,3}$/;

const COMPANY_PATTERN =
  /\b(sarl|sas|eurl|sa|sci|sasu|auto-entrepreneur|micro-entreprise|ltd|gmbh|inc)\b/i;

function normalizeWhitespace(text: string) {
  return text.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function normalizeAmount(raw: string): string {
  const cleaned = raw.replace(/\s/g, "").replace(/[^\d,.-]/g, "");
  if (!cleaned) return raw.trim();

  if (cleaned.includes(",") && cleaned.includes(".")) {
    return cleaned.replace(/\./g, "").replace(",", ".");
  }
  if (cleaned.includes(",")) {
    return cleaned.replace(",", ".");
  }
  return cleaned;
}

function parseDateToIso(raw: string): string | null {
  const trimmed = raw.trim();

  const fr = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (fr) {
    const day = fr[1].padStart(2, "0");
    const month = fr[2].padStart(2, "0");
    let year = fr[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  const iso = trimmed.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  }

  return null;
}

function addDaysToIso(isoDate: string, days: number): string | null {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;

  date.setDate(date.getDate() + days);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DATE_VALUE_PATTERN =
  "([\\d]{1,2}[\\/\\-.][\\d]{1,2}[\\/\\-.][\\d]{2,4}|\\d{4}[\\/\\-.][\\d]{1,2}[\\/\\-.][\\d]{1,2})";

function extractLabeledDate(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const pattern = new RegExp(`${label}[:\\s]*${DATE_VALUE_PATTERN}`, "i");
    const match = text.match(pattern);
    if (match?.[1]) {
      const iso = parseDateToIso(match[1]);
      if (iso) return iso;
    }
  }
  return null;
}

/** Délai de paiement en jours (« 40 jours pour payer », « net 30 », etc.). */
function extractPaymentTermDays(text: string): number | null {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

  const patterns = [
    /(?:paiement|payable|reglement)\s*(?:a|dans|sous|within|in)?\s*(\d{1,3})\s*jours?/i,
    /(\d{1,3})\s*jours?\s*(?:pour\s*)?payer/i,
    /(\d{1,3})\s*jours?\s*net\b/i,
    /(?:net|delai(?:\s*de\s*paiement)?)\s*[:\s]*(\d{1,3})\s*jours?/i,
    /(?:echeance|échéance)\s*[:\s]*(\d{1,3})\s*jours?/i,
    /(?:within|in)\s*(\d{1,3})\s*days?/i,
    /(\d{1,3})\s*days?\s*net\b/i,
    /(?:terms?|payment)\s*[:\s]*(\d{1,3})\s*days?/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const days = match?.[1] ? Number.parseInt(match[1], 10) : Number.NaN;
    if (Number.isFinite(days) && days >= 1 && days <= 180) {
      return days;
    }
  }

  return null;
}

function computeDueDateFromTerms(
  text: string,
  invoiceDate: string | null,
): string | null {
  if (!invoiceDate) return null;

  const paymentDays = extractPaymentTermDays(text);
  if (paymentDays === null) return null;

  return addDaysToIso(invoiceDate, paymentDays);
}

function firstMatch(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return null;
}

function findAllEmails(text: string): string[] {
  return [...text.matchAll(EMAIL_PATTERN)].map((match) => match[0]);
}

function findAllPhones(text: string): string[] {
  return [...text.matchAll(PHONE_PATTERN)].map((match) =>
    match[0].replace(/\s+/g, " ").trim(),
  );
}

function locateClientBlock(lines: string[]): { from: number; inlineFirst?: string } | null {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!CLIENT_BLOCK_START.test(line)) continue;

    const inline = line.replace(CLIENT_BLOCK_START, "").trim();
    if (inline.length >= 3) {
      return { from: index, inlineFirst: inline };
    }

    return { from: index + 1 };
  }

  return null;
}

function extractClientBlock(rawText: string): string | null {
  const normalized = rawText.replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const located = locateClientBlock(lines);

  if (!located) {
    const blockMatch = normalized.match(
      /(?:factur[ée]\s*[àa]|client|destinataire|adresse\s+de\s+facturation|bill\s+to)\s*:?\s*\n([\s\S]{8,500}?)(?:\n\s*\n|d[ée]tail|d[ée]signation|total\s|montant\s)/i,
    );
    return blockMatch?.[1]?.trim() ?? null;
  }

  const blockLines: string[] = [];
  if (located.inlineFirst) {
    blockLines.push(located.inlineFirst);
  }

  for (
    let index = located.from;
    index < Math.min(located.from + 12, lines.length);
    index += 1
  ) {
    const line = lines[index].trim();
    if (!line) {
      if (blockLines.length > 0) break;
      continue;
    }
    if (CLIENT_BLOCK_START.test(line)) continue;
    if (CLIENT_BLOCK_STOP.test(line)) break;
    if (located.inlineFirst && line === located.inlineFirst) continue;
    blockLines.push(line);
  }

  return blockLines.length > 0 ? blockLines.join("\n") : null;
}

function extractIssuerSection(rawText: string): string {
  const normalized = rawText.replace(/\r/g, "\n");
  const clientMatch = normalized.match(CLIENT_BLOCK_START);
  if (clientMatch?.index && clientMatch.index > 0) {
    return normalized.slice(0, clientMatch.index);
  }
  return normalized.slice(0, Math.min(normalized.length, 900));
}

function pickClientContact<T extends string>(
  clientBlock: string | null,
  fullText: string,
  issuerSection: string,
  finder: (text: string) => T[],
): T | null {
  if (clientBlock) {
    const fromClient = finder(clientBlock);
    if (fromClient[0]) return fromClient[0];
  }

  const issuerContacts = new Set(finder(issuerSection));
  const allContacts = finder(fullText);

  for (const contact of allContacts) {
    if (!issuerContacts.has(contact)) return contact;
  }

  if (allContacts.length > 1) {
    return allContacts[allContacts.length - 1];
  }

  return null;
}

function looksLikePersonName(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 4 || trimmed.length > 60) return false;
  if (/@|www\.|https?:|siret|siren|tva|iban|bic|tel|phone|facture/i.test(trimmed)) {
    return false;
  }
  if (COMPANY_PATTERN.test(trimmed)) return false;
  if (/^\d/.test(trimmed) || /^[\d\s.,€+\-()]+$/.test(trimmed)) return false;

  return PERSON_NAME_PATTERN.test(trimmed);
}

function extractClientName(rawText: string, clientBlock: string | null): string | null {
  const searchBlocks = [clientBlock, rawText.replace(/\r/g, "\n")].filter(
    (block): block is string => Boolean(block),
  );

  for (const block of searchBlocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);

    for (const line of lines) {
      const afterLabel = line
        .replace(CLIENT_BLOCK_START, "")
        .trim();
      if (looksLikePersonName(afterLabel)) return afterLabel;
      if (looksLikePersonName(line)) return line;
    }

    const labeled = firstMatch(block, [
      /(?:factur[ée]\s*[àa]|client|destinataire|bill\s*to)\s*:?\s*([A-ZÀ-ÖØ-Ý][^\n@]{2,60})/i,
    ]);
    if (labeled) {
      const candidate = labeled.split(/\s{2,}|,/)[0]?.trim() ?? labeled;
      if (looksLikePersonName(candidate)) return candidate;
      if (candidate.length >= 3 && candidate.length <= 60 && !/@/.test(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function extractInvoiceReference(rawText: string): string | null {
  const patterns = [
    /facture\s*(?:n[°º]|no|num(?:[ée]ro)?)?\s*[:\s#-]*([A-Z]{0,4}[\s-]*\d[\w\-\/_.]{0,18})/i,
    /n[°º]\s*(?:de\s*)?facture\s*[:\s#-]*([A-Z0-9][\w\-\/_.]{1,20})/i,
    /invoice\s*(?:#|n[°º]|number)?\s*[:\s-]*([A-Z0-9][\w\-\/_.]{1,20})/i,
    /r[ée]f(?:[.\sérence]*facture)?\s*[:\s#-]*([A-Z0-9][\w\-\/_.]{2,20})/i,
  ];

  for (const pattern of patterns) {
    const match = rawText.match(pattern);
    const value = match?.[1]?.replace(/\s+/g, " ").trim();
    if (!value) continue;
    const compact = value.replace(/\s/g, "");
    if (/^\d{9,14}$/.test(compact)) continue;
    if (/^(facture|invoice|client|n)$/i.test(compact)) continue;
    return value;
  }

  return null;
}

function extractAmount(text: string) {
  const inline = firstMatch(text, [
    /(?:total\s*ttc|montant\s*ttc|net\s*[àa]\s*payer|total\s*du|amount\s*due|total\s*due|balance\s*due)[:\s]*([\d\s.,]+)\s*(?:€|eur)?/i,
    /(?:ttc)[:\s]*([\d\s.,]+)\s*€/i,
  ]);
  if (inline) return normalizeAmount(inline);

  const euroSuffix = text.match(/([\d\s.,]{1,12})\s*€(?:\s*ttc)?/i);
  if (euroSuffix) return normalizeAmount(euroSuffix[1]);

  return null;
}

function extractDate(text: string, labels: string[]) {
  const labeled = extractLabeledDate(text, labels);
  if (labeled) return labeled;

  const fallback = text.match(
    /(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}|\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})/,
  );
  if (fallback?.[1]) return parseDateToIso(fallback[1]);

  return null;
}

export function parseInvoiceFields(rawText: string): ParsedInvoiceFields {
  const text = normalizeWhitespace(rawText);
  const clientBlock = extractClientBlock(rawText);
  const issuerSection = extractIssuerSection(rawText);
  const fields: ParsedInvoiceFields = {};

  const nom = extractClientName(rawText, clientBlock);
  if (nom) fields.Nom = nom;

  const mail = pickClientContact(clientBlock, rawText, issuerSection, findAllEmails);
  if (mail) fields.Mail = mail;

  const phone = pickClientContact(clientBlock, rawText, issuerSection, findAllPhones);
  if (phone) fields.Numéro = phone;

  const montant = extractAmount(text);
  if (montant) fields.Montant = montant;

  const date =
    extractLabeledDate(text, [
      "date\\s*(?:de\\s*)?(?:facture|émission|emission)",
      "factur[ée]\\s*le",
      "émise?\\s*le",
      "invoice\\s*date",
      "date\\s*facture",
    ]) ??
    extractDate(text, ["date(?:\\s*(?:de\\s*)?facture)?", "date"]);
  if (date) fields.Date = date;

  let echeance = extractLabeledDate(text, [
    "échéance",
    "echeance",
    "due\\s*date",
    "date\\s*limite",
  ]);

  if (!echeance) {
    echeance = computeDueDateFromTerms(text, date);
  }

  if (echeance && echeance !== date) fields.Échéance = echeance;

  const reference = extractInvoiceReference(rawText);
  if (reference) fields.Référence = reference;

  return fields;
}

export function hasUsableInvoiceFields(fields: ParsedInvoiceFields) {
  return Object.values(fields).some((value) => value.trim());
}
