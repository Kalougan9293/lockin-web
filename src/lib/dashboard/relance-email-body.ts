import { buildSafeEmailHref, sanitizeHrefUrl } from "@/lib/invoices/sanitize-href-url";
import { PAYMENT_LINK_TEMPLATE_PLACEHOLDERS } from "@/types/tableau";

export const RELANCE_EMAIL_BRAND_URL = "https://lockin-web.online";
export const RELANCE_EMAIL_CONTACT_URL = `${RELANCE_EMAIL_BRAND_URL}/contact`;

export const RELANCE_EMAIL_DISCLAIMER =
  "Si vous avez déjà payé cette facture, veuillez ne pas prendre en compte cette relance.";

export const RELANCE_EMAIL_SERVICE_LINE =
  "LockIn — Service de gestion des impayés";

/** Fond extérieur de l'e-mail (body, désinscription). */
const EMAIL_OUTER_BG = "#f4f5f7";
/** Fond de la carte principale (blanc). */
const EMAIL_CARD_BG = "#ffffff";
/** Corps et texte principal : #1a1a1a sur blanc — contraste maximal (SpamAssassin + WCAG). */
const BODY_TEXT_COLOR = "#1a1a1a";
/** Signature et texte secondaire. */
const SIGNATURE_TEXT_COLOR = "#1a1a1a";
/** Pied de page et mentions secondaires. */
const FOOTER_TEXT_COLOR = "#222222";
/** Liens : bleu foncé lisible sur fond clair. */
const LINK_COLOR = "#0b57d0";
/** Séparateurs de section (ex. « — Facture 1 — »). */
const SECTION_HEADER_COLOR = "#1a1a1a";
/** Nom du créancier en signature. */
const SIGNATURE_NAME_COLOR = "#000000";

/** Styles inline explicites : SpamAssassin exige color + background-color sur chaque texte. */
function inlineTextStyle(
  color: string,
  backgroundColor: string,
  extra = "",
): string {
  const base = `color:${color};background-color:${backgroundColor}`;
  return extra ? `${base};${extra}` : base;
}

export type RelanceEmailCreditor = {
  companyName: string;
  email: string;
};

function extractDueDateForPreheader(
  emphasisValues: string[],
  messageBody: string,
): string | null {
  for (const value of emphasisValues) {
    const trimmed = value.trim();
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) return trimmed;
  }

  const match = messageBody.match(/(?:échéance|échue|éch\.?)\s*(?:du|le)?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  if (match?.[1]) return match[1];

  const generic = messageBody.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/);
  return generic?.[1] ?? null;
}

function buildPreheaderHtml(dueDate: string | null): string {
  const text = dueDate
    ? `Rappel de facture – échéance du ${dueDate}.`
    : "Rappel de facture.";

  return `<div style="display:none;font-size:1px;${inlineTextStyle(EMAIL_OUTER_BG, EMAIL_OUTER_BG)};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${escapeHtml(text)}</div>`;
}

function buildEmailFooterHtml(): string {
  const linkStyle = inlineTextStyle(
    LINK_COLOR,
    EMAIL_CARD_BG,
    "text-decoration:underline",
  );

  return `<p style="margin:0 0 10px;font-size:12px;line-height:1.55;${inlineTextStyle(FOOTER_TEXT_COLOR, EMAIL_CARD_BG)};text-align:center">
                ${escapeHtml(RELANCE_EMAIL_SERVICE_LINE)}
              </p>
              <p style="margin:0 0 12px;font-size:12px;line-height:1.55;${inlineTextStyle(FOOTER_TEXT_COLOR, EMAIL_CARD_BG)};text-align:center">
                <a href="${RELANCE_EMAIL_BRAND_URL}" style="${linkStyle}">Envoyé via LockIn</a>
                <span style="${inlineTextStyle(FOOTER_TEXT_COLOR, EMAIL_CARD_BG)}"> · </span>
                <a href="${RELANCE_EMAIL_CONTACT_URL}" style="${linkStyle}">Contact</a>
              </p>
              <p style="margin:0;font-size:12px;line-height:1.55;${inlineTextStyle(FOOTER_TEXT_COLOR, EMAIL_CARD_BG)};text-align:center">${escapeHtml(RELANCE_EMAIL_DISCLAIMER)}</p>`;
}

