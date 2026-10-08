import { NextResponse } from "next/server";

import { verifyCronSecret } from "@/lib/cron/auth";
import { processIncomingReply } from "@/lib/cron/process-incoming-reply";
import { createAdminClient } from "@/lib/supabase/admin";

type IncomingReplyBody = {
  deliveryId?: string | null;
  senderEmail?: string;
  subject?: string;
  body?: string;
};

export async function POST(request: Request) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  let body: IncomingReplyBody;

  try {
    body = (await request.json()) as IncomingReplyBody;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const deliveryId =
    typeof body.deliveryId === "string" ? body.deliveryId.trim() : "";

  if (!deliveryId) {
    return NextResponse.json(
      {
        error:
          "deliveryId manquant (aucun marqueur [LK-…] trouvé dans l'e-mail).",
      },
      { status: 422 },
    );
  }

  try {
    const admin = createAdminClient();
    const result = await processIncomingReply(admin, {
      deliveryId,
      senderEmail: String(body.senderEmail ?? ""),
      subject: String(body.subject ?? ""),
      body: String(body.body ?? ""),
    });

    return NextResponse.json({
      ok: true,
      replyId: result.replyId,
      userId: result.userId,
      tableauId: result.tableauId,
      deliveryId: result.deliveryId,
      notification: result.notification,
      ...(result.warning ? { warning: result.warning } : {}),
    });
  } catch (error) {
    const status =
      error && typeof error === "object" && "status" in error
        ? Number((error as { status: number }).status)
        : 500;
    const message =
      error instanceof Error
        ? error.message
        : "Erreur lors du traitement de la réponse.";

    if (status === 404) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
