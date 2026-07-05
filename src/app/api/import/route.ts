import { NextResponse } from "next/server";

import {
  assertAdminApiAccess,
  getImpersonatedUserId,
  resolveDashboardUserId,
} from "@/lib/admin/impersonation";
import { fetchCreditorContexts, getCreditorContext } from "@/lib/dashboard/creditor-context";
import { processServerImportFiles } from "@/lib/import/process-server-import";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const userId = await resolveDashboardUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const impersonatedId = await getImpersonatedUserId();
    if (impersonatedId) {
      await assertAdminApiAccess();
    }

    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      return NextResponse.json(
        { error: "Import IA indisponible : ANTHROPIC_API_KEY manquante." },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const tableId = formData.get("tableId");

    if (typeof tableId !== "string" || !tableId.trim()) {
      return NextResponse.json(
        { error: "Tableau cible manquant." },
        { status: 400 },
      );
    }

    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    const admin = createAdminClient();

    const { data: owner } = await admin
      .from("tableaux")
      .select("user_id")
      .eq("id", tableId)
      .maybeSingle();

    if (!owner || owner.user_id !== userId) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const creditorContexts = await fetchCreditorContexts(admin, [userId]);
    const creditor = getCreditorContext(creditorContexts, userId);
    const issuer = {
      companyName: creditor.companyName,
      email: creditor.email,
    };

    const { reviewQueue, errors } = await processServerImportFiles(files, issuer);

    if (reviewQueue.length === 0) {
      return NextResponse.json(
        {
          error:
            errors[0] ??
            "Aucune facture exploitable. Vérifiez que le client final (débiteur) est identifiable.",
          errors,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      ok: true,
      reviewQueue,
      errors,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de l'import.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
