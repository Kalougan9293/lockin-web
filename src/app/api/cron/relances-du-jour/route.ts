import { NextResponse } from "next/server";

import { verifyCronSecret } from "@/lib/cron/auth";
import { todayDateOnlyParis } from "@/lib/dashboard/date-only";
import { collectDueRelancesForCron } from "@/lib/dashboard/relance-deliveries";
import { serializeCronRelanceItems } from "@/lib/dashboard/serialize-cron-relance-items";
import { createAdminClient } from "@/lib/supabase/admin";

/** Relances du jour pour n8n : chaque item.body est du HTML (bodyFormat: html). */
export async function GET(request: Request) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const admin = createAdminClient();
    const items = await collectDueRelancesForCron(admin, todayDateOnlyParis());
    const payload = serializeCronRelanceItems(items);

    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors du chargement des relances.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
