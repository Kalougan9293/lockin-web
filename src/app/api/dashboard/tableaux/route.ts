import { NextResponse } from "next/server";

import {
  assertAdminApiAccess,
  getImpersonatedUserId,
  resolveDashboardUserId,
} from "@/lib/admin/impersonation";
import {
  applyTableDiff,
  fetchAllTablesForUser,
  insertFullTable,
} from "@/lib/dashboard/tableau-db";
import { fetchRelanceDeliveriesForTableaux } from "@/lib/dashboard/fetch-relance-deliveries";
import { cancelQueuedDeliveriesForPaidLigne } from "@/lib/dashboard/cancel-queued-deliveries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TableData } from "@/types/tableau";

export async function GET() {
  try {
    const userId = await resolveDashboardUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const impersonatedId = await getImpersonatedUserId();
    if (impersonatedId) {
      await assertAdminApiAccess();
    }

    const admin = createAdminClient();
    const tables = await fetchAllTablesForUser(admin, userId);
    const tableauIds = tables.map((table) => table.id);
    const deliveries = await fetchRelanceDeliveriesForTableaux(admin, tableauIds);

    return NextResponse.json({
      tables,
      deliveries,
      impersonating: Boolean(impersonatedId),
      userId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur de chargement.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    const body = (await request.json()) as { table?: TableData };
    if (!body.table) {
      return NextResponse.json({ error: "Tableau manquant." }, { status: 400 });
    }

    const admin = createAdminClient();
    await insertFullTable(admin, userId, body.table);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur de création.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await resolveDashboardUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const impersonatedId = await getImpersonatedUserId();
    if (impersonatedId) {
      await assertAdminApiAccess();
    }

    const body = (await request.json()) as {
      prev?: TableData;
      next?: TableData;
      action?: "deleteTable";
      tableId?: string;
    };

    const admin = createAdminClient();

    if (body.action === "deleteTable" && body.tableId) {
      const { data: tableau } = await admin
        .from("tableaux")
        .select("id")
        .eq("id", body.tableId)
        .eq("user_id", userId)
        .maybeSingle();

      if (!tableau) {
        return NextResponse.json({ error: "Tableau introuvable." }, { status: 404 });
      }

      await admin.from("tableaux").delete().eq("id", body.tableId);
      return NextResponse.json({ ok: true });
    }

    if (!body.prev || !body.next) {
      return NextResponse.json({ error: "Données invalides." }, { status: 400 });
    }

    const { data: owner } = await admin
      .from("tableaux")
      .select("user_id")
      .eq("id", body.next.id)
      .maybeSingle();

    if (!owner || owner.user_id !== userId) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    await applyTableDiff(admin, body.prev, body.next);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur de mise à jour.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await resolveDashboardUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const impersonatedId = await getImpersonatedUserId();
    if (impersonatedId) {
      await assertAdminApiAccess();
    }

    const body = (await request.json()) as { row?: TableData["rows"][number] };
    if (!body.row) {
      return NextResponse.json({ error: "Ligne manquante." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: ligne } = await admin
      .from("lignes_factures")
      .select("id, tableau_id, values")
      .eq("id", body.row.id)
      .maybeSingle();

    if (!ligne) {
      return NextResponse.json({ error: "Ligne introuvable." }, { status: 404 });
    }

    const { data: tableau } = await admin
      .from("tableaux")
      .select("user_id")
      .eq("id", ligne.tableau_id)
      .maybeSingle();

    if (!tableau || tableau.user_id !== userId) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const wasPaid = ligne.values?.statut === "paye";

    await admin
      .from("lignes_factures")
      .update({ values: body.row.values })
      .eq("id", body.row.id);

    const isPaid = body.row.values.statut === "paye";
    if (isPaid && !wasPaid) {
      await cancelQueuedDeliveriesForPaidLigne(admin, body.row.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur de mise à jour.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
