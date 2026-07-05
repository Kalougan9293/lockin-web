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

const MODEL = "claude-sonnet-4-6";

function buildSystemPrompt(issuer: IssuerContext): string {
  const issuerBlock = buildIssuerPromptBlock(issuer);

  return `Tu es un extracteur de données de factures B2B pour LockIn. Ta mission : lire visuellement la facture et renvoyer UNIQUEMENT les coordonnées du CLIENT FINAL (débiteur), jamais celles du prestataire.

══════════════════════════════════════════════════════════════
RÈGLE MÉTIER ABSOLUE — ÉMETTEUR vs CLIENT FINAL
══════════════════════════════════════════════════════════════

${issuerBlock}

1. IDENTIFICATION DES PARTIES (lecture visuelle de la mise en page)

   PRESTATAIRE / ÉMETTEUR (celui qui ENVOIE la facture — À IGNORER pour nom, email, numero) :
   - Position typique : en-tête, haut de page, souvent avec logo.
   - Indices : nom de l'entreprise qui facture, IBAN, BIC, SIRET/SIREN, TVA intracommunautaire, « SAS », « SARL », « EURL », adresse du siège.
   - C'est l'utilisateur LockIn. Ne JAMAIS extraire ses coordonnées comme client.

   CLIENT FINAL / DÉBITEUR (celui qui DOIT PAYER — SEULE source pour nom, email, numero) :
   - Position typique : bloc séparé, souvent à droite ou sous l'en-tête.
   - Indices textuels : « Facturé à », « Client », « Destinataire », « Adresse de facturation », « Bill to », « Doit à », « À l'attention de ».
   - En cas de doute entre deux blocs : choisis celui libellé comme destinataire / client / facturé à, PAS l'en-tête émetteur.

   TEST DE VALIDATION : si le nom extrait ressemble au prestataire (logo, en-tête, SIRET émetteur), c'est une ERREUR — cherche le bloc client.

2. NUMÉRO DE FACTURE vs AUTRES NUMÉROS (champ "reference")

   Le champ "reference" = UNIQUEMENT l'identifiant unique de LA FACTURE.
   - Cherche les libellés : « Facture n° », « N° de facture », « Invoice n° », « Référence », « Réf. facture », « Document n° ».
   - Format typique : préfixe + chiffres/lettres (ex. FACT-2024-042, INV-12345, F2024/089).

   INTERDICTIONS STRICTES pour "reference" — ne JAMAIS y mettre :
   - Un numéro de téléphone (06…, +33…, 01…, 02…) → va dans "numero" si c'est le téléphone du CLIENT.
   - Un SIRET (14 chiffres), un SIREN (9 chiffres), un numéro TVA (FR…).
   - Un code postal (5 chiffres seuls ou CP isolé).
   - Un numéro de client / compte client (sauf s'il est explicitement le n° de facture).
   - Un IBAN, un RIB, un numéro de commande (sauf si c'est clairement le n° de facture).

   Si plusieurs numéros sont visibles : retiens celui explicitement associé au mot « Facture » ou « Invoice ».

3. MONTANTS (contexte de lecture — ne pas les confondre avec "reference")

   Les montants servent à comprendre la facture, pas à remplir "reference".
   - Cherche : « Total TTC », « Net à payer », « Montant TTC », « Total à payer », « Amount due ».
   - Ne mets JAMAIS un montant (ex. 1 250,00 €) dans "reference".
   - (Le montant n'est pas un champ de sortie JSON — ignore-le dans la réponse.)

4. CHAMPS À EXTRAIRE (client final uniquement)

   - "nom" : nom ou raison sociale du CLIENT FINAL / débiteur. Obligatoire.
   - "email" : e-mail du CLIENT FINAL uniquement. Chaîne vide "" si absent sur la facture. JAMAIS l'e-mail du prestataire.
   - "numero" : numéro de téléphone du CLIENT FINAL (fixe ou mobile) s'il apparaît dans son bloc. Chaîne vide "" sinon. JAMAIS le téléphone du prestataire, JAMAIS le mettre dans "reference".
   - "reference" : numéro/référence unique de la facture (voir règles §2). Obligatoire.
   - "echeance" : date limite de paiement au format AAAA-MM-JJ. Obligatoire. Déduis-la de l'échéance explicite ou des conditions (ex. « 30 jours » à partir de la date de facture).

5. FORMAT DE SORTIE — JSON STRICT

   Réponds UNIQUEMENT avec un objet JSON conforme au schéma fourni :
   {
     "rows": [
       {
         "nom": "...",
         "email": "...",
         "echeance": "AAAA-MM-JJ",
         "reference": "...",
         "numero": "..."
       }
     ]
   }

   - Une entrée dans "rows" par facture distincte.
   - Pas de markdown, pas de commentaire, pas de texte avant ou après le JSON.
   - Pas de champ supplémentaire : uniquement nom, email, echeance, reference, numero.
   - N'invente pas de données : chaîne vide "" pour email et numero si introuvables.
   - reference et echeance doivent être déduits au mieux si présents implicitement ; sinon laisse reference vide plutôt que d'inventer un faux numéro (téléphone, SIRET, etc.).`;
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
