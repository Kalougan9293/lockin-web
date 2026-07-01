import { z } from "zod";

import { validateDueDateForRelance } from "@/lib/dashboard/relance-schedule";

import {
  rowMatchesIssuer,
  type IssuerContext,
} from "./issuer-context";

/** Schéma brut renvoyé par Claude (Structured Outputs). */
export const llmInvoiceRowSchema = z.object({
  nom: z.string(),
  email: z.string(),
  echeance: z.string(),
  reference: z.string(),
  numero: z.string(),
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
        },
        required: ["nom", "email", "echeance", "reference", "numero"],
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
} {
  const accepted: ValidatedInvoiceRow[] = [];
  let issuerRejected = 0;

  for (const row of rows) {
    const withoutIssuerCheck = mapLlmRowToTablePayload(row);
    if (!withoutIssuerCheck) continue;

    if (issuer && rowMatchesIssuer(withoutIssuerCheck, issuer)) {
      issuerRejected += 1;
      continue;
    }

    accepted.push(withoutIssuerCheck);
  }

  return {
    accepted,
    rejected: rows.length - accepted.length,
    issuerRejected,
  };
}
