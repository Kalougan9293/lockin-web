import { z } from "zod";

import { validateDueDateForRelance } from "@/lib/dashboard/relance-schedule";
import { parseAmountToStorage } from "@/lib/preferences/currency-format";
import {
  COLUMN_LABEL_FACTURE,
  COLUMN_LABEL_TELEPHONE,
} from "@/types/tableau";

import {
  rowMatchesIssuer,
  type IssuerContext,
} from "./issuer-context";

/** Schéma brut renvoyé par Claude (Structured Outputs). */
export const llmInvoiceRowSchema = z.object({
  nom: z.string(),
  email: z.string(),
  echeance: z.string(),
  date_emission: z.string(),
  reference: z.string(),
  numero: z.string(),
  montant: z.string(),
  ambigu: z.boolean(),
  notes: z.string(),
});

export const llmExtractionSchema = z.object({
  rows: z.array(llmInvoiceRowSchema).min(1),
});

export type LlmInvoiceRow = z.infer<typeof llmInvoiceRowSchema>;
export type LlmExtraction = z.infer<typeof llmExtractionSchema>;

/** Schéma métier après nettoyage — champs obligatoires pour insertion. */
export const validatedInvoiceRowSchema = z.object({
  Nom: z.string().min(1, "Nom du client final requis"),
  Mail: z.union([z.literal(""), z.string().email("E-mail invalide")]),
  Échéance: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Échéance au format AAAA-MM-JJ"),
  Référence: z.string().min(1, "Référence de facture requise"),
  Numéro: z.string(),
});

export type ValidatedInvoiceRow = z.infer<typeof validatedInvoiceRowSchema>;

