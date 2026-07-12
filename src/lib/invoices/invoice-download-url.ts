import { getAppOrigin } from "@/lib/env";

import {
  createInvoiceDownloadToken,
  isInvoiceDownloadConfigured,
} from "./download-token";

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
    return `${origin}/api/invoices/download/${encodeURIComponent(primaryId)}?${params.toString()}`;
  } catch {
    return "";
  }
}
