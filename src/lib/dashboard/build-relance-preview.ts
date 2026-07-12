import type { SupabaseClient } from "@supabase/supabase-js";

import {
  fetchCreditorContexts,
  getCreditorContext,
} from "@/lib/dashboard/creditor-context";
import {
  getRelanceEmphasisValues,
  resolveRelanceMessageTemplate,
} from "@/lib/dashboard/relance-deliveries";
import { buildRelanceEmailHtml } from "@/lib/dashboard/relance-email-body";
import { getRowFieldValue } from "@/lib/dashboard/recovery";
import { mapTableauToTableData } from "@/lib/dashboard/tableau-db";
import type { Database } from "@/types/database";
import type { ColumnDef, RelanceStepChannel } from "@/types/tableau";
import {
  defaultSmsTemplateForStep,
  formatRelanceStepNumber,
  formatRelanceTiming,
  normalizeRelanceStepChannel,
  relanceStepNeedsEmail,
  relanceStepNeedsSms,
  RELANCE_SMS_MAX_LENGTH,
} from "@/types/tableau";

type Supabase = SupabaseClient<Database>;

export type RelancePreviewResult = {
  subject: string;
  body: string;
  bodyFormat: "html";
  to: string;
  originalTo: string;
  smsBody: string;
  sendEmail: boolean;
  sendSms: boolean;
  stepLabel: string;
};

function getAllColumns(table: ReturnType<typeof mapTableauToTableData>): ColumnDef[] {
  return [...table.leftColumns, ...table.hiddenLeftColumns];
}

function buildRelanceSubjectForStep(
  stepIndex: number,
  days: number,
): string {
  return `${formatRelanceStepNumber(stepIndex)} — ${formatRelanceTiming(days)}`;
}

function resolveSmsBody(
  template: string,
  days: number,
  row: ReturnType<typeof mapTableauToTableData>["rows"][number],
  columns: ColumnDef[],
): string {
  const resolvedTemplate = template.trim() || defaultSmsTemplateForStep(days);
  const resolved = resolveRelanceMessageTemplate(
    resolvedTemplate,
    row,
    columns,
  ).trim();
  if (resolved.length <= RELANCE_SMS_MAX_LENGTH) return resolved;
  return resolved.slice(0, RELANCE_SMS_MAX_LENGTH);
}

export function getRelancePreviewEmail(): string {
  return (
    process.env.RELANCE_PREVIEW_EMAIL?.trim() || "mon_email@lockin-web.online"
  );
}

export async function buildRelancePreview(
  supabase: Supabase,
  userId: string,
  ligneId: string,
  stepId: string,
): Promise<RelancePreviewResult | null> {
  const { data: ligne, error: ligneError } = await supabase
    .from("lignes_factures")
    .select("id, tableau_id, values")
    .eq("id", ligneId)
    .maybeSingle();

  if (ligneError) throw ligneError;
  if (!ligne) return null;

  const { data: tableau, error: tableauError } = await supabase
    .from("tableaux")
    .select("*, relance_steps(*), lignes_factures(*)")
    .eq("id", ligne.tableau_id)
    .maybeSingle();

  if (tableauError) throw tableauError;
  if (!tableau || tableau.user_id !== userId) return null;

  const table = mapTableauToTableData(tableau);
  const columns = getAllColumns(table);
  const row = table.rows.find((entry) => entry.id === ligneId);
  if (!row) return null;

  const relanceSteps = [...table.relanceSteps].sort((a, b) => {
    const ordreA =
      tableau.relance_steps?.find((step) => step.id === a.id)?.ordre ?? 0;
    const ordreB =
      tableau.relance_steps?.find((step) => step.id === b.id)?.ordre ?? 0;
    return ordreA - ordreB;
  });

  const stepIndex = relanceSteps.findIndex((step) => step.id === stepId);
  if (stepIndex < 0) return null;

  const step = relanceSteps[stepIndex];
  const channel = normalizeRelanceStepChannel(step.channel);
  const needsEmail = relanceStepNeedsEmail(channel);
  const needsSms = relanceStepNeedsSms(channel);
  const originalTo = getRowFieldValue(row, columns, "Mail", "Email").trim();
  const previewTo = getRelancePreviewEmail();

  const creditorContexts = await fetchCreditorContexts(supabase, [userId]);
  const creditor = getCreditorContext(creditorContexts, userId);
  const emphasisValues = needsEmail
    ? getRelanceEmphasisValues(row, columns)
    : [];
  const messageBody = needsEmail
    ? resolveRelanceMessageTemplate(step.messageTemplate, row, columns)
    : "";

  return {
    subject: buildRelanceSubjectForStep(stepIndex, step.days),
    body: needsEmail
      ? buildRelanceEmailHtml(messageBody, creditor, emphasisValues, {
          downloadLinkPreviewOnly: true,
        })
      : "",
    bodyFormat: "html",
    to: needsEmail ? previewTo : "",
    originalTo,
    smsBody: needsSms
      ? resolveSmsBody(step.smsTemplate, step.days, row, columns)
      : "",
    sendEmail: needsEmail,
    sendSms: needsSms,
    stepLabel: buildRelanceSubjectForStep(stepIndex, step.days),
  };
}

