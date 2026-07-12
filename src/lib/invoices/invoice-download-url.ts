import { getAppOrigin } from "@/lib/env";

import {
  createInvoiceDownloadToken,
  isInvoiceDownloadConfigured,
} from "./download-token";
import { sanitizeHrefUrl } from "./sanitize-href-url";

export function buildInvoiceDownloadUrl(
  ligneIds: string[],
  userId: string,
  messageBody?: string,
): string {
  const primaryId = ligneIds[0]?.trim();
  if (!primaryId || !isInvoiceDownloadConfigured()) return "";

  try {
    const origin = getAppOrigin();
    const token = createInvoiceDownloadToken(ligneIds, userId, { messageBody });
    const params = new URLSearchParams({ token });
    const rawUrl = `${origin}/api/invoices/download/${encodeURIComponent(primaryId)}?${params.toString()}`;
    return sanitizeHrefUrl(rawUrl) || rawUrl;
  } catch {
    return "";
  }
}
