export type ColumnDef = {
  id: string;
  label: string;
};

export type ClientRow = {
  id: string;
  values: Record<string, string>;
};

export const MAX_RELANCES = 7;

export type RelanceStep = {
  id: string;
  name: string;
  days: number;
  messageTemplate: string;
};

export type RightColumnAccent = "green" | "yellow" | "orange" | "red" | "neutral";

export type RelanceStepStyle = {
  emoji: string;
  ring: string;
  bg: string;
  badge: string;
  accent: RightColumnAccent;
};

export const RELANCE_STEP_STYLES: RelanceStepStyle[] = [
  {
    emoji: "😊",
    ring: "ring-emerald-400/40",
    bg: "from-emerald-500/25 via-emerald-500/10 to-transparent",
    badge: "bg-emerald-400/20 text-emerald-100",
    accent: "green",
  },
  {
    emoji: "🙃",
    ring: "ring-sky-400/40",
    bg: "from-sky-500/25 via-sky-500/10 to-transparent",
    badge: "bg-sky-400/20 text-sky-100",
    accent: "yellow",
  },
  {
    emoji: "😤",
    ring: "ring-violet-400/40",
    bg: "from-violet-500/25 via-violet-500/10 to-transparent",
    badge: "bg-violet-400/20 text-violet-100",
    accent: "orange",
  },
  {
    emoji: "📮",
    ring: "ring-rose-400/40",
    bg: "from-rose-500/25 via-rose-500/10 to-transparent",
    badge: "bg-rose-400/20 text-rose-100",
    accent: "red",
  },
  {
    emoji: "⚡",
    ring: "ring-amber-400/40",
    bg: "from-amber-500/25 via-amber-500/10 to-transparent",
    badge: "bg-amber-400/20 text-amber-100",
    accent: "orange",
  },
  {
    emoji: "🔔",
    ring: "ring-indigo-400/40",
    bg: "from-indigo-500/25 via-indigo-500/10 to-transparent",
    badge: "bg-indigo-400/20 text-indigo-100",
    accent: "yellow",
  },
  {
    emoji: "📌",
    ring: "ring-fuchsia-400/40",
    bg: "from-fuchsia-500/25 via-fuchsia-500/10 to-transparent",
    badge: "bg-fuchsia-400/20 text-fuchsia-100",
    accent: "red",
  },
];

export const STANDARD_TEMPLATE_LABELS = [
  "Nom",
  "Mail",
  "Date",
  "Montant",
  "Échéance",
  "Numéro",
  "Info",
  "Référence",
] as const;

export const DEFAULT_RELANCE_STEPS: RelanceStep[] = [
  {
    id: "rappel-j7",
    name: "Relance amicale",
    days: -7,
    messageTemplate:
      "Bonjour [Nom],\n\nVotre facture arrive bientôt à échéance le [Échéance]. Nous vous adressons ce message afin d'anticiper son règlement.\n\nMerci beaucoup.",
  },
  {
    id: "relance-j2",
    name: "Relance douce",
    days: 2,
    messageTemplate:
      "Bonjour [Nom],\n\nNous vous rappelons que votre facture d'un montant de [Montant] est arrivée à échéance le [Échéance].\n\nNous vous remercions de bien vouloir procéder à son règlement dans les meilleurs délais.",
  },
  {
    id: "relance-j10",
    name: "Relance ferme",
    days: 10,
    messageTemplate:
      "Bonjour [Nom],\n\nÀ ce jour, nous n'avons pas reçu le règlement de la facture arrivée à échéance le [Échéance].\n\nMerci de nous indiquer une date de paiement ou de procéder à sa régularisation dans les meilleurs délais.",
  },
  {
    id: "relance-j30",
    name: "Mise en demeure",
    days: 30,
    messageTemplate:
      "Bonjour [Nom],\n\nSauf erreur de notre part, la facture échue le [Échéance] demeure impayée malgré nos précédentes relances.\n\nNous vous remercions de procéder à sa régularisation sous 8 jours. À défaut de règlement, nous nous réservons le droit d'engager les démarches nécessaires au recouvrement de cette créance.",
  },
];

export type TableSummary = {
  id: string;
  name: string;
};

export type TableData = {
  id: string;
  name: string;
  leftColumns: ColumnDef[];
  /** Colonnes masquées via × — les données des lignes sont conservées. */
  hiddenLeftColumns: ColumnDef[];
  rows: ClientRow[];
  relanceSteps: RelanceStep[];
};

export const DEFAULT_LEFT_COLUMNS: ColumnDef[] = [
  { id: "nom", label: "Nom" },
  { id: "mail", label: "Mail" },
  { id: "montant", label: "Montant" },
  { id: "echeance", label: "Échéance" },
];