async function sendPreviewEmailViaWebhook(
  preview: RelancePreviewResult,
): Promise<void> {
  const webhookUrl = process.env.N8N_PREVIEW_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    throw new Error(
      "N8N_PREVIEW_WEBHOOK_URL n'est pas configuré pour l'envoi test.",
    );
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: preview.to,
      subject: `[Aperçu LockIn] ${preview.subject}`,
      body: preview.body,
      bodyFormat: preview.bodyFormat,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      text || `Échec de l'envoi test (HTTP ${response.status}).`,
    );
  }
}

export async function sendRelancePreviewTest(
  preview: RelancePreviewResult,
): Promise<void> {
  if (!preview.sendEmail) {
    throw new Error("Cette étape n'utilise pas l'e-mail.");
  }

  await sendPreviewEmailViaWebhook(preview);
}

export type RelancePreviewDraftInput = {
  tableauId: string;
  stepIndex: number;
  messageTemplate: string;
  days: number;
  channel: RelanceStepChannel;
  ligneId?: string;
};

export async function buildRelancePreviewDraft(
  supabase: Supabase,
  userId: string,
  input: RelancePreviewDraftInput,
): Promise<RelancePreviewResult | null> {
  const { data: tableau, error: tableauError } = await supabase
    .from("tableaux")
    .select("*, relance_steps(*), lignes_factures(*)")
    .eq("id", input.tableauId.trim())
    .maybeSingle();

  if (tableauError) throw tableauError;
  if (!tableau || tableau.user_id !== userId) return null;

  const table = mapTableauToTableData(tableau);
  const columns = getAllColumns(table);
  const preferredRow = input.ligneId?.trim()
    ? table.rows.find((entry) => entry.id === input.ligneId?.trim())
    : table.rows[0];

  if (!preferredRow) return null;

  const channel = normalizeRelanceStepChannel(input.channel);
  const needsEmail = relanceStepNeedsEmail(channel);
  const needsSms = relanceStepNeedsSms(channel);
  const originalTo = getRowFieldValue(
    preferredRow,
    columns,
    "Mail",
    "Email",
  ).trim();
  const previewTo = getRelancePreviewEmail();
  const creditorContexts = await fetchCreditorContexts(supabase, [userId]);
  const creditor = getCreditorContext(creditorContexts, userId);
  const emphasisValues = needsEmail
    ? getRelanceEmphasisValues(preferredRow, columns)
    : [];
  const messageBody = needsEmail
    ? resolveRelanceMessageTemplate(
        input.messageTemplate,
        preferredRow,
        columns,
      )
    : "";

  return {
    subject: buildRelanceSubjectForStep(input.stepIndex, input.days),
    body: needsEmail
      ? buildRelanceEmailHtml(messageBody, creditor, emphasisValues, {
          downloadLinkPreviewOnly: true,
        })
      : "",
    bodyFormat: "html",
    to: needsEmail ? previewTo : "",
    originalTo,
    smsBody: needsSms
      ? resolveSmsBody(
          defaultSmsTemplateForStep(input.days),
          input.days,
          preferredRow,
          columns,
        )
      : "",
    sendEmail: needsEmail,
    sendSms: needsSms,
    stepLabel: buildRelanceSubjectForStep(input.stepIndex, input.days),
  };
}
