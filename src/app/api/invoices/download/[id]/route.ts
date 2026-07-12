import { NextResponse } from "next/server";

import { verifyInvoiceDownloadToken } from "@/lib/invoices/download-token";
import { generateInvoicePdfForLignes } from "@/lib/invoices/load-invoice-pdf-context";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function buildPdfFilename(ligneIds: string[]): string {
  if (ligneIds.length === 1) {
    return `relance-facture-${ligneIds[0].slice(0, 8)}.pdf`;
  }
  return `relance-recap-${ligneIds.length}-factures.pdf`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: ligneId } = await params;
    const token = new URL(request.url).searchParams.get("token")?.trim();

    if (!ligneId || !token) {
      return NextResponse.json(
        { error: "Lien de téléchargement invalide." },
        { status: 400 },
      );
    }

    const payload = verifyInvoiceDownloadToken(token, ligneId);
    if (!payload) {
      return NextResponse.json(
        { error: "Lien expiré ou non autorisé." },
        { status: 403 },
      );
    }

    const admin = createAdminClient();
    const pdfBuffer = await generateInvoicePdfForLignes(
      admin,
      payload.uid,
      payload.ids,
      payload.msg ?? "",
    );

    if (!pdfBuffer) {
      return NextResponse.json(
        { error: "Document introuvable." },
        { status: 404 },
      );
    }

    const filename = buildPdfFilename(payload.ids);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur lors de la génération du PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
