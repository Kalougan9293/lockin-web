import type { CronRelanceItem } from "./relance-deliveries";
import { normalizeDateOnlyInput } from "./date-only";

/**
 * Réponse JSON stable pour n8n : tableaux explicites, dates YYYY-MM-DD, pas de Date.
 */
export function serializeCronRelanceItems(items: CronRelanceItem[]): {
  items: CronRelanceItem[];
  count: number;
} {
  const serialized = items.map((item) => ({
    deliveryId: item.deliveryId,
    deliveryIds: [...(item.deliveryIds ?? [item.deliveryId])],
    ligneId: item.ligneId,
    ligneIds: [...(item.ligneIds ?? [item.ligneId])],
    stepId: item.stepId,
    tableauId: item.tableauId,
    userId: item.userId,
    to: item.to,
    clientName: item.clientName,
    subject: item.subject,
    body: item.body,
    bodyFormat: item.bodyFormat,
    emphasisValues: [...(item.emphasisValues ?? [])],
    scheduledFor:
      normalizeDateOnlyInput(item.scheduledFor) ?? item.scheduledFor.trim(),
  }));

  return {
    items: serialized,
    count: serialized.length,
  };
}
