import { formatAmountForDisplay } from "@/lib/preferences/currency-format";
import { formatDateForDisplay } from "@/lib/preferences/date-format";
import type { ClientRow, ColumnDef, RelanceStep } from "@/types/tableau";
import { formatRelanceTiming, isRowPaid } from "@/types/tableau";
import type { RelanceDeliveryRow } from "@/types/database";

import {
  buildRelanceDisplayForRow,
} from "@/lib/dashboard/relance-delivery-display";
import {
  buildRelanceScheduleForRow,
  formatRelanceDisplayDate,
  startOfDay,
} from "@/lib/dashboard/relance-schedule";

export type RecoveryInvoiceFields = {
  clientName: string;
  phone: string;
  reference: string;
  amount: string;
  amountDisplay: string;
  invoiceDate: string;
  dueDate: string;
  mail: string;
};

export type RelanceProofEntry = {
  stepName: string;
  timing: string;
  sentDate: string;
  channel: string;
  subject: string;
};

function normalizeLabel(label: string) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function findColumnByLabel(
  columns: ColumnDef[],
  ...labels: string[]
): ColumnDef | undefined {
  for (const label of labels) {
    const target = normalizeLabel(label);
    const found = columns.find((column) => {
      const normalized = normalizeLabel(column.label);
      return normalized === target || normalized.includes(target);
    });
    if (found) return found;
  }
  return undefined;
}

export function getRowFieldValue(
  row: ClientRow,
  columns: ColumnDef[],
  ...labels: string[]
): string {
  const column = findColumnByLabel(columns, ...labels);
  if (!column) return "";
  return row.values[column.id]?.trim() ?? "";
}

export function getLastRelanceStep(
  relanceSteps: RelanceStep[],
): RelanceStep | null {
  if (relanceSteps.length === 0) return null;
  return relanceSteps[relanceSteps.length - 1];
}

/** Dernière relance programmée dépassée et facture non payée. */
export function isRecoveryRequired(
  row: ClientRow,
  columns: ColumnDef[],
  relanceSteps: RelanceStep[],
  referenceDate: Date = new Date(),
): boolean {
  if (isRowPaid(row)) return false;

  const lastStep = getLastRelanceStep(relanceSteps);
  if (!lastStep) return false;

  const schedule = buildRelanceScheduleForRow(
    row,
    columns,
    relanceSteps,
    referenceDate,
  );
  const lastItem = schedule.get(lastStep.id);
  if (!lastItem) return false;

  const today = startOfDay(referenceDate).getTime();
  const lastRelanceDay = startOfDay(lastItem.scheduledDate).getTime();

  return today > lastRelanceDay;
}

export function extractRecoveryFields(
  row: ClientRow,
  columns: ColumnDef[],
): RecoveryInvoiceFields {
  const amountRaw = getRowFieldValue(row, columns, "Montant", "montant");
  const clientName =
    getRowFieldValue(row, columns, "Nom", "nom", "Client") || "Client";

  return {
    clientName,
    phone: getRowFieldValue(row, columns, "Numéro", "numero", "Téléphone", "Tel"),
    reference: getRowFieldValue(row, columns, "Référence", "reference", "Facture"),
    amount: amountRaw,
    amountDisplay: formatAmountForDisplay(amountRaw).replace(/\s*€$/, "") || "—",
    invoiceDate: getRowFieldValue(row, columns, "Date"),
    dueDate: getRowFieldValue(row, columns, "Échéance", "Echeance"),
    mail: getRowFieldValue(row, columns, "Mail", "Email"),
  };
}

export function buildCallScript(fields: RecoveryInvoiceFields): string {
  const reference = fields.reference || "—";
  const amount = fields.amountDisplay || "—";

  return `Bonjour, je vous appelle concernant la facture n°${reference} de ${amount}€. Nos relances automatiques étant restées sans réponse, je voulais m'assurer que tout allait bien de votre côté et valider la date de votre virement...`;
}