function buildUnsubscribeHtml(): string {
  const linkStyle = inlineTextStyle(
    LINK_COLOR,
    EMAIL_OUTER_BG,
    "text-decoration:underline",
  );

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${EMAIL_OUTER_BG};padding:0 20px 32px">
    <tr>
      <td align="center" style="background-color:${EMAIL_OUTER_BG}">
        <p style="margin:0;max-width:560px;font-size:12px;line-height:1.55;${inlineTextStyle(FOOTER_TEXT_COLOR, EMAIL_OUTER_BG)};text-align:center">
          Pour ne plus recevoir ces e-mails,
          <a href="mailto:contact@lockin-web.online?subject=Désinscription" style="${linkStyle}">cliquez ici pour vous désinscrire</a>.
        </p>
      </td>
    </tr>
  </table>`;
}

function buildPaymentLinkHtml(
  paymentUrl: string,
  previewOnly = false,
): string {
  const linkStyle = inlineTextStyle(
    LINK_COLOR,
    EMAIL_CARD_BG,
    "text-decoration:underline;font-weight:500",
  );

  if (previewOnly) {
    return `<span style="${linkStyle};cursor:default">Payer ici</span>`;
  }

  const safeHref = buildSafeEmailHref(paymentUrl);
  if (!safeHref) return escapeHtml(paymentUrl.trim());

  return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">Payer ici</a>`;
}

function linkifyPaymentPlaceholdersInHtml(
  html: string,
  paymentUrl: string | undefined,
  previewOnly: boolean,
): string {
  const trimmedUrl = paymentUrl?.trim();
  const linkHtml = trimmedUrl
    ? buildPaymentLinkHtml(trimmedUrl, previewOnly)
    : previewOnly
      ? buildPaymentLinkHtml("#", true)
      : escapeHtml("—");

  let result = html;
  for (const placeholder of PAYMENT_LINK_TEMPLATE_PLACEHOLDERS) {
    result = result.replaceAll(placeholder, linkHtml);
  }

  return result;
}

function linkifyPaymentUrlInHtml(
  html: string,
  paymentUrl: string,
  previewOnly = false,
): string {
  const trimmed = paymentUrl.trim();
  if (!trimmed) return html;

  const linkHtml = buildPaymentLinkHtml(trimmed, previewOnly);
  const candidates = new Set<string>([escapeHtml(trimmed)]);

  const sanitized = sanitizeHrefUrl(trimmed);
  if (sanitized && sanitized !== trimmed) {
    candidates.add(escapeHtml(sanitized));
  }

  let result = html;
  for (const candidate of candidates) {
    if (candidate) {
      result = result.replaceAll(candidate, linkHtml);
    }
  }

  return result;
}

