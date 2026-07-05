import Anthropic from "@anthropic-ai/sdk";

import {
  INVOICE_EXTRACTION_JSON_SCHEMA,
  parseLlmExtraction,
  type LlmExtraction,
} from "./invoice-schema";
import {
  buildInvoiceExtractionSystemPrompt,
  buildInvoiceExtractionUserPrompt,
} from "./invoice-extraction-prompt";
import type { IssuerContext } from "./issuer-context";

const MODEL = "claude-sonnet-4-6";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Clé API Anthropic non configurée (ANTHROPIC_API_KEY).");
  }
  return new Anthropic({ apiKey });
}

function formatAnthropicError(error: unknown): string {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: number }).status;
    if (status === 401) {
      return "clé API Anthropic invalide — vérifiez ANTHROPIC_API_KEY dans lockin-web/.env.local (local) ou les variables Vercel (prod).";
    }
  }

  return error instanceof Error ? error.message : "Erreur d'extraction IA.";
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
  const system = buildInvoiceExtractionSystemPrompt(issuer);

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
    if (
      structuredError &&
      typeof structuredError === "object" &&
      "status" in structuredError &&
      (structuredError as { status?: number }).status === 401
    ) {
      throw new Error(formatAnthropicError(structuredError));
    }

    try {
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
    } catch (fallbackError) {
      throw new Error(formatAnthropicError(fallbackError));
    }
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
        text: buildInvoiceExtractionUserPrompt(fileName, "pdf"),
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
        text: `${buildInvoiceExtractionUserPrompt(fileName, "csv")}\n\n---\n${trimmed}\n---`,
      },
    ],
    issuer,
  );
}
