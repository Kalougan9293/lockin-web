import { NextResponse } from "next/server";

import { MVP_DEMO_PROFILE } from "@/lib/mvp-demo";
import { processServerImportFiles } from "@/lib/import/process-server-import";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Import IA éphémère pour le mode démo (?demo=1).
 * Extrait les lignes via Claude sans persistance Supabase.
 */
export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      return NextResponse.json(
        { error: "Import IA indisponible : ANTHROPIC_API_KEY manquante." },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier fourni." },
        { status: 400 },
      );
    }

    const issuer = {
      companyName: MVP_DEMO_PROFILE.nomSociete,
      email: MVP_DEMO_PROFILE.email,
    };

    const { rows, errors: extractionErrors } = await processServerImportFiles(
      files,
      issuer,
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error:
            extractionErrors[0] ??
            "Aucune ligne valide extraite. Vérifiez que le client final (débiteur) est identifiable.",
          errors: extractionErrors,
          importedCount: 0,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      ok: true,
      rows,
      importedCount: rows.length,
      errors: extractionErrors,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de l'import.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
