import { NextResponse } from "next/server";

import {
  buildRelancePreview,
  buildRelancePreviewDraft,
  sendRelancePreviewTest,
} from "@/lib/dashboard/build-relance-preview";
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
      mode?: "draft";
      tableauId?: string;
      stepIndex?: number;
      messageTemplate?: string;
      days?: number;
      channel?: string;
      ligneId?: string;
      stepId?: string;
      sendTest?: boolean;
    };

    const admin = createAdminClient();
    const isDraft = body.mode === "draft";

    if (isDraft && !body.tableauId?.trim()) {
      return NextResponse.json(
        { error: "tableauId est requis pour l'aperçu." },
        { status: 400 },
      );
    }

    if (!isDraft && (!body.ligneId?.trim() || !body.stepId?.trim())) {
      return NextResponse.json(
        { error: "ligneId et stepId sont requis." },
        { status: 400 },
      );
    }

    const preview = isDraft
      ? await buildRelancePreviewDraft(admin, userId, {
          tableauId: body.tableauId?.trim() ?? "",
          stepIndex: Number.isFinite(body.stepIndex) ? Number(body.stepIndex) : 0,
          messageTemplate: body.messageTemplate ?? "",
          days: Number.isFinite(body.days) ? Number(body.days) : 0,
          channel: normalizeRelanceStepChannel(body.channel),
          ligneId: body.ligneId?.trim(),
        })
      : await buildRelancePreview(
          admin,
          userId,
          body.ligneId?.trim() ?? "",
          body.stepId?.trim() ?? "",
        );

    if (!preview) {
      return NextResponse.json(
        {
          error: isDraft
            ? "Impossible de générer l'aperçu. Ajoutez au moins une ligne au tableau."
            : "Relance introuvable pour cette ligne.",
        },
        { status: 404 },
      );
    }

    if (body.sendTest) {
      await sendRelancePreviewTest(preview);
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
