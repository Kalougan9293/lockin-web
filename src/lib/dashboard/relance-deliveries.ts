import type { SupabaseClient } from "@supabase/supabase-js";

import { formatAmountForDisplay } from "@/lib/preferences/currency-format";
import {
  formatDateForDisplay,
  parseDateInputToIso,
} from "@/lib/preferences/date-format";
import type { Database, RelanceDeliveryRow } from "@/types/database";
import type { ClientRow, ColumnDef, RelanceStep, RelanceStepChannel, TableData } from "@/types/tableau";
import {
  defaultSmsTemplateForStep,
  formatRelanceStepNumber,
  formatRelanceTiming,
  isRowPaid,
  normalizeRelanceStepChannel,
  relanceStepNeedsEmail,
  relanceStepNeedsSms,
  RELANCE_SMS_MAX_LENGTH,
} from "@/types/tableau";

import { getRowFieldValue } from "./recovery";
import {
  formatDateOnlyIso,
  isDateOnOrBefore,
  normalizeDateOnlyInput,
  startOfDay,
  todayDateOnly,
} from "./date-only";
import { buildRelanceScheduleForRow } from "./relance-schedule";
import { consolidateRelanceCronItems, type CronRelanceDraftItem } from "./consolidate-relance-cron-items";
import {
  fetchCreditorContexts,
  getCreditorContext,
} from "./creditor-context";
import { buildRelanceEmailHtml } from "./relance-email-body";
import { mapTableauToTableData } from "./tableau-db";

type Supabase = SupabaseClient<Database>;

export type CronRelanceItem = {
  deliveryId: string;
  /** Toutes les deliveries concernées (fusion anti-spam). */
  deliveryIds?: string[];
  ligneId: string;
  ligneIds?: string[];
  stepId: string;
  tableauId: string;
  userId: string;
  /** Canal configuré sur l'étape de relance. */
  channel: RelanceStepChannel;
  /** Destinataire e-mail (vide si SMS seul). */
  to: string;
  /** Téléphone du débiteur, format libre (vide si e-mail seul). */
  phone: string;
  clientName?: string;
  subject: string;
  /** Corps HTML prêt pour n8n (emailFormat: html). */
  body: string;
  bodyFormat: "html";
  /** Corps SMS brut (max 160 caractères). */
  smsBody: string;
  sendEmail: boolean;
  sendSms: boolean;
  /** E-mail du créancier en copie (si cc_creditor activé sur le tableau). */
  cc?: string;
  /** Montants et échéances formatés à mettre en gras dans le HTML. */
  emphasisValues?: string[];
  scheduledFor: string;
};

function normalizeLabel(label: string) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function formatIsoDate(date: Date): string {
  return formatDateOnlyIso(date);
}

export function buildRelanceIdempotencyKey(
  ligneId: string,
  stepId: string,
  scheduledFor: string,
): string {
  const normalized =
    normalizeDateOnlyInput(scheduledFor) ?? scheduledFor.trim();
  return `${ligneId}:${stepId}:${normalized}`;
}

function formatFieldForTemplate(label: string, raw: string): string {
  if (!raw.trim()) return "—";

  const normalized = normalizeLabel(label);
  if (normalized.includes("montant")) {
    return formatAmountForDisplay(raw);
  }

  if (normalized.includes("date") || normalized.includes("echeance")) {
    const iso = parseDateInputToIso(raw, "fr");
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      return formatDateForDisplay(iso, "fr");
    }
  }

  return raw.trim();
}