export const INVOICE_EXTRACTION_JSON_SCHEMA = {
  type: "object",
  properties: {
    rows: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nom: {
            type: "string",
            description:
              "Nom du client final / débiteur (destinataire « Facturé à »), jamais l'émetteur",
          },
          email: {
            type: "string",
            description:
              "E-mail du client final / débiteur uniquement, ou chaîne vide si absent",
          },
          echeance: {
            type: "string",
            description:
              "Date limite de paiement de la facture au format ISO AAAA-MM-JJ",
          },
          date_emission: {
            type: "string",
            description:
              "Date d'émission de la facture au format ISO AAAA-MM-JJ — distincte de l'échéance",
          },
          reference: {
            type: "string",
            description:
              "Référence ou numéro unique de la facture (ex. FACT-2024-042)",
          },
          numero: {
            type: "string",
            description:
              "Numéro de téléphone du client final / débiteur, ou chaîne vide",
          },
          montant: {
            type: "string",
            description:
              "Montant total TTC ou net à payer en euros (ex. 980.00 ou 1330.00), chaîne vide si introuvable",
          },
          ambigu: {
            type: "boolean",
            description:
              "true si doute sur émetteur vs client ou champ critique incertain",
          },
          notes: {
            type: "string",
            description: "Toujours une chaîne vide — ne pas remplir",
          },
        },
        required: [
          "nom",
          "email",
          "echeance",
          "date_emission",
          "reference",
          "numero",
          "montant",
          "ambigu",
          "notes",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["rows"],
  additionalProperties: false,
} as const;

function normalizeIsoDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const isoDateTime = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T\s]/);
  if (isoDateTime) return isoDateTime[1];

  const fr = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (fr) {
    const day = fr[1].padStart(2, "0");
    const month = fr[2].padStart(2, "0");
    let year = fr[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  return null;
}

export type RowRejectionReason =
  | "missing_name"
  | "missing_reference"
  | "invalid_due_date"
  | "due_date_past"
  | "issuer_match";

export function formatRowRejectionReason(reason: RowRejectionReason): string {
  switch (reason) {
    case "missing_name":
      return "nom du client final introuvable";
    case "missing_reference":
      return "référence de facture introuvable";
    case "invalid_due_date":
      return "date d'échéance illisible ou format non reconnu";
    case "due_date_past":
      return "échéance passée ou aujourd'hui (minimum demain, J+1)";
    case "issuer_match":
      return "coordonnées de l'émetteur détectées au lieu du client final";
    default:
      return "données incomplètes";
  }
}

export function getRowRejectionReason(
  row: LlmInvoiceRow,
  issuer?: IssuerContext,
): RowRejectionReason | null {
  const nom = row.nom.trim();
  if (!nom) return "missing_name";

  const reference = row.reference.trim();
  if (!reference) return "missing_reference";

  const echeanceIso = normalizeIsoDate(row.echeance);
  if (!echeanceIso) return "invalid_due_date";

  if (validateDueDateForRelance(echeanceIso)) return "due_date_past";

  let email = row.email.trim();
  if (email && !z.string().email().safeParse(email).success) {
    email = "";
  }

  const candidate: ValidatedInvoiceRow = {
    Nom: nom,
    Mail: email,
    Échéance: echeanceIso,
    Référence: reference,
    Numéro: row.numero.trim(),
  };

  const parsed = validatedInvoiceRowSchema.safeParse(candidate);
  if (!parsed.success) return "invalid_due_date";

  if (issuer && rowMatchesIssuer(parsed.data, issuer)) {
    return "issuer_match";
  }

  return null;
}

/** Préremplissage modale — inclut les lignes partielles pour validation manuelle. */
export function mapLlmRowToReviewPayload(
  row: LlmInvoiceRow,
): Record<string, string> | null {
  const nom = row.nom.trim();
  const reference = row.reference.trim();
  const echeanceRaw = row.echeance.trim();
  const dateEmissionRaw = row.date_emission.trim();
  const email = row.email.trim();
  const montantRaw = row.montant.trim();
  const numero = row.numero.trim();

  const hasContent =
    nom.length > 0 ||
    reference.length > 0 ||
    echeanceRaw.length > 0 ||
    dateEmissionRaw.length > 0 ||
    email.length > 0 ||
    montantRaw.length > 0 ||
    numero.length > 0;

  if (!hasContent) return null;

  const echeanceIso = normalizeIsoDate(echeanceRaw) ?? echeanceRaw;
  const dateEmissionIso = dateEmissionRaw
    ? normalizeIsoDate(dateEmissionRaw) ?? dateEmissionRaw
    : "";
  const montantStored = montantRaw ? parseAmountToStorage(montantRaw) : "";

  return {
    Nom: nom,
    Mail: email,
    Échéance: echeanceIso,
    ...(reference ? { [COLUMN_LABEL_FACTURE]: reference } : {}),
    ...(numero ? { [COLUMN_LABEL_TELEPHONE]: numero } : {}),
    ...(montantStored ? { Montant: montantStored } : {}),
    ...(dateEmissionIso ? { Date: dateEmissionIso } : {}),
  };
}

export function getLlmRowReviewMeta(row: LlmInvoiceRow): {
  ambigu: boolean;
  notes: string;
} {
  return {
    ambigu: row.ambigu,
    notes: "",
  };
}

export function mapLlmRowToTablePayload(
  row: LlmInvoiceRow,
  issuer?: IssuerContext,
): ValidatedInvoiceRow | null {
  const nom = row.nom.trim();
  if (!nom) return null;

  const reference = row.reference.trim();
  if (!reference) return null;

  const echeanceIso = normalizeIsoDate(row.echeance);
  if (!echeanceIso) return null;

  const dueDateError = validateDueDateForRelance(echeanceIso);
  if (dueDateError) return null;

  let email = row.email.trim();
  if (email && !z.string().email().safeParse(email).success) {
    email = "";
  }

  const candidate: ValidatedInvoiceRow = {
    Nom: nom,
    Mail: email,
    Échéance: echeanceIso,
    Référence: reference,
    Numéro: row.numero.trim(),
  };

  const parsed = validatedInvoiceRowSchema.safeParse(candidate);
  if (!parsed.success) return null;

  if (issuer && rowMatchesIssuer(parsed.data, issuer)) {
    return null;
  }

  return parsed.data;
}

export function parseLlmExtraction(raw: unknown): {
  data: LlmExtraction | null;
  error: string | null;
} {
  try {
    const value =
      typeof raw === "string"
        ? (JSON.parse(raw) as unknown)
        : raw;

    const parsed = llmExtractionSchema.safeParse(value);
    if (!parsed.success) {
      return {
        data: null,
        error: "Réponse IA : structure JSON invalide.",
      };
    }

    return { data: parsed.data, error: null };
  } catch {
    return {
      data: null,
      error: "Réponse IA : JSON illisible.",
    };
  }
}

export function validateRowsForImport(
  rows: LlmInvoiceRow[],
  issuer?: IssuerContext,
): {
  accepted: ValidatedInvoiceRow[];
  rejected: number;
  issuerRejected: number;
  rejectionReasons: RowRejectionReason[];
} {
  const accepted: ValidatedInvoiceRow[] = [];
  let issuerRejected = 0;
  const rejectionReasons: RowRejectionReason[] = [];

  for (const row of rows) {
    const reason = getRowRejectionReason(row, issuer);
    if (reason) {
      rejectionReasons.push(reason);
      if (reason === "issuer_match") issuerRejected += 1;
      continue;
    }

    const mapped = mapLlmRowToTablePayload(row, issuer);
    if (!mapped) continue;

    accepted.push(mapped);
  }

  return {
    accepted,
    rejected: rows.length - accepted.length,
    issuerRejected,
    rejectionReasons,
  };
}
