/** Nettoie une URL destinée à un attribut HTML href (évite le Markdown [texte](url)). */
export function sanitizeHrefUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";

  const directDownloadMatch = trimmed.match(
    /(https?:\/\/[^)\s"'<>]+\/api\/invoices\/download\/[^\s"'<>[\]]+)/i,
  );
  if (directDownloadMatch?.[1]) {
    return directDownloadMatch[1].trim();
  }

  const markdownMatch = trimmed.match(/\[([^\]]*)\]\((https?:\/\/[^)]+)\)/);
  if (markdownMatch?.[2]) {
    const base = markdownMatch[2].trim().replace(/\/+$/, "");
    const pathMatch = trimmed.match(/(\/api\/invoices\/download\/[^\s"'<>[\]]+)/);
    if (pathMatch?.[1]) {
      return `${base}${pathMatch[1]}`;
    }
    return base;
  }

  const httpMatch = trimmed.match(/https?:\/\/[^\s"'<>[\]]+/i);
  if (httpMatch?.[0]) {
    return httpMatch[0].trim();
  }

  return "";
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}

export function buildSafeEmailHref(url: string): string {
  const safeUrl = sanitizeHrefUrl(url);
  if (!safeUrl) return "";
  return escapeHtmlAttribute(safeUrl);
}
