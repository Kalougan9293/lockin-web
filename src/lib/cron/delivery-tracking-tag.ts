/** Marqueur dans l'objet / corps des e-mails pour corréler les réponses IMAP. */
export const DELIVERY_TRACKING_TAG_REGEX = /\[LK-([a-zA-Z0-9_-]+)\]/;

export function buildDeliveryTrackingTag(deliveryId: string): string {
  return `[LK-${deliveryId.trim()}]`;
}

/** Ajoute `[LK-{deliveryId}]` si aucun marqueur LK n'est déjà présent. */
export function withDeliveryTrackingTag(
  subject: string,
  deliveryId: string,
): string {
  const id = deliveryId.trim();
  if (!id) return subject.trim();

  const trimmed = subject.trim();
  if (DELIVERY_TRACKING_TAG_REGEX.test(trimmed)) return trimmed;

  return `${trimmed} ${buildDeliveryTrackingTag(id)}`.trim();
}

export function extractDeliveryIdFromText(
  ...parts: Array<string | null | undefined>
): string | null {
  for (const part of parts) {
    if (!part) continue;
    const match = part.match(DELIVERY_TRACKING_TAG_REGEX);
    if (match?.[1]) return match[1];
  }
  return null;
}
