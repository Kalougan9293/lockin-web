export const RELANCE_EMAIL_BRAND_URL = "https://lockin-web.online";
export const RELANCE_EMAIL_CONTACT_URL = `${RELANCE_EMAIL_BRAND_URL}/contact`;

export const RELANCE_EMAIL_DISCLAIMER =
  "Si vous avez déjà payé cette facture, veuillez ne pas prendre en compte cette relance.";

export const RELANCE_EMAIL_SERVICE_LINE =
  "LockIn — Service de gestion des impayés";

/** Pied de page : #6b7280 sur blanc ≈ 4,8:1 (WCAG AA texte normal). */
const FOOTER_TEXT_COLOR = "#6b7280";
/** Liens du pied : #4b5563 sur blanc ≈ 7:1 (WCAG AAA). */
const FOOTER_LINK_COLOR = "#4b5563";

export type RelanceEmailCreditor = {
  companyName: string;
  email: string;
};

/** Pied de page texte (export / logs). */
export function finalizeRelanceEmailBody(
  messageBody: string,
  creditor: RelanceEmailCreditor,
): string {
  const trimmed = messageBody.trimEnd();
  const companyName = creditor.companyName.trim() || "—";

  return `${trimmed}

Cordialement,
${companyName}

---
${RELANCE_EMAIL_SERVICE_LINE}
Contact : ${RELANCE_EMAIL_CONTACT_URL}

${RELANCE_EMAIL_DISCLAIMER}`;
}

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

  return `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${escapeHtml(text)}</div>`;
}

function buildEmailFooterHtml(): string {
  const linkStyle = `color:${FOOTER_LINK_COLOR};text-decoration:underline`;

  return `<p style="margin:0 0 10px;font-size:12px;line-height:1.55;color:${FOOTER_TEXT_COLOR};text-align:center">
                ${escapeHtml(RELANCE_EMAIL_SERVICE_LINE)}
              </p>
              <p style="margin:0 0 12px;font-size:12px;line-height:1.55;color:${FOOTER_TEXT_COLOR};text-align:center">
                <a href="${RELANCE_EMAIL_BRAND_URL}" style="${linkStyle}">Envoyé via LockIn</a>
                <span style="color:${FOOTER_TEXT_COLOR}"> · </span>
                <a href="${RELANCE_EMAIL_CONTACT_URL}" style="${linkStyle}">Contact</a>
              </p>
              <p style="margin:0;font-size:12px;line-height:1.55;color:${FOOTER_TEXT_COLOR};text-align:center">${escapeHtml(RELANCE_EMAIL_DISCLAIMER)}</p>`;
}

/** Template HTML complet pour l'envoi n8n (SMTP en mode HTML). */
export function buildRelanceEmailHtml(
  messageBody: string,
  creditor: RelanceEmailCreditor,
  emphasisValues: string[] = [],
): string {
  const trimmedBody = messageBody.trim();
  const messageHtml = formatMessageBodyHtml(trimmedBody);
  const companyName = escapeHtml(creditor.companyName.trim() || "—");
  const preheaderHtml = buildPreheaderHtml(
    extractDueDateForPreheader(emphasisValues, trimmedBody),
  );
  const footerHtml = buildEmailFooterHtml();

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Relance</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%">
  ${preheaderHtml}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7;padding:48px 20px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;border:1px solid #e8eaed">
          <tr>
            <td style="height:3px;background-color:#8b5cf6;font-size:0;line-height:0">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:44px 40px 20px">
              ${messageHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 36px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #eef0f2;padding-top:28px">
                    <p style="margin:0;font-size:15px;line-height:1.7;color:#4b5563">
                      Cordialement,<br />
                      <span style="color:#111827;font-weight:500">${companyName}</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 36px">
              ${footerHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function formatMessageBodyHtml(messageBody: string): string {
  const blocks = messageBody
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return `<p style="margin:0;font-size:15px;line-height:1.7;color:#374151">&nbsp;</p>`;
  }

  return blocks
    .map((block, index) => {
      const isLast = index === blocks.length - 1;
      const marginBottom = isLast ? "0" : "20px";

      if (/^—\s*.+\s*—$/.test(block)) {
        const html = escapeHtml(block);
        return `<p style="margin:28px 0 12px;font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#6b7280">${html}</p>`;
      }

      const html = escapeHtml(block).replace(/\n/g, "<br />");
      return `<p style="margin:0 0 ${marginBottom};font-size:15px;line-height:1.7;color:#374151">${html}</p>`;
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
