export const RELANCE_EMAIL_BRAND_URL = "https://lockin-web.online";

export const RELANCE_EMAIL_DISCLAIMER =
  "Si vous avez déjà payé cette facture, veuillez ne pas prendre en compte cette relance.";

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
  const email = creditor.email.trim() || "—";

  return `${trimmed}

Cordialement,
${companyName}
${email}

---
Propulsé par lockin-web.online
${RELANCE_EMAIL_BRAND_URL}

${RELANCE_EMAIL_DISCLAIMER}`;
}

/** Template HTML complet pour l'envoi n8n. */
export function buildRelanceEmailHtml(
  messageBody: string,
  creditor: RelanceEmailCreditor,
  emphasisValues: string[] = [],
): string {
  const messageHtml = formatMessageBodyHtml(messageBody.trim(), emphasisValues);
  const companyName = escapeHtml(creditor.companyName.trim() || "—");
  const email = creditor.email.trim();
  const emailLine = email
    ? `<a href="mailto:${escapeHtml(email)}" style="color:#4f46e5;text-decoration:none">${escapeHtml(email)}</a>`
    : "—";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Relance</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
          <tr>
            <td style="padding:32px 28px 8px">
              ${messageHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#1f2937">
                Cordialement,<br />
                <strong style="color:#111827">${companyName}</strong><br />
                ${emailLine}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px">
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px" />
              <p style="margin:0 0 8px;font-size:11px;color:#9ca3af">
                <a href="${RELANCE_EMAIL_BRAND_URL}" style="color:#9ca3af;text-decoration:none">Propulsé par lockin-web.online</a>
              </p>
              <p style="margin:0;font-size:10px;color:#9ca3af;line-height:1.45">${escapeHtml(RELANCE_EMAIL_DISCLAIMER)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function formatMessageBodyHtml(
  messageBody: string,
  emphasisValues: string[] = [],
): string {
  const blocks = messageBody
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1f2937">&nbsp;</p>`;
  }

  return blocks
    .map((block) => {
      const html = applyEmphasis(
        escapeHtml(block).replace(/\n/g, "<br />"),
        emphasisValues,
      );
      return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1f2937">${html}</p>`;
    })
    .join("");
}

function applyEmphasis(html: string, emphasisValues: string[]): string {
  const sorted = [...emphasisValues]
    .filter((value) => value.trim() && value !== "—")
    .sort((a, b) => b.length - a.length);

  let result = html;
  for (const value of sorted) {
    const escaped = escapeHtml(value);
    if (!escaped || !result.includes(escaped)) continue;
    const strong = `<strong style="color:#111827;font-weight:700">${escaped}</strong>`;
    result = result.split(escaped).join(strong);
  }
  return result;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
