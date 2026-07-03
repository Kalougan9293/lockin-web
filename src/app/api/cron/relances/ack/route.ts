import { NextResponse } from "next/server";

import { verifyCronSecret } from "@/lib/cron/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RelanceDeliveryStatus } from "@/types/database";

type AckPayload = {
  deliveryId?: string;
  deliveryIds?: string[];
  status?: RelanceDeliveryStatus;
  provider?: string;
  providerMessageId?: string;
  provider_message_id?: string;
  errorMessage?: string;
  error_message?: string;
  sentAt?: string;
  sent_at?: string;
};

function isAckStatus(value: unknown): value is "sent" | "failed" | "cancelled" {
  return value === "sent" || value === "failed" || value === "cancelled";
}

function resolveDeliveryIds(body: AckPayload): string[] {
  const fromArray = (body.deliveryIds ?? [])
    .map((id) => id?.trim())
    .filter((id): id is string => Boolean(id));

  if (fromArray.length > 0) {
    return [...new Set(fromArray)];
  }

  const single = body.deliveryId?.trim();
  return single ? [single] : [];
}

export async function POST(request: Request) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  let body: AckPayload;

  try {
    body = (await request.json()) as AckPayload;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const deliveryIds = resolveDeliveryIds(body);
  const status = body.status;

  if (deliveryIds.length === 0) {
    return NextResponse.json(
      { error: "deliveryId ou deliveryIds manquant." },
      { status: 400 },
    );
  }

  if (!isAckStatus(status)) {
    return NextResponse.json(
      { error: "status invalide (attendu : sent, failed ou cancelled)." },
      { status: 400 },
    );
  }

  const providerMessageId =
    body.providerMessageId?.trim() || body.provider_message_id?.trim() || null;
  const errorMessage =
    body.errorMessage?.trim() || body.error_message?.trim() || null;

  if (status === "sent" && !providerMessageId) {
    return NextResponse.json(
      { error: "providerMessageId requis lorsque status = sent." },
      { status: 400 },
    );
  }

  if (status === "failed" && !errorMessage) {
    return NextResponse.json(
      { error: "errorMessage requis lorsque status = failed." },
      { status: 400 },
    );
  }

  const cancelledMessage =
    status === "cancelled"
      ? errorMessage ?? "Annulé avant envoi (facture payée ou relance retirée)."
      : null;

  const sentAtRaw = body.sentAt?.trim() || body.sent_at?.trim();
  const sentAt =
    status === "sent"
      ? sentAtRaw
        ? new Date(sentAtRaw).toISOString()
        : new Date().toISOString()
      : null;

  if (status === "sent" && sentAtRaw && Number.isNaN(new Date(sentAtRaw).getTime())) {
    return NextResponse.json({ error: "sentAt invalide." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    const { data: existing, error: fetchError } = await admin
      .from("relance_deliveries")
      .select("id")
      .in("id", deliveryIds);

    if (fetchError) throw fetchError;

    if (!existing?.length) {
      return NextResponse.json({ error: "Relance introuvable." }, { status: 404 });
    }

    const foundIds = new Set(existing.map((row) => row.id));
    const missingIds = deliveryIds.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: `Relance(s) introuvable(s) : ${missingIds.join(", ")}` },
        { status: 404 },
      );
    }

    const { error: updateError } = await admin
      .from("relance_deliveries")
      .update({
        status,
        sent_at: sentAt,
        provider: status === "sent" ? body.provider?.trim() || null : null,
        provider_message_id: status === "sent" ? providerMessageId : null,
        error_message:
          status === "failed"
            ? errorMessage
            : status === "cancelled"
              ? cancelledMessage
              : null,
      })
      .in("id", deliveryIds);

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, updated: deliveryIds.length });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de la mise à jour.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
