import { NextResponse } from "next/server";

import { buildRelancePreviewDraft } from "@/lib/dashboard/build-relance-preview";
import { resolveDashboardUserId } from "@/lib/admin/impersonation";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeRelanceStepChannel } from "@/types/tableau";

export async function POST(request: Request) {
  try {
    const userId = await resolveDashboardUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const body = (await request.json()) as {
      tableauId?: string;
      stepIndex?: number;
      messageTemplate?: string;
      days?: number;
      channel?: string;
      ligneId?: string;
    };

    if (!body.tableauId?.trim()) {
      return NextResponse.json(
        { error: "tableauId est requis pour l'aperçu." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const preview = await buildRelancePreviewDraft(admin, userId, {
      tableauId: body.tableauId.trim(),
      stepIndex: Number.isFinite(body.stepIndex) ? Number(body.stepIndex) : 0,
      messageTemplate: body.messageTemplate ?? "",
      days: Number.isFinite(body.days) ? Number(body.days) : 0,
      channel: normalizeRelanceStepChannel(body.channel),
      ligneId: body.ligneId?.trim(),
    });

    if (!preview) {
      return NextResponse.json(
        {
          error:
            "Impossible de générer l'aperçu. Ajoutez au moins une ligne au tableau.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(preview);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur lors de la génération de l'aperçu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
