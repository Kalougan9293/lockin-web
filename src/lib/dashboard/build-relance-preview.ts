import type { SupabaseClient } from "@supabase/supabase-js";

import {
  fetchCreditorContexts,
  getCreditorContext,
} from "@/lib/dashboard/creditor-context";
import {
  getRelanceEmphasisValues,
  getRowPaymentLink,
  resolveRelanceMessageTemplate,
} from "@/lib/dashboard/relance-deliveries";
import { buildRelanceEmailHtml } from "@/lib/dashboard/relance-email-body";
import { getRowFieldValue } from "@/lib/dashboard/recovery";
import { mapTableauToTableData } from "@/lib/dashboard/tableau-db";
import type { Database } from "@/types/database";
import type { ColumnDef, RelanceStepChannel } from "@/types/tableau";
import {
  formatRelanceStepNumber,
  formatRelanceTiming,
  normalizeRelanceStepChannel,
  relanceStepNeedsEmail,
} from "@/types/tableau";

type Supabase = SupabaseClient<Database>;

export type RelancePreviewResult = {
  subject: string;
  body: string;
  sendEmail: boolean;
};

export type RelancePreviewDraftInput = {
  tableauId: string;
  stepIndex: number;
  messageTemplate: string;
  days: number;
  channel: RelanceStepChannel;
  ligneId?: string;
};

function getAllColumns(table: ReturnType<typeof mapTableauToTableData>): ColumnDef[] {
  return [...table.leftColumns, ...table.hiddenLeftColumns];
}

function buildRelanceSubjectForStep(stepIndex: number, days: number): string {
  return `${formatRelanceStepNumber(stepIndex)} — ${formatRelanceTiming(days)}`;
}

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
  const paymentUrls = needsEmail
    ? [getRowPaymentLink(preferredRow, columns)].filter(Boolean)
    : [];

  return {
    subject: buildRelanceSubjectForStep(input.stepIndex, input.days),
    body: needsEmail
      ? buildRelanceEmailHtml(messageBody, creditor, emphasisValues, {
          downloadLinkPreviewOnly: true,
          paymentUrls,
          paymentLinkPreviewOnly: true,
        })
      : "",
    sendEmail: needsEmail,
  };
}
