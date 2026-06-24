export const AMOUNT_PLACEHOLDER = "0,00 €";

export function isAmountColumnLabel(label: string) {
  const normalized = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

  return (
    normalized.includes("montant") ||
    normalized === "amount" ||
    normalized.includes("prix")
  );
}

/** Normalise toute saisie vers un nombre stocké (point décimal, sans €). */
export function parseAmountToStorage(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const withoutCurrency = trimmed.replace(/€/gi, "").replace(/\s/g, "");
  const normalized = withoutCurrency.replace(",", ".");
  const num = Number.parseFloat(normalized);

  if (Number.isNaN(num)) return trimmed.replace(/€/gi, "").trim();

  return String(num);
}

export function formatAmountForDisplay(value: string): string {
  const stored = parseAmountToStorage(value);
  if (!stored) return "";

  const num = Number.parseFloat(stored);
  if (Number.isNaN(num)) return value.trim();

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(num);
}

/** Saisie progressive : chiffres + virgule décimale, suffixe €. */
export function formatAmountInputAsYouType(value: string): string {
  const withoutSymbol = value.replace(/€/g, "").trim();
  const normalized = withoutSymbol.replace(/\s/g, "").replace(".", ",");
  const parts = normalized.split(",");
  const intPart = (parts[0] ?? "").replace(/\D/g, "");
  const decPart = (parts[1] ?? "").replace(/\D/g, "").slice(0, 2);

  if (!intPart && !decPart) return "";

  const hasDecimal =
    parts.length > 1 || value.includes(",") || value.includes(".");

  if (!hasDecimal) {
    return `${intPart} €`;
  }

  return `${intPart},${decPart} €`;
}
