import type { RelanceDeliveryRow } from "@/types/database";
import type { ClientRow, ColumnDef, RelanceStep } from "@/types/tableau";

import { buildRelanceIdempotencyKey } from "./relance-deliveries";
import {
  buildRelanceScheduleForRow,
  formatRelanceCompactDate,
  formatRelanceDisplayDate,
  startOfDay,
} from "./relance-schedule";

export type RelanceDisplayStatus =
  | "scheduled"
  | "queued"
  | "sent"
  | "failed"
  | "overdue";

export type RelanceDisplayItem = {
  stepId: string;
  scheduledDate: Date;
  /** Date affichée : sent_at si envoyé, sinon date prévue. */
  displayDate: Date;
  status: RelanceDisplayStatus;
};

export type RelanceDisplayOptions = {
  /**
   * Mode démo (`?demo=1`) : ignore N8N / relance_deliveries.
   * Date passée ou atteinte → « envoyé » (vert), future → « prévu » (orange).
   */
  simulateFromDates?: boolean;
};

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function findDeliveryForStep(
  deliveries: RelanceDeliveryRow[],
  ligneId: string,
  stepId: string,
  scheduledFor: string,
): RelanceDeliveryRow | undefined {
  const key = buildRelanceIdempotencyKey(ligneId, stepId, scheduledFor);
  return deliveries.find((delivery) => delivery.idempotency_key === key);
}

export function filterDeliveriesForLigne(
  deliveries: RelanceDeliveryRow[],
  ligneId: string,
): RelanceDeliveryRow[] {
  return deliveries.filter((delivery) => delivery.ligne_id === ligneId);
}

export function filterDeliveriesForTableau(
  deliveries: RelanceDeliveryRow[],
  tableauId: string,
): RelanceDeliveryRow[] {
  return deliveries.filter((delivery) => delivery.tableau_id === tableauId);
}

export function buildRelanceDisplayForRow(
  row: ClientRow,
  columns: ColumnDef[],
  relanceSteps: RelanceStep[],
  deliveries: RelanceDeliveryRow[] = [],
  referenceDate: Date = new Date(),
  options?: RelanceDisplayOptions,
): Map<string, RelanceDisplayItem> {
  const schedule = buildRelanceScheduleForRow(
    row,
    columns,
    relanceSteps,
    referenceDate,
  );
  const result = new Map<string, RelanceDisplayItem>();
  const today = startOfDay(referenceDate).getTime();
  const simulateFromDates = options?.simulateFromDates === true;

  for (const step of relanceSteps) {
    const scheduled = schedule.get(step.id);
    if (!scheduled) continue;

    const scheduledDay = startOfDay(scheduled.scheduledDate).getTime();
    let status: RelanceDisplayStatus;
    let displayDate = scheduled.scheduledDate;

    if (simulateFromDates) {
      status = scheduledDay > today ? "scheduled" : "sent";
    } else {
      const scheduledFor = formatIsoDate(scheduled.scheduledDate);
      const delivery = findDeliveryForStep(
        deliveries,
        row.id,
        step.id,
        scheduledFor,
      );
      const activeDelivery =
        delivery?.status === "cancelled" ? undefined : delivery;

      if (activeDelivery?.status === "sent") {
        status = "sent";
        if (activeDelivery.sent_at) {
          displayDate = new Date(activeDelivery.sent_at);
        }
      } else if (activeDelivery?.status === "failed") {
        status = "failed";
      } else if (
        activeDelivery?.status === "queued" ||
        activeDelivery?.status === "pending"
      ) {
        status = "queued";
      } else if (scheduledDay > today) {
        status = "scheduled";
      } else {
        status = "overdue";
      }
    }

    result.set(step.id, {
      stepId: step.id,
      scheduledDate: scheduled.scheduledDate,
      displayDate,
      status,
    });
  }

  return result;
}

export function getRelanceDisplayTitle(status: RelanceDisplayStatus): string {
  switch (status) {
    case "scheduled":
      return "Prévu";
    case "queued":
      return "En file d'envoi";
    case "sent":
      return "Envoyé";
    case "failed":
      return "Échec d'envoi";
    case "overdue":
      return "Non envoyé";
    default:
      return "Relance";
  }
}

export function getRelanceDisplayCompactLabel(item: RelanceDisplayItem): string {
  const formatted = formatRelanceCompactDate(item.displayDate);

  switch (item.status) {
    case "scheduled":
      return `Prévu : ${formatted}`;
    case "queued":
      return `En file : ${formatted}`;
    case "sent":
      return `Envoyé : ${formatted}`;
    case "failed":
      return `Échec : ${formatted}`;
    case "overdue":
      return `Non envoyé : ${formatted}`;
    default:
      return formatted;
  }
}

export function getRelanceDisplayFullDate(item: RelanceDisplayItem): string {
  return formatRelanceDisplayDate(item.displayDate);
}

export type RelanceProgressStep = {
  step: RelanceStep;
  index: number;
  item: RelanceDisplayItem | null;
};

export type RelanceProgressState = {
  steps: RelanceProgressStep[];
  currentIndex: number;
};

export function buildRelanceProgressForRow(
  row: ClientRow,
  columns: ColumnDef[],
  relanceSteps: RelanceStep[],
  deliveries: RelanceDeliveryRow[] = [],
  referenceDate: Date = new Date(),
  options?: RelanceDisplayOptions,
): RelanceProgressState | null {
  if (relanceSteps.length === 0) return null;

  const displayMap = buildRelanceDisplayForRow(
    row,
    columns,
    relanceSteps,
    deliveries,
    referenceDate,
    options,
  );

  const steps = relanceSteps.map((step, index) => ({
    step,
    index,
    item: displayMap.get(step.id) ?? null,
  }));

  const firstActiveIndex = steps.findIndex(
    (entry) => entry.item && entry.item.status !== "sent",
  );
  const currentIndex =
    firstActiveIndex === -1 ? Math.max(steps.length - 1, 0) : firstActiveIndex;

  return { steps, currentIndex };
}
