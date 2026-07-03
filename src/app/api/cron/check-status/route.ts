import { NextResponse } from "next/server";

import {
  shouldSendRelanceForLigne,
  shouldSendRelanceForLignes,
} from "@/lib/cron/check-relance-send-status";
import { verifyCronSecret } from "@/lib/cron/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function resolveLigneIds(request: Request): string[] {
  const url = new URL(request.url);
  const fromList = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (fromList.length > 0) {
    return [...new Set(fromList)];
  }

  const single = url.searchParams.get("id")?.trim();
  return single ? [single] : [];
}

export async function GET(request: Request) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  const ligneIds = resolveLigneIds(request);
  if (ligneIds.length === 0) {
    return NextResponse.json(
      { error: "Paramètre id ou ids manquant (ID de la ou des lignes facture)." },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();
    const shouldSend =
      ligneIds.length === 1
        ? await shouldSendRelanceForLigne(admin, ligneIds[0])
        : await shouldSendRelanceForLignes(admin, ligneIds);

    return NextResponse.json({ shouldSend, ligneIds });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur lors de la vérification du statut.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
