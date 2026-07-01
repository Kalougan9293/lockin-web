import type { CronRelanceItem } from "./relance-deliveries";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function recipientGroupKey(item: CronRelanceItem): string {
  return `${item.userId}:${normalizeEmail(item.to)}`;
}

function withDeliveryArrays(item: CronRelanceItem): CronRelanceItem {
  return {
    ...item,
    deliveryIds: item.deliveryIds?.length ? item.deliveryIds : [item.deliveryId],
    ligneIds: item.ligneIds?.length ? item.ligneIds : [item.ligneId],
  };
}

function buildMergedSubject(items: CronRelanceItem[]): string {
  if (items.length === 1) return items[0].subject;

  const uniqueSubjects = new Set(items.map((item) => item.subject));
  if (uniqueSubjects.size === 1) return items[0].subject;

  const clientName = items[0].clientName?.trim();
  if (clientName) {
    return `Relances — ${clientName} (${items.length} factures)`;
  }

  return `Relances concernant vos factures (${items.length})`;
}

function buildMergedBody(items: CronRelanceItem[]): string {
  if (items.length === 1) return items[0].body;

  const clientName = items[0].clientName?.trim();
  const intro = clientName
    ? `Bonjour ${clientName},\n\nNous vous contactons au sujet de ${items.length} factures :\n\n`
    : `Bonjour,\n\nNous vous contactons au sujet de ${items.length} factures :\n\n`;

  const sections = items.map((item, index) => {
    const header = `— Facture ${index + 1} —`;
    return `${header}\n${item.body.trim()}`;
  });

  return intro + sections.join("\n\n────────────\n\n");
}

function mergeEmphasisValues(items: CronRelanceItem[]): string[] {
  const values = new Set<string>();
  for (const item of items) {
    for (const value of item.emphasisValues ?? []) {
      if (value && value !== "—") values.add(value);
    }
  }
  return [...values];
}

function mergeRecipientGroup(items: CronRelanceItem[]): CronRelanceItem {
  const normalized = items.map(withDeliveryArrays);
  const primary = normalized[0];

  return {
    ...primary,
    deliveryId: primary.deliveryId,
    deliveryIds: normalized.flatMap((item) => item.deliveryIds ?? [item.deliveryId]),
    ligneId: primary.ligneId,
    ligneIds: normalized.flatMap((item) => item.ligneIds ?? [item.ligneId]),
    subject: buildMergedSubject(normalized),
    body: buildMergedBody(normalized),
    emphasisValues: mergeEmphasisValues(normalized),
    scheduledFor: normalized
      .map((item) => item.scheduledFor)
      .sort()
      .at(-1) ?? primary.scheduledFor,
  };
}

/**
 * Regroupe les relances d'un même prestataire vers le même email en un seul envoi
 * par passage du cron (évite le spam quand un client a plusieurs factures dues).
 */
export function consolidateRelanceCronItems(
  items: CronRelanceItem[],
): CronRelanceItem[] {
  if (items.length <= 1) {
    return items.map(withDeliveryArrays);
  }

  const groups = new Map<string, CronRelanceItem[]>();

  for (const item of items) {
    const key = recipientGroupKey(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  return [...groups.values()].map((group) =>
    group.length === 1 ? withDeliveryArrays(group[0]) : mergeRecipientGroup(group),
  );
}
