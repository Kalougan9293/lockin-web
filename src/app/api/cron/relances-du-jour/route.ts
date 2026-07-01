import { NextResponse } from "next/server";

import { verifyCronSecret } from "@/lib/cron/auth";
import { collectDueRelancesForCron } from "@/lib/dashboard/relance-deliveries";
import { createAdminClient } from "@/lib/supabase/admin";

/** Relances du jour pour n8n : chaque item.body est du HTML (bodyFormat: html). */
export async function GET(request: Request) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const admin = createAdminClient();
    const items = await collectDueRelancesForCron(admin);

    return NextResponse.json({ items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors du chargement des relances.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