export const DEFAULT_MODAL_FIELDS = ["Nom", "Mail", "Montant", "Échéance"] as const;

export const OPTIONAL_CLIENT_BUBBLES = [
  "Date",
  "Numéro",
  "Info",
  "Échéance",
  "Référence",
] as const;

/** Ordre d'affichage des champs dans les modales d'ajout client / import. */
export const MODAL_FIELD_POOL = [
  ...DEFAULT_MODAL_FIELDS,
  ...OPTIONAL_CLIENT_BUBBLES,
].filter(
  (label, index, labels) =>
    labels.findIndex(
      (entry) => entry.toLowerCase() === label.toLowerCase(),
    ) === index,
);

export function resolveActiveFieldsFromImport(
  fields: Record<string, string>,
): string[] {
  const active = MODAL_FIELD_POOL.filter((label) => fields[label]?.trim());
  const customs = Object.keys(fields).filter(
    (key) =>
      fields[key]?.trim() &&
      !MODAL_FIELD_POOL.some(
        (label) => label.toLowerCase() === key.toLowerCase(),
      ),
  );
  return [...active, ...customs];
}

/** @deprecated Utiliser DEFAULT_MODAL_FIELDS + OPTIONAL_CLIENT_BUBBLES */
export const ADD_CLIENT_BUBBLES = [...OPTIONAL_CLIENT_BUBBLES, "Autres"] as const;

/** @deprecated Préférer getAddableColumnLabels() — liste dynamique selon colonnes visibles/masquées. */
export const LEFT_COLUMN_PRESETS = [
  "Date",
  "Numéro",
  "Info",
  "Montant",
  "Référence",
];

function isColumnLabelPresent(columns: ColumnDef[], label: string) {
  return columns.some((column) => labelsMatch(column.label, label));
}

/**
 * Libellés proposés dans le menu « + » : colonnes masquées (restaurables)
 * puis champs standards pas encore dans le tableau.
 */
export function getAddableColumnLabels(
  leftColumns: ColumnDef[],
  hiddenLeftColumns: ColumnDef[],
): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  const addLabel = (label: string) => {
    const trimmed = label.trim();
    const key = trimmed.toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  };

  for (const column of hiddenLeftColumns) {
    addLabel(column.label);
  }

  for (const label of STANDARD_TEMPLATE_LABELS) {
    if (
      isColumnLabelPresent(leftColumns, label) ||
      isColumnLabelPresent(hiddenLeftColumns, label)
    ) {
      continue;
    }
    addLabel(label);
  }

  return result;
}

export type RightColumnDef = ColumnDef & {
  accent: RightColumnAccent;
  variant: "relance" | "statut";
  /** Libellé complet (nom de la relance) affiché au survol de l'en-tête. */
  headerTitle?: string;
  /** Colonne un peu plus étroite (en-têtes longs). */
  compact?: boolean;
};

export type PaymentStatus = "paye" | "";

export const STATUT_COLUMN_ID = "statut";

export function isRowPaid(row: ClientRow): boolean {
  return row.values[STATUT_COLUMN_ID] === "paye";
}

const STATUT_COLUMN: RightColumnDef = {
  id: STATUT_COLUMN_ID,
  label: "Statut",
  accent: "neutral",
  variant: "statut",
};

export function getRelanceStepStyle(index: number): RelanceStepStyle {
  return RELANCE_STEP_STYLES[index % RELANCE_STEP_STYLES.length];
}

export function formatRelanceTiming(days: number): string {
  if (days < 0) return `J${days}`;
  if (days === 0) return "J0";
  return `J+${days}`;
}

export function formatRelanceColumnLabel(days: number): string {
  if (days < 0) return `-${Math.abs(days)} jours`;
  if (days > 0) return `+${days} jours`;
  return "0 jours";
}

export function relanceDaysHint(): string {
  return "par rapport à la date d'échéance";
}

export function formatRelanceStepNumber(index: number): string {
  return `Relance #${index + 1}`;
}

/** Chaque relance doit être strictement après la précédente (délais croissants vs échéance). */
export function validateRelanceStepsOrder(steps: RelanceStep[]): string | null {
  for (let index = 1; index < steps.length; index += 1) {
    if (steps[index].days <= steps[index - 1].days) {
      return `La relance n°${index + 1} doit être après la relance n°${index} (délais croissants par rapport à l'échéance).`;
    }
  }
  return null;
}

export function createRelanceStep(
  partial?: Partial<Pick<RelanceStep, "name" | "days" | "messageTemplate">>,
): RelanceStep {
  return {
    id: crypto.randomUUID(),
    name: partial?.name ?? "Nouvelle relance",
    days: partial?.days ?? 7,
    messageTemplate:
      partial?.messageTemplate ??
      "Bonjour [Nom], concernant votre facture à échéance le [Échéance]…",
  };
}