export function resolveRelanceMessageTemplate(
  template: string,
  row: ClientRow,
  columns: ColumnDef[],
): string {
  const replacements = new Map<string, string>();

  for (const column of columns) {
    const raw = row.values[column.id]?.trim() ?? "";
    replacements.set(column.label, formatFieldForTemplate(column.label, raw));
  }

  const standardFields: Array<[string, string[]]> = [
    ["Nom", ["Nom", "nom", "Client"]],
    ["Montant", ["Montant", "montant"]],
    ["Échéance", ["Échéance", "Echeance"]],
    ["Date", ["Date", "date"]],
    ["Mail", ["Mail", "Email"]],
    ["Référence", ["Référence", "reference", "Facture"]],
  ];

  for (const [label, aliases] of standardFields) {
    if (replacements.has(label)) continue;
    const raw = getRowFieldValue(row, columns, ...aliases);
    replacements.set(label, formatFieldForTemplate(label, raw));
  }

  let resolved = template;
  for (const [label, value] of replacements) {
    resolved = resolved.replaceAll(`[${label}]`, value);
    if (label === "Échéance") {
      resolved = resolved.replaceAll("[Echeance]", value);
    }
  }

  return resolved;
}

/** Valeurs Montant / Échéance formatées pour mise en évidence dans l'e-mail HTML. */
export function getRelanceEmphasisValues(
  row: ClientRow,
  columns: ColumnDef[],
): string[] {
  const values: string[] = [];

  const montant = formatFieldForTemplate(
    "Montant",
    getRowFieldValue(row, columns, "Montant", "montant"),
  );
  if (montant !== "—") values.push(montant);

  const echeance = formatFieldForTemplate(
    "Échéance",
    getRowFieldValue(row, columns, "Échéance", "Echeance"),
  );
  if (echeance !== "—") values.push(echeance);

  return values;
}

function buildRelanceSubject(step: RelanceStep, stepIndex: number): string {
  return `${formatRelanceStepNumber(stepIndex)} — ${formatRelanceTiming(step.days)}`;
}

function getAllColumns(table: TableData): ColumnDef[] {
  return [...table.leftColumns, ...table.hiddenLeftColumns];
}

function isDueOnOrBeforeToday(scheduledDate: Date, referenceDate: Date): boolean {
  return isDateOnOrBefore(scheduledDate, referenceDate);
}

function getRowPhone(row: ClientRow, columns: ColumnDef[]): string {
  return getRowFieldValue(
    row,
    columns,
    "Numéro",
    "numero",
    "Téléphone",
    "Tel",
    "Phone",
  );
}

function rowMeetsChannelRequirements(
  channel: RelanceStepChannel,
  email: string,
  phone: string,
): boolean {
  if (relanceStepNeedsEmail(channel) && !email.trim()) return false;
  if (relanceStepNeedsSms(channel) && !phone.trim()) return false;
  return true;
}

function resolveSmsBody(
  step: RelanceStep,
  row: ClientRow,
  columns: ColumnDef[],
): string {
  const template =
    step.smsTemplate.trim() || defaultSmsTemplateForStep(step.days);
  const resolved = resolveRelanceMessageTemplate(template, row, columns).trim();
  if (resolved.length <= RELANCE_SMS_MAX_LENGTH) return resolved;
  return resolved.slice(0, RELANCE_SMS_MAX_LENGTH);
}

async function queueDelivery(
  supabase: Supabase,
  payload: {
    ligneId: string;
    stepId: string;
    tableauId: string;
    scheduledFor: string;
  },
): Promise<RelanceDeliveryRow | null> {
  const scheduledFor =
    normalizeDateOnlyInput(payload.scheduledFor) ?? payload.scheduledFor.trim();
  const idempotencyKey = buildRelanceIdempotencyKey(
    payload.ligneId,
    payload.stepId,
    scheduledFor,
  );

  const { error: insertError } = await supabase.from("relance_deliveries").insert({
    ligne_id: payload.ligneId,
    step_id: payload.stepId,
    tableau_id: payload.tableauId,
    scheduled_for: scheduledFor,
    status: "queued",
    idempotency_key: idempotencyKey,
  });

  if (insertError && insertError.code !== "23505") {
    throw insertError;
  }

  const { data: existing, error: selectError } = await supabase
    .from("relance_deliveries")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (selectError) throw selectError;
  if (!existing) return null;

  if (existing.status === "sent") {
    return existing;
  }

  if (existing.status === "failed" || existing.status === "pending" || existing.status === "cancelled") {
    const { data: updated, error: updateError } = await supabase
      .from("relance_deliveries")
      .update({ status: "queued" })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (updateError) throw updateError;
    return updated;
  }

  return existing;
}

