import { NextResponse } from "next/server";

import { shouldSendRelanceForLigne } from "@/lib/cron/check-relance-send-status";
import { verifyCronSecret } from "@/lib/cron/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  const ligneId = new URL(request.url).searchParams.get("id")?.trim();
  if (!ligneId) {
    return NextResponse.json(
      { error: "Paramètre id manquant (ID de la ligne / facture)." },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();
    const shouldSend = await shouldSendRelanceForLigne(admin, ligneId);

    return NextResponse.json({ shouldSend });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur lors de la vérification du statut.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
