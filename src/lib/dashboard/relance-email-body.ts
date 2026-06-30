export const RELANCE_EMAIL_BRAND_URL = "https://lockin-web.online";

export const RELANCE_EMAIL_DISCLAIMER =
  "Si vous avez déjà payé cette facture, veuillez ne pas prendre en compte cette relance.";

/** Pied de page et mention légale pour les e-mails de relance (format texte). */
export function finalizeRelanceEmailBody(messageBody: string): string {
  const trimmed = messageBody.trimEnd();

  return `${trimmed}

---
Propulsé par lockin-web.online
${RELANCE_EMAIL_BRAND_URL}

${RELANCE_EMAIL_DISCLAIMER}`;
}

/** Variante HTML (si le canal d'envoi passe en format HTML). */
export function finalizeRelanceEmailHtml(messageBody: string): string {
  const escaped = escapeHtml(messageBody.trimEnd()).replace(/\n/g, "<br>");

  return `${escaped}<br><br><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" /><p style="font-size:11px;color:#9ca3af;margin:0 0 8px"><a href="${RELANCE_EMAIL_BRAND_URL}" style="color:#9ca3af;text-decoration:none">Propulsé par lockin-web.online</a></p><p style="font-size:10px;color:#9ca3af;margin:0;line-height:1.4">${escapeHtml(RELANCE_EMAIL_DISCLAIMER)}</p>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