function buildDownloadLinkHtml(
  downloadUrl: string,
  previewOnly = false,
): string {
  const linkStyle = inlineTextStyle(
    LINK_COLOR,
    EMAIL_CARD_BG,
    "text-decoration:underline;font-weight:500",
  );

  if (previewOnly) {
    return `<p style="margin:24px 0 0;font-size:14px;line-height:1.6;${inlineTextStyle(BODY_TEXT_COLOR, EMAIL_CARD_BG)}">
                <span style="${linkStyle};cursor:default">Télécharger ici le PDF</span>
              </p>`;
  }

  const safeHref = buildSafeEmailHref(downloadUrl);
  if (!safeHref) return "";

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0">
    <tr>
      <td style="background-color:${EMAIL_CARD_BG}">
        <a href="${safeHref}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">Télécharger ici le PDF</a>
      </td>
    </tr>
  </table>`;
}

/** Template HTML complet pour l'envoi n8n (SMTP en mode HTML). */
export function buildRelanceEmailHtml(
  messageBody: string,
  creditor: RelanceEmailCreditor,
  emphasisValues: string[] = [],
  options?: {
    downloadUrl?: string;
    downloadLinkPreviewOnly?: boolean;
    paymentUrls?: string[];
    paymentLinkPreviewOnly?: boolean;
  },
): string {
  const trimmedBody = messageBody.trim();
  const messageHtml = formatMessageBodyHtml(trimmedBody, {
    paymentUrls: options?.paymentUrls,
    paymentLinkPreviewOnly: options?.paymentLinkPreviewOnly,
  });
  const companyName = escapeHtml(creditor.companyName.trim() || "—");
  const preheaderHtml = buildPreheaderHtml(
    extractDueDateForPreheader(emphasisValues, trimmedBody),
  );
  const footerHtml = buildEmailFooterHtml();
  const downloadHtml = options?.downloadUrl
    ? buildDownloadLinkHtml(
        options.downloadUrl,
        options.downloadLinkPreviewOnly,
      )
    : options?.downloadLinkPreviewOnly
      ? buildDownloadLinkHtml("#", true)
      : "";

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Relance</title>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_OUTER_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%">
  ${preheaderHtml}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${EMAIL_OUTER_BG};padding:48px 20px">
    <tr>
      <td align="center" style="background-color:${EMAIL_OUTER_BG}">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:${EMAIL_CARD_BG};border-radius:12px;border:1px solid #e8eaed">
          <tr>
            <td style="height:3px;background-color:#8b5cf6;font-size:0;line-height:0">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:44px 40px 20px;background-color:${EMAIL_CARD_BG}">
              ${messageHtml}
              ${downloadHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 36px;background-color:${EMAIL_CARD_BG}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #eef0f2;padding-top:28px;background-color:${EMAIL_CARD_BG}">
                    <p style="margin:0;font-size:15px;line-height:1.7;${inlineTextStyle(SIGNATURE_TEXT_COLOR, EMAIL_CARD_BG)}">
                      Cordialement,<br />
                      <span style="${inlineTextStyle(SIGNATURE_NAME_COLOR, EMAIL_CARD_BG, "font-weight:500")}">${companyName}</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 36px;background-color:${EMAIL_CARD_BG}">
              ${footerHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  ${buildUnsubscribeHtml()}
</body>
</html>`;
}

function formatMessageBodyHtml(
  messageBody: string,
  options?: { paymentUrls?: string[]; paymentLinkPreviewOnly?: boolean },
): string {
  const blocks = messageBody
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return `<p style="margin:0;font-size:15px;line-height:1.7;${inlineTextStyle(BODY_TEXT_COLOR, EMAIL_CARD_BG)}">&nbsp;</p>`;
  }

  const paymentUrls = (options?.paymentUrls ?? [])
    .map((url) => url.trim())
    .filter(Boolean);
  const paymentLinkPreviewOnly = options?.paymentLinkPreviewOnly ?? false;

  return blocks
    .map((block, index) => {
      const isLast = index === blocks.length - 1;
      const marginBottom = isLast ? "0" : "20px";

      if (/^—\s*.+\s*—$/.test(block)) {
        const html = escapeHtml(block);
        return `<p style="margin:28px 0 12px;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;${inlineTextStyle(SECTION_HEADER_COLOR, EMAIL_CARD_BG)}">${html}</p>`;
      }

      let html = escapeHtml(block).replace(/\n/g, "<br />");
      html = linkifyPaymentPlaceholdersInHtml(
        html,
        paymentUrls[0],
        paymentLinkPreviewOnly,
      );
      for (const paymentUrl of paymentUrls) {
        html = linkifyPaymentUrlInHtml(html, paymentUrl, paymentLinkPreviewOnly);
      }

      return `<p style="margin:0 0 ${marginBottom};font-size:15px;line-height:1.7;${inlineTextStyle(BODY_TEXT_COLOR, EMAIL_CARD_BG)}">${html}</p>`;
    })
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
