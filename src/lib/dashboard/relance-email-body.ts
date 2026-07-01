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

/** Template HTML complet pour l'envoi n8n (SMTP en mode HTML). */
export function buildRelanceEmailHtml(
  messageBody: string,
  creditor: RelanceEmailCreditor,
  emphasisValues: string[] = [],
): string {
  const messageHtml = formatMessageBodyHtml(messageBody.trim(), emphasisValues);
  const companyName = escapeHtml(creditor.companyName.trim() || "—");
  const email = creditor.email.trim();
  const emailLine = email
    ? `<a href="mailto:${escapeHtml(email)}" style="color:#6366f1;text-decoration:none">${escapeHtml(email)}</a>`
    : "—";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Relance</title>
</head>
<body style="margin:0;padding:0;background-color:#eef0f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef0f4;padding:40px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:#ffffff;border-radius:16px;border:1px solid #e4e7ec;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.06)">
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#8b5cf6 0%,#d946ef 50%,#6366f1 100%);font-size:0;line-height:0">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:36px 32px 12px">
              ${messageHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:12px 32px 28px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #eceef2;padding-top:20px">
                    <p style="margin:0;font-size:15px;line-height:1.65;color:#374151">
                      Cordialement,<br />
                      <strong style="color:#111827;font-weight:600">${companyName}</strong><br />
                      ${emailLine}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px">
              <p style="margin:0 0 10px;font-size:11px;line-height:1.5;color:#9ca3af;text-align:center">
                <a href="${RELANCE_EMAIL_BRAND_URL}" style="color:#9ca3af;text-decoration:none">Propulsé par lockin-web.online</a>
              </p>
              <p style="margin:0;font-size:10px;line-height:1.5;color:#b0b7c3;text-align:center">${escapeHtml(RELANCE_EMAIL_DISCLAIMER)}</p>
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
    return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151">&nbsp;</p>`;
  }

  return blocks
    .map((block) => {
      if (/^—\s*.+\s*—$/.test(block)) {
        const html = escapeHtml(block);
        return `<p style="margin:24px 0 10px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#6b7280">${html}</p>`;
      }

      const html = applyEmphasis(
        escapeHtml(block).replace(/\n/g, "<br />"),
        emphasisValues,
      );
      return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151">${html}</p>`;
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
