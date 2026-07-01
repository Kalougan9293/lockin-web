/** Profil de l'utilisateur LockIn = émetteur / prestataire de la facture. */
export type IssuerContext = {
  companyName: string;
  email: string;
};

export function normalizeCompareValue(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9@.+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Rejette une ligne si elle ressemble aux coordonnées de l'émetteur (utilisateur LockIn). */
export function rowMatchesIssuer(
  row: { Nom: string; Mail: string; Numéro: string },
  issuer: IssuerContext,
): boolean {
  const issuerName = normalizeCompareValue(issuer.companyName);
  const rowName = normalizeCompareValue(row.Nom);

  if (issuerName.length >= 3) {
    if (rowName === issuerName) return true;
    if (rowName.includes(issuerName) || issuerName.includes(rowName)) {
      return true;
    }
  }

  const issuerEmail = issuer.email.trim().toLowerCase();
  const rowEmail = row.Mail.trim().toLowerCase();
  if (issuerEmail && rowEmail && rowEmail === issuerEmail) {
    return true;
  }

  return false;
}

export function buildIssuerPromptBlock(issuer: IssuerContext): string {
  const lines = [
    "ÉMETTEUR DE LA FACTURE (prestataire LockIn — NE PAS extraire pour nom/email/téléphone) :",
  ];

  if (issuer.companyName.trim()) {
    lines.push(`- Société émettrice : ${issuer.companyName.trim()}`);
  }
  if (issuer.email.trim()) {
    lines.push(`- E-mail émetteur : ${issuer.email.trim()}`);
  }

  lines.push(
    "Ces coordonnées appartiennent à l'utilisateur LockIn qui a édité la facture.",
    "Tu dois les IGNORER pour nom, email et numero.",
  );

  return lines.join("\n");
}
