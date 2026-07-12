import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 jours

type InvoiceDownloadPayload = {
  ids: string[];
  uid: string;
  exp: number;
  msg?: string;
};

export function getInvoiceDownloadSecret(): string | null {
  return (
    process.env.INVOICE_DOWNLOAD_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    null
  );
}

export function isInvoiceDownloadConfigured(): boolean {
  return Boolean(getInvoiceDownloadSecret());
}

function getSigningSecret(): string {
  const secret = getInvoiceDownloadSecret();

  if (!secret) {
    throw new Error(
      "INVOICE_DOWNLOAD_SECRET ou CRON_SECRET requis pour les liens PDF.",
    );
  }

  return secret;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64url")
    .replace(/=+$/, "");
}

function base64UrlDecode(value: string): string {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  return Buffer.from(padded, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getSigningSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createInvoiceDownloadToken(
  ligneIds: string[],
  userId: string,
  options?: { expiresAt?: number; messageBody?: string },
): string {
  const ids = [...new Set(ligneIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) {
    throw new Error("Au moins un identifiant de ligne est requis.");
  }

  const messageBody = options?.messageBody?.trim();
  const payload: InvoiceDownloadPayload = {
    ids,
    uid: userId.trim(),
    exp: options?.expiresAt ?? Date.now() + TOKEN_TTL_MS,
    ...(messageBody ? { msg: messageBody } : {}),
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyInvoiceDownloadToken(
  token: string,
  ligneId: string,
): InvoiceDownloadPayload | null {
  if (!getInvoiceDownloadSecret()) return null;

  const trimmed = token.trim();
  const dotIndex = trimmed.lastIndexOf(".");
  if (dotIndex <= 0) return null;

  const encodedPayload = trimmed.slice(0, dotIndex);
  const signature = trimmed.slice(dotIndex + 1);
  const expected = signPayload(encodedPayload);

  if (!safeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(
      base64UrlDecode(encodedPayload),
    ) as InvoiceDownloadPayload;

    if (!payload?.uid || !Array.isArray(payload.ids) || !payload.exp) {
      return null;
    }

    if (Date.now() > payload.exp) return null;
    if (!payload.ids.includes(ligneId.trim())) return null;

    return payload;
  } catch {
    return null;
  }
}