export function buildRelanceProofHistory(
  row: ClientRow,
  columns: ColumnDef[],
  relanceSteps: RelanceStep[],
  deliveries: RelanceDeliveryRow[] = [],
  referenceDate: Date = new Date(),
  simulateFromDates = false,
): RelanceProofEntry[] {
  const display = buildRelanceDisplayForRow(
    row,
    columns,
    relanceSteps,
    deliveries,
    referenceDate,
    { simulateFromDates },
  );

  return relanceSteps
    .map((step) => {
      const item = display.get(step.id);
      if (!item || item.status !== "sent") return null;

      return {
        stepName: step.name,
        timing: formatRelanceTiming(step.days),
        sentDate: formatRelanceDisplayDate(item.displayDate),
        channel: "Email automatique LockIn",
        subject: `Relance ${formatRelanceTiming(step.days)} — ${step.name}`,
      };
    })
    .filter((entry): entry is RelanceProofEntry => entry !== null);
}

export function buildMiseEnDemeureLetterBody(
  fields: RecoveryInvoiceFields,
  generatedAt: Date = new Date(),
): string {
  const today = formatDateForDisplay(
    generatedAt.toISOString().slice(0, 10),
    "fr",
  );
  const clientName = fields.clientName || "Madame, Monsieur";
  const reference = fields.reference || "—";
  const amount = fields.amountDisplay || "—";
  const dueDate = fields.dueDate || "—";

  return [
    today,
    "",
    "Lettre recommandée avec accusé de réception",
    "",
    clientName,
    fields.mail || "",
    "",
    `Objet : Mise en demeure de payer — Facture n° ${reference}`,
    "",
    "Madame, Monsieur,",
    "",
    `Sauf erreur ou omission de notre part, nous constatons à ce jour que la facture n° ${reference}, d'un montant de ${amount} €, échue le ${dueDate}, demeure impayée malgré nos relances amiables restées sans effet.`,
    "",
    "Par la présente, nous vous mettons en demeure de procéder au règlement intégral de cette somme dans un délai de huit (8) jours à compter de la réception de la présente lettre.",
    "",
    "À défaut de paiement dans ce délai, nous nous réservons le droit d'engager toute procédure de recouvrement appropriée, y compris une demande d'injonction de payer, sans autre avis, avec application des pénalités de retard et indemnité forfaitaire pour frais de recouvrement prévues par la loi.",
    "",
    "Nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.",
    "",
    "_______________________________",
    "Signature",
  ]
    .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""))
    .join("\n");
}

export function formatProofDossierText(
  fields: RecoveryInvoiceFields,
  history: RelanceProofEntry[],
  generatedAt: Date = new Date(),
): string {
  const header = [
    "DOSSIER DE PREUVES — LOCKIN",
    "==============================",
    "",
    `Généré le : ${formatDateForDisplay(generatedAt.toISOString().slice(0, 10), "fr")}`,
    `Débiteur : ${fields.clientName}`,
    `Facture n° : ${fields.reference || "—"}`,
    `Montant : ${fields.amountDisplay || "—"} €`,
    `Date facture : ${fields.invoiceDate || "—"}`,
    `Échéance : ${fields.dueDate || "—"}`,
    "",
    "HISTORIQUE DES RELANCES AUTOMATIQUES",
    "------------------------------------",
  ];

  if (history.length === 0) {
    header.push("Aucune relance automatique enregistrée comme envoyée à ce jour.");
  } else {
    history.forEach((entry, index) => {
      header.push(
        `${index + 1}. ${entry.sentDate} — ${entry.stepName} (${entry.timing})`,
        `   Canal : ${entry.channel}`,
        `   Objet : ${entry.subject}`,
        "",
      );
    });
  }

  header.push(
    "",
    "Ce document peut être joint à une demande d'injonction de payer",
    "auprès du Tribunal de Commerce.",
  );

  return header.join("\n");
}