export function getTemplateBubbles(leftColumns: ColumnDef[]): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];

  for (const label of STANDARD_TEMPLATE_LABELS) {
    const key = label.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      labels.push(label);
    }
  }

  for (const column of leftColumns) {
    const key = column.label.trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      labels.push(column.label);
    }
  }

  return labels;
}

export function createTableData(index = 1): TableData {
  return upgradeLegacyDefaultColumns({
    id: crypto.randomUUID(),
    name: `Tableau ${index}`,
    leftColumns: DEFAULT_LEFT_COLUMNS.map((column) => ({ ...column })),
    hiddenLeftColumns: [],
    rows: [],
    relanceSteps: DEFAULT_RELANCE_STEPS.map((step) => ({
      ...step,
      id: crypto.randomUUID(),
    })),
  });
}

function isLegacyDateColumn(column: ColumnDef) {
  return column.id === "date" && labelsMatch(column.label, "Date");
}

function hasEcheanceColumn(columns: ColumnDef[]) {
  return columns.some(
    (column) =>
      labelsMatch(column.label, "Échéance") || column.id === "echeance",
  );
}

/** Migrations colonnes par défaut (Date→Échéance, ordre Montant/Échéance). */
export function upgradeLegacyDefaultColumns(table: TableData): TableData {
  let next = table;

  if (
    !hasEcheanceColumn(next.leftColumns) &&
    !hasEcheanceColumn(next.hiddenLeftColumns)
  ) {
    const dateIndex = next.leftColumns.findIndex(isLegacyDateColumn);
    if (dateIndex !== -1) {
      const legacyId = next.leftColumns[dateIndex].id;
      const leftColumns = next.leftColumns.map((column, index) =>
        index === dateIndex ? { id: "echeance", label: "Échéance" } : column,
      );

      const rows = next.rows.map((row) => {
        const legacyValue = row.values[legacyId];
        if (legacyValue === undefined) return row;

        const { [legacyId]: _removed, ...rest } = row.values;
        return {
          ...row,
          values: { ...rest, echeance: legacyValue },
        };
      });

      next = { ...next, leftColumns, rows };
    }
  }

  return reorderMontantBeforeEcheance(next);
}

function isMontantColumn(column: ColumnDef) {
  return column.id === "montant" || labelsMatch(column.label, "Montant");
}

function isEcheanceColumn(column: ColumnDef) {
  return column.id === "echeance" || labelsMatch(column.label, "Échéance");
}

function reorderMontantBeforeEcheance(table: TableData): TableData {
  const { leftColumns } = table;
  if (leftColumns.length < 4) return table;

  const echeanceIndex = leftColumns.findIndex(isEcheanceColumn);
  const montantIndex = leftColumns.findIndex(isMontantColumn);
  if (echeanceIndex === -1 || montantIndex === -1) return table;
  if (montantIndex < echeanceIndex) return table;

  const reordered = [...leftColumns];
  const [echeanceColumn] = reordered.splice(echeanceIndex, 1);
  const montantAt = reordered.findIndex(isMontantColumn);
  if (montantAt === -1) return table;

  reordered.splice(montantAt + 1, 0, echeanceColumn);

  return { ...table, leftColumns: reordered };
}

export function getRightColumns(relanceSteps: RelanceStep[]): RightColumnDef[] {
  const relanceColumns: RightColumnDef[] = relanceSteps.map((step, index) => {
    const style = getRelanceStepStyle(index);

    return {
      id: step.id,
      label: formatRelanceTiming(step.days),
      headerTitle: step.name.trim() || `Relance ${index + 1}`,
      accent: style.accent,
      variant: "relance",
    };
  });

  return [...relanceColumns, { ...STATUT_COLUMN }];
}

export function createColumn(label: string): ColumnDef {
  return { id: crypto.randomUUID(), label };
}

function labelsMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function findColumnByLabel(columns: ColumnDef[], label: string) {
  return columns.find((column) => labelsMatch(column.label, label));
}

function columnHasDataInRows(columnId: string, rows: ClientRow[]) {
  return rows.some((row) => row.values[columnId]?.trim());
}

function takeHiddenColumnByLabel(
  hiddenLeftColumns: ColumnDef[],
  label: string,
): { column: ColumnDef | null; hiddenLeftColumns: ColumnDef[] } {
  const match = findColumnByLabel(hiddenLeftColumns, label);
  if (!match) {
    return { column: null, hiddenLeftColumns };
  }

  return {
    column: match,
    hiddenLeftColumns: hiddenLeftColumns.filter((column) => column.id !== match.id),
  };
}

