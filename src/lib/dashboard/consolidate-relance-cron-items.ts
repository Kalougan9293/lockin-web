import type { CronRelanceItem } from "./relance-deliveries";

export type CronRelanceDraftItem = Omit<
  CronRelanceItem,
  "body" | "bodyFormat" | "smsBody" | "cc"
> & {
  messageBody: string;
  smsMessageBody: string;
  ccCreditor?: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function recipientGroupKey(item: CronRelanceDraftItem): string {
  const email = normalizeEmail(item.to);
  const phone = normalizePhone(item.phone);
  return `${item.userId}:${item.channel}:${email}:${phone}`;
}

function withDeliveryArrays(item: CronRelanceDraftItem): CronRelanceDraftItem {
  return {
    ...item,
    deliveryIds: item.deliveryIds?.length ? item.deliveryIds : [item.deliveryId],
    ligneIds: item.ligneIds?.length ? item.ligneIds : [item.ligneId],
  };
}

function buildMergedSubject(items: CronRelanceDraftItem[]): string {
  if (items.length === 1) return items[0].subject;

  const uniqueSubjects = new Set(items.map((item) => item.subject));
  if (uniqueSubjects.size === 1) return items[0].subject;

  const clientName = items[0].clientName?.trim();
  if (clientName) {
    return `Relances — ${clientName} (${items.length} factures)`;
  }

  return `Relances concernant vos factures (${items.length})`;
}

function buildMergedBody(items: CronRelanceDraftItem[]): string {
  if (items.length === 1) return items[0].messageBody;

  const clientName = items[0].clientName?.trim();
  const intro = clientName
    ? `Bonjour ${clientName},\n\nNous vous contactons au sujet de ${items.length} factures :\n\n`
    : `Bonjour,\n\nNous vous contactons au sujet de ${items.length} factures :\n\n`;

  const sections = items.map((item, index) => {
    const header = `— Facture ${index + 1} —`;
    return `${header}\n${item.messageBody.trim()}`;
  });

  return intro + sections.join("\n\n────────────\n\n");
}

function buildMergedSmsBody(items: CronRelanceDraftItem[]): string {
  if (items.length === 1) return items[0].smsMessageBody;

  const clientName = items[0].clientName?.trim();
  const intro = clientName
    ? `Bonjour ${clientName}, ${items.length} factures : `
    : `${items.length} factures : `;

  const snippets = items.map((item) => item.smsMessageBody.trim()).filter(Boolean);
  const merged = intro + snippets.join(" | ");
  return merged.length <= 160 ? merged : merged.slice(0, 160);
}

function mergeEmphasisValues(items: CronRelanceDraftItem[]): string[] {
  const values = new Set<string>();
  for (const item of items) {
    for (const value of item.emphasisValues ?? []) {
      if (value && value !== "—") values.add(value);
    }
  }
  return [...values];
}

function mergeRecipientGroup(items: CronRelanceDraftItem[]): CronRelanceDraftItem {
  const normalized = items.map(withDeliveryArrays);
  const primary = normalized[0];
  const sendEmail = normalized.some((item) => item.sendEmail);
  const sendSms = normalized.some((item) => item.sendSms);

  return {
    ...primary,
    deliveryId: primary.deliveryId,
    deliveryIds: normalized.flatMap((item) => item.deliveryIds ?? [item.deliveryId]),
    ligneId: primary.ligneId,
    ligneIds: normalized.flatMap((item) => item.ligneIds ?? [item.ligneId]),
    subject: buildMergedSubject(normalized),
    messageBody: sendEmail ? buildMergedBody(normalized) : "",
    smsMessageBody: sendSms ? buildMergedSmsBody(normalized) : "",
    sendEmail,
    sendSms,
    ccCreditor: normalized.some((item) => item.ccCreditor),
    emphasisValues: mergeEmphasisValues(normalized),
    scheduledFor: normalized
      .map((item) => item.scheduledFor)
      .sort()
      .at(-1) ?? primary.scheduledFor,
  };
}

/**
 * Regroupe les relances d'un même prestataire vers le même destinataire
 * (e-mail et/ou téléphone) en un seul envoi par passage du cron.
 */
export function consolidateRelanceCronItems(
  items: CronRelanceDraftItem[],
): CronRelanceDraftItem[] {
  if (items.length <= 1) {
    return items.map(withDeliveryArrays);
  }

  const groups = new Map<string, CronRelanceDraftItem[]>();

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
