import Anthropic from "@anthropic-ai/sdk";

import {
  INVOICE_EXTRACTION_JSON_SCHEMA,
  parseLlmExtraction,
  type LlmExtraction,
} from "./invoice-schema";
import {
  buildIssuerPromptBlock,
  type IssuerContext,
} from "./issuer-context";

const MODEL = "claude-3-5-sonnet-20241022";

function buildSystemPrompt(issuer: IssuerContext): string {
  const issuerBlock = buildIssuerPromptBlock(issuer);

  return `Tu es un extracteur de données de factures B2B pour LockIn.

RÈGLE MÉTIER ABSOLUE — ÉMETTEUR vs CLIENT FINAL :
- L'ÉMETTEUR / PRESTATAIRE est l'utilisateur LockIn qui a édité la facture (en-tête, logo, coordonnées de l'entreprise qui facture).
- Le CLIENT FINAL / DÉBITEUR est le destinataire qui doit payer (bloc « Facturé à », « Client », « Destinataire », « Bill to »).

${issuerBlock}

CONSIGNES D'EXTRACTION (client final uniquement pour nom, email, numero) :
- "nom" : nom ou société du CLIENT FINAL / débiteur. JAMAIS l'émetteur LockIn.
- "email" : e-mail du CLIENT FINAL uniquement. JAMAIS l'e-mail de l'émetteur. Chaîne vide si absent sur la facture.
- "numero" : téléphone du CLIENT FINAL s'il est présent. Chaîne vide sinon. JAMAIS le téléphone de l'émetteur.
- "reference" : référence ou numéro unique de la facture (obligatoire).
- "echeance" : date limite de paiement en AAAA-MM-JJ (obligatoire). Déduis-la de l'échéance explicite ou des conditions (ex. « 30 jours » à partir de la date de facture).

Autres règles :
- Une ligne par facture distincte.
- N'invente pas de données : chaîne vide pour les champs introuvables (sauf reference et echeance qui doivent être déduits si possible).
- En cas de doute entre deux blocs d'adresse, choisis celui libellé comme destinataire / client / facturé à, pas l'en-tête émetteur.`;
}

function buildUserPrompt(fileName: string, kind: "pdf" | "csv"): string {
  if (kind === "pdf") {
    return `Extrais les données du CLIENT FINAL (débiteur) de cette facture PDF (${fileName}). N'extrais jamais les coordonnées de l'émetteur LockIn.`;
  }

  return `Extrais une ligne par facture depuis ce CSV (${fileName}). Pour chaque ligne, identifie le CLIENT FINAL / débiteur (pas l'émetteur LockIn).`;
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Clé API Anthropic non configurée (ANTHROPIC_API_KEY).");
  }
  return new Anthropic({ apiKey });
}

function extractJsonFromMessage(message: Anthropic.Messages.Message): string | null {
  for (const block of message.content) {
    if (block.type === "text" && block.text.trim()) {
      return block.text.trim();
    }
  }
  return null;
}

async function callAnthropic(
  userContent: Anthropic.Messages.MessageParam["content"],
  issuer: IssuerContext,
): Promise<LlmExtraction> {
  const client = getClient();
  const system = buildSystemPrompt(issuer);

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: userContent }],
      // Structured Outputs (GA) — non typé dans toutes les versions du SDK
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      output_config: {
        format: {
          type: "json_schema",
          schema: INVOICE_EXTRACTION_JSON_SCHEMA,
        },
      },
    } as any);

    const jsonText = extractJsonFromMessage(response);
    if (!jsonText) {
      throw new Error("Réponse IA vide.");
    }

    const { data, error } = parseLlmExtraction(jsonText);
    if (!data) {
      throw new Error(error ?? "Réponse IA invalide.");
    }

    return data;
  } catch (structuredError) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: `${system}\nRéponds uniquement avec un objet JSON valide, sans markdown.`,
      messages: [{ role: "user", content: userContent }],
    });

    const jsonText = extractJsonFromMessage(response);
    if (!jsonText) {
      const message =
        structuredError instanceof Error
          ? structuredError.message
          : "Réponse IA vide.";
      throw new Error(message);
    }

    const cleaned = jsonText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const { data, error } = parseLlmExtraction(cleaned);
    if (!data) {
      throw new Error(error ?? "Réponse IA invalide.");
    }

    return data;
  }
}

export async function extractInvoiceFromPdf(
  buffer: Buffer,
  fileName: string,
  issuer: IssuerContext,
): Promise<LlmExtraction> {
  const base64 = buffer.toString("base64");

  return callAnthropic(
    [
      {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: base64,
        },
      },
      {
        type: "text",
        text: buildUserPrompt(fileName, "pdf"),
      },
    ],
    issuer,
  );
}

export async function extractInvoiceFromCsvText(
  csvText: string,
  fileName: string,
  issuer: IssuerContext,
): Promise<LlmExtraction> {
  const trimmed = csvText.trim();
  if (!trimmed) {
    throw new Error("Fichier CSV vide.");
  }

  return callAnthropic(
    [
      {
        type: "text",
        text: `${buildUserPrompt(fileName, "csv")}\n\n---\n${trimmed}\n---`,
      },
    ],
    issuer,
  );
}