export async function collectDueRelancesForCron(
  supabase: Supabase,
  referenceDate: Date = todayDateOnly(),
): Promise<CronRelanceItem[]> {
  const today = startOfDay(referenceDate);
  const { data, error } = await supabase
    .from("tableaux")
    .select("*, relance_steps(*), lignes_factures(*)")
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!data?.length) return [];

  const items: CronRelanceDraftItem[] = [];

  for (const rawTableau of data) {
    const table = mapTableauToTableData(rawTableau);
    const userId = rawTableau.user_id;
    const columns = getAllColumns(table);
    const relanceSteps = [...table.relanceSteps].sort((a, b) => {
      const ordreA =
        rawTableau.relance_steps?.find((step) => step.id === a.id)?.ordre ?? 0;
      const ordreB =
        rawTableau.relance_steps?.find((step) => step.id === b.id)?.ordre ?? 0;
      return ordreA - ordreB;
    });

    for (const row of table.rows) {
      if (isRowPaid(row)) continue;

      const email = getRowFieldValue(row, columns, "Mail", "Email");
      const phone = getRowPhone(row, columns);
      const clientName = getRowFieldValue(row, columns, "Nom", "nom", "Client");

      const schedule = buildRelanceScheduleForRow(
        row,
        columns,
        relanceSteps,
      );

      for (let stepIndex = 0; stepIndex < relanceSteps.length; stepIndex += 1) {
        const step = relanceSteps[stepIndex];
        const channel = normalizeRelanceStepChannel(step.channel);
        const scheduled = schedule.get(step.id);
        if (!scheduled) continue;
        if (!isDueOnOrBeforeToday(scheduled.scheduledDate, today)) continue;
        if (!rowMeetsChannelRequirements(channel, email, phone)) continue;

        const scheduledFor = formatIsoDate(scheduled.scheduledDate);
        const delivery = await queueDelivery(supabase, {
          ligneId: row.id,
          stepId: step.id,
          tableauId: table.id,
          scheduledFor,
        });

        if (!delivery || delivery.status === "sent") continue;

        const needsEmail = relanceStepNeedsEmail(channel);
        const needsSms = relanceStepNeedsSms(channel);

        items.push({
          deliveryId: delivery.id,
          deliveryIds: [delivery.id],
          ligneId: row.id,
          ligneIds: [row.id],
          stepId: step.id,
          tableauId: table.id,
          userId,
          channel,
          to: needsEmail ? email.trim() : "",
          phone: needsSms ? phone.trim() : "",
          clientName: clientName || undefined,
          subject: buildRelanceSubject(step, stepIndex),
          messageBody: needsEmail
            ? resolveRelanceMessageTemplate(step.messageTemplate, row, columns)
            : "",
          smsMessageBody: needsSms ? resolveSmsBody(step, row, columns) : "",
          sendEmail: needsEmail,
          sendSms: needsSms,
          ccCreditor: table.ccCreditor,
          emphasisValues: needsEmail
            ? getRelanceEmphasisValues(row, columns)
            : [],
          scheduledFor,
        });
      }
    }
  }

  const creditorContexts = await fetchCreditorContexts(
    supabase,
    items.map((item) => item.userId),
  );

  return consolidateRelanceCronItems(items).map((item) => {
    const creditor = getCreditorContext(creditorContexts, item.userId);
    const { messageBody, smsMessageBody, sendEmail, sendSms, ccCreditor, ...rest } =
      item;

    const creditorEmail = creditor.email.trim();
    const cc =
      ccCreditor && sendEmail && creditorEmail ? creditorEmail : undefined;

    return {
      ...rest,
      ...(cc ? { cc } : {}),
      body: sendEmail
        ? buildRelanceEmailHtml(
            messageBody,
            creditor,
            item.emphasisValues ?? [],
          )
        : "",
      bodyFormat: "html" as const,
      smsBody: sendSms ? smsMessageBody : "",
      sendEmail,
      sendSms,
    };
  });
}
