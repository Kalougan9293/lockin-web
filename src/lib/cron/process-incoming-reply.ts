import type { SupabaseClient } from "@supabase/supabase-js";

import {
  fetchCreditorContexts,
  getCreditorContext,
} from "@/lib/dashboard/creditor-context";
import { getRowFieldValue } from "@/lib/dashboard/recovery";
import { escapeHtml } from "@/lib/cron/escape-html";
import type { Database } from "@/types/database";
import type { ClientRow, ColumnDef } from "@/types/tableau";

type Supabase = SupabaseClient<Database>;

export type IncomingReplyPayload = {
  deliveryId: string;
  senderEmail: string;
  subject: string;
  body: string;
};

export type IncomingReplyNotification = {
  to: string;
  subject: string;
  html: string;
};

export type ProcessIncomingReplyResult = {
  replyId: string;
  userId: string;
  tableauId: string;
  deliveryId: string;
  notification: IncomingReplyNotification | null;
  warning?: string;
};

function truncate(text: string, max: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1)}…`;
}

function buildNotificationHtml(input: {
  companyName: string;
  senderEmail: string;
  subject: string;
  body: string;
  clientName: string;
  invoiceRef: string;
  tableauName: string;
}): string {
  const bodyHtml = escapeHtml(input.body).replace(/\r\n|\n|\r/g, "<br />");

  const contextBits = [
    input.tableauName
      ? `Tableau : <strong>${escapeHtml(input.tableauName)}</strong>`
      : "",
    input.clientName
      ? `Client : <strong>${escapeHtml(input.clientName)}</strong>`
      : "",
    input.invoiceRef
      ? `Facture : <strong>${escapeHtml(input.invoiceRef)}</strong>`
      : "",
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111; max-width: 640px; margin: 0 auto; padding: 24px;">
  <p>Bonjour${input.companyName ? ` ${escapeHtml(input.companyName)}` : ""},</p>
  <p>Vous avez reçu une réponse à une relance LockIn.</p>
  ${contextBits.length ? `<p>${contextBits.join("<br />")}</p>` : ""}
  <p>
    <strong>Expéditeur :</strong> ${escapeHtml(input.senderEmail || "—")}<br />
    <strong>Objet :</strong> ${escapeHtml(input.subject || "—")}
  </p>
  <div style="margin-top: 16px; padding: 16px; background: #f6f6f6; border-radius: 8px;">
    ${bodyHtml || "<em>(Message vide)</em>"}
  </div>
  <p style="margin-top: 24px; color: #666; font-size: 13px;">
    Message transmis automatiquement par LockIn. Répondez directement à l'expéditeur si besoin.
  </p>
</body>
</html>`;
}

export async function processIncomingReply(
  supabase: Supabase,
  payload: IncomingReplyPayload,
): Promise<ProcessIncomingReplyResult> {
  const deliveryId = payload.deliveryId.trim();

  const { data: delivery, error: deliveryError } = await supabase
    .from("relance_deliveries")
    .select("id, tableau_id, ligne_id")
    .eq("id", deliveryId)
    .maybeSingle();

  if (deliveryError) throw deliveryError;
  if (!delivery) {
    const err = new Error("Relance introuvable pour ce deliveryId.") as Error & {
      status: number;
    };
    err.status = 404;
    throw err;
  }

  const { data: tableau, error: tableauError } = await supabase
    .from("tableaux")
    .select("id, user_id, name, left_columns, hidden_left_columns")
    .eq("id", delivery.tableau_id)
    .maybeSingle();

  if (tableauError) throw tableauError;
  if (!tableau) {
    const err = new Error("Tableau introuvable pour cette relance.") as Error & {
      status: number;
    };
    err.status = 404;
    throw err;
  }

  let clientName = "";
  let invoiceRef = "";

  if (delivery.ligne_id) {
    const { data: ligne, error: ligneError } = await supabase
      .from("lignes_factures")
      .select("id, values")
      .eq("id", delivery.ligne_id)
      .maybeSingle();

    if (ligneError) throw ligneError;

    if (ligne) {
      const columns = (tableau.left_columns ?? []) as ColumnDef[];
      const hidden = (tableau.hidden_left_columns ?? []) as ColumnDef[];
      const allColumns = [...columns, ...hidden];
      const row: ClientRow = { id: ligne.id, values: ligne.values ?? {} };
      clientName =
        getRowFieldValue(row, allColumns, "Nom", "nom", "Client") || "";
      invoiceRef =
        getRowFieldValue(
          row,
          allColumns,
          "N°Facture",
          "Référence",
          "reference",
        ) || "";
    }
  }

  const contexts = await fetchCreditorContexts(supabase, [tableau.user_id]);
  const creditor = getCreditorContext(contexts, tableau.user_id);
  const creditorEmail = creditor.email.trim();

  const senderEmail = String(payload.senderEmail ?? "").trim();
  const subject = String(payload.subject ?? "").trim();
  const body = String(payload.body ?? "").trim();

  const { data: inserted, error: insertError } = await supabase
    .from("incoming_replies")
    .insert({
      delivery_id: delivery.id,
      tableau_id: tableau.id,
      user_id: tableau.user_id,
      ligne_id: delivery.ligne_id,
      sender_email: senderEmail,
      subject,
      body,
      notified_at: creditorEmail ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (insertError) throw insertError;

  if (!creditorEmail) {
    return {
      replyId: inserted.id,
      userId: tableau.user_id,
      tableauId: tableau.id,
      deliveryId: delivery.id,
      notification: null,
      warning:
        "Créancier sans e-mail : réponse enregistrée, notification non préparée.",
    };
  }

  const notifSubjectParts = [
    "Réponse reçue à une relance",
    invoiceRef ? `facture ${invoiceRef}` : null,
    clientName ? `(${clientName})` : null,
  ].filter(Boolean);

  const notification: IncomingReplyNotification = {
    to: creditorEmail,
    subject: truncate(notifSubjectParts.join(" — "), 180),
    html: buildNotificationHtml({
      companyName: creditor.companyName,
      senderEmail,
      subject,
      body,
      clientName,
      invoiceRef,
      tableauName: tableau.name?.trim() ?? "",
    }),
  };

  return {
    replyId: inserted.id,
    userId: tableau.user_id,
    tableauId: tableau.id,
    deliveryId: delivery.id,
    notification,
  };
}