/** Masque une colonne visible sans effacer les valeurs des lignes. */
export function hideLeftColumn(table: TableData, columnId: string): TableData {
  if (table.leftColumns.length <= 1) return table;

  const column = table.leftColumns.find((entry) => entry.id === columnId);
  if (!column) return table;

  return {
    ...table,
    leftColumns: table.leftColumns.filter((entry) => entry.id !== columnId),
    hiddenLeftColumns: [...table.hiddenLeftColumns, column],
  };
}

/** Affiche une colonne : restaure une colonne masquée ou en crée une nouvelle. */
export function addOrRestoreLeftColumn(table: TableData, label: string): TableData {
  const { column: restored, hiddenLeftColumns } = takeHiddenColumnByLabel(
    table.hiddenLeftColumns,
    label,
  );

  if (restored) {
    return {
      ...table,
      leftColumns: [...table.leftColumns, restored],
      hiddenLeftColumns,
    };
  }

  if (findColumnByLabel(table.leftColumns, label)) {
    return table;
  }

  return {
    ...table,
    leftColumns: [...table.leftColumns, createColumn(label)],
  };
}

function resolveColumnForLabel(
  table: TableData,
  label: string,
): { column: ColumnDef; hiddenLeftColumns: ColumnDef[] } {
  const visible = findColumnByLabel(table.leftColumns, label);
  if (visible) {
    return { column: visible, hiddenLeftColumns: table.hiddenLeftColumns };
  }

  const { column: restored, hiddenLeftColumns } = takeHiddenColumnByLabel(
    table.hiddenLeftColumns,
    label,
  );
  if (restored) {
    return { column: restored, hiddenLeftColumns };
  }

  return { column: createColumn(label), hiddenLeftColumns: table.hiddenLeftColumns };
}

export function mergeClientValuesIntoTable(
  table: TableData,
  valuesByLabel: Record<string, string>,
): TableData {
  const submittedLabels = Object.keys(valuesByLabel);
  let hiddenLeftColumns = [...table.hiddenLeftColumns];

  const fromSubmission = submittedLabels.map((label) => {
    const resolved = resolveColumnForLabel(
      { ...table, hiddenLeftColumns },
      label,
    );
    hiddenLeftColumns = resolved.hiddenLeftColumns;
    return resolved.column;
  });

  const keptNotInSubmission = table.leftColumns.filter((column) => {
    const inSubmission = submittedLabels.some((label) =>
      labelsMatch(label, column.label),
    );
    if (inSubmission) return false;
    return columnHasDataInRows(column.id, table.rows);
  });

  const leftColumns = [...fromSubmission, ...keptNotInSubmission];

  const values: Record<string, string> = {};
  for (const column of leftColumns) {
    const match = Object.entries(valuesByLabel).find(([label]) =>
      labelsMatch(label, column.label),
    );
    values[column.id] = match?.[1]?.trim() ?? "";
  }

  return {
    ...table,
    hiddenLeftColumns,
    leftColumns,
    rows: [...table.rows, createClientRow(leftColumns, values)],
  };
}

export function mergeMultipleClientsIntoTable(
  table: TableData,
  rows: Record<string, string>[],
): TableData {
  return rows.reduce(
    (current, valuesByLabel) => mergeClientValuesIntoTable(current, valuesByLabel),
    table,
  );
}

export function createClientRow(
  leftColumns: ColumnDef[],
  values: Record<string, string>,
): ClientRow {
  const rowValues: Record<string, string> = {};
  for (const column of leftColumns) {
    rowValues[column.id] =
      values[column.id] ?? values[column.label] ?? "";
  }
  return { id: crypto.randomUUID(), values: rowValues };
}

function guessInputType(label: string): "text" | "email" | "date" | "tel" {
  const normalized = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (normalized.includes("mail")) return "email";
  if (
    normalized.includes("date") ||
    normalized.includes("echeance")
  ) {
    return "date";
  }
  if (isPhoneColumnLabel(label)) return "tel";
  return "text";
}

export function isPhoneColumnLabel(label: string): boolean {
  const normalized = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  return (
    normalized.includes("numero") ||
    normalized.includes("telephone") ||
    normalized.includes("phone") ||
    normalized === "tel"
  );
}

/** Évite que le navigateur associe « Numéro » / « Montant » à un formulaire de paiement. */
export function getColumnFieldName(label: string): string {
  const slug = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `lockin-${slug || "field"}`;
}

export function getColumnAutocomplete(label: string): string {
  const normalized = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

  if (normalized.includes("mail")) return "email";
  if (isPhoneColumnLabel(label)) return "tel";
  return "off";
}

export function getColumnInputType(column: ColumnDef) {
  return guessInputType(column.label);
}
