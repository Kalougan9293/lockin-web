export type ColumnDef = {
  id: string;
  label: string;
};

export type ClientRow = {
  id: string;
  values: Record<string, string>;
};

export const MAX_RELANCES = 7;

export type RelanceStepChannel = "email" | "sms" | "both";

export const DEFAULT_RELANCE_STEP_CHANNEL: RelanceStepChannel = "email";

export function normalizeRelanceStepChannel(value: unknown): RelanceStepChannel {
  if (value === "email" || value === "sms" || value === "both") return value;
  return DEFAULT_RELANCE_STEP_CHANNEL;
}

export function relanceStepNeedsEmail(channel: RelanceStepChannel): boolean {
  return channel === "email" || channel === "both";
}

export function relanceStepNeedsSms(channel: RelanceStepChannel): boolean {
  return channel === "sms" || channel === "both";
}

export function formatRelanceChannelLabel(channel: RelanceStepChannel): string {
  switch (channel) {
    case "email":
      return "E-mail automatique LockIn";
    case "sms":
      return "SMS automatique LockIn";
    case "both":
      return "E-mail + SMS automatiques LockIn";
  }
}

export const RELANCE_SMS_MAX_LENGTH = 160;

export type RelanceStep = {
  id: string;
  name: string;
  days: number;
  messageTemplate: string;
  channel: RelanceStepChannel;
  smsTemplate: string;
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

export const COLUMN_LABEL_TELEPHONE = "Téléphone";
export const COLUMN_LABEL_FACTURE = "N°Facture";
export const COLUMN_LABEL_PAYMENT_LINK = "Lien de paiement";

/** Anciens libellés UI / clés import IA — mappés vers les colonnes actuelles (ids inchangés). */
export const LEGACY_COLUMN_LABEL_ALIASES: Record<string, string> = {
  Numéro: COLUMN_LABEL_TELEPHONE,
  Référence: COLUMN_LABEL_FACTURE,
};

export function canonicalColumnLabel(label: string): string {
  const trimmed = label.trim();
  return LEGACY_COLUMN_LABEL_ALIASES[trimmed] ?? trimmed;
}

/** Unifie les clés import IA (Référence, Numéro…) vers les libellés colonnes actuels. */
export function normalizeImportedFieldKeys(
  fields: Record<string, string>,
): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [key, raw] of Object.entries(fields)) {
    const value = raw?.trim() ?? "";
    if (!value) continue;

    const canonical = canonicalColumnLabel(key);
    if (!normalized[canonical]) {
      normalized[canonical] = value;
    }
  }

  return normalized;
}

/** Lit une valeur importée même si elle est encore sous une clé legacy. */
export function getImportFieldValue(
  fields: Record<string, string>,
  label: string,
): string {
  const direct = fields[label]?.trim();
  if (direct) return direct;

  const legacyKey = Object.entries(LEGACY_COLUMN_LABEL_ALIASES).find(([, canonical]) =>
    labelsMatch(canonical, label),
  )?.[0];

  return legacyKey ? fields[legacyKey]?.trim() ?? "" : fields[label] ?? "";
}

export const STANDARD_TEMPLATE_LABELS = [
  "Nom",
  "Mail",
  "Date",
  "Montant",
  "Échéance",
  COLUMN_LABEL_PAYMENT_LINK,
  COLUMN_LABEL_TELEPHONE,
  "Info",
  COLUMN_LABEL_FACTURE,
] as const;

export function defaultRelanceStepName(ordre: number): string {
  return `Relance ${ordre + 1}`;
}

export const DEFAULT_SMS_FALLBACK =
  "Bonjour [Nom], relance facture [N°Facture] (éch. [Échéance]). Merci de votre retour.";

export const DEFAULT_RELANCE_STEPS: RelanceStep[] = [
  {
    id: "rappel-j7",
    name: "Relance 1",
    days: -7,
    channel: DEFAULT_RELANCE_STEP_CHANNEL,
    smsTemplate:
      "Bonjour [Nom], facture [N°Facture] à échéance le [Échéance]. Merci d'anticiper le règlement.",
    messageTemplate:
      "Bonjour [Nom],\n\nVotre facture arrive bientôt à échéance le [Échéance]. Nous vous adressons ce message afin d'anticiper son règlement.\n\nMerci beaucoup.",
  },
  {
    id: "relance-j10",
    name: "Relance 2",
    days: 10,
    channel: DEFAULT_RELANCE_STEP_CHANNEL,
    smsTemplate:
      "Bonjour [Nom], facture [N°Facture] impayée (éch. [Échéance]). Merci de nous indiquer une date de paiement.",
    messageTemplate:
      "Bonjour [Nom],\n\nÀ ce jour, nous n'avons pas reçu le règlement de la facture arrivée à échéance le [Échéance].\n\nMerci de nous indiquer une date de paiement ou de procéder à sa régularisation dans les meilleurs délais.",
  },
  {
    id: "relance-j30",
    name: "Relance 3",
    days: 30,
    channel: DEFAULT_RELANCE_STEP_CHANNEL,
    smsTemplate:
      "Bonjour [Nom], facture [N°Facture] toujours impayée (éch. [Échéance]). Merci de régulariser sous 8 jours.",
    messageTemplate:
      "Bonjour [Nom],\n\nSauf erreur de notre part, la facture échue le [Échéance] demeure impayée malgré nos précédentes relances.\n\nNous vous remercions de procéder à sa régularisation sous 8 jours. À défaut de règlement, nous nous réservons le droit d'engager les démarches nécessaires au recouvrement de cette créance.",
  },
];

/** Message SMS court par défaut, calqué sur le ton des e-mails (max 160 car. une fois variables remplacées). */
export function defaultSmsTemplateForStep(days: number): string {
  const match = DEFAULT_RELANCE_STEPS.find((step) => step.days === days);
  if (match?.smsTemplate.trim()) return match.smsTemplate;
  return DEFAULT_SMS_FALLBACK;
}

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
  /** Mettre le prestataire en CC sur chaque relance e-mail. */
  ccCreditor: boolean;
};

/** Colonnes optionnelles visibles par défaut (Info en dernier, voir DEFAULT_LEFT_COLUMNS). */
export const DEFAULT_OPTIONAL_LEFT_COLUMNS: ColumnDef[] = [
  { id: "numero", label: COLUMN_LABEL_TELEPHONE },
  { id: "date", label: "Date" },
  { id: "reference", label: COLUMN_LABEL_FACTURE },
];

export const DEFAULT_LEFT_COLUMNS: ColumnDef[] = [
  { id: "nom", label: "Nom" },
  { id: "mail", label: "Mail" },
  ...DEFAULT_OPTIONAL_LEFT_COLUMNS,
  { id: "montant", label: "Montant" },
  { id: "echeance", label: "Échéance" },
  { id: "info", label: "Info" },
];

export const DEFAULT_MODAL_FIELDS = ["Nom", "Mail", "Montant", "Échéance"] as const;

/** Toujours visibles dans la modale d'import (même vides) — champs clés pour les relances. */
export const IMPORT_ALWAYS_VISIBLE_MODAL_FIELDS = ["Mail", "Échéance"] as const;

export const OPTIONAL_CLIENT_BUBBLES = [
  "Date",
  COLUMN_LABEL_TELEPHONE,
  "Info",
  "Échéance",
  COLUMN_LABEL_PAYMENT_LINK,
  COLUMN_LABEL_FACTURE,
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
  const fromValues = MODAL_FIELD_POOL.filter((label) =>
    importFieldHasValue(fields, label),
  );
  const customs = Object.keys(fields).filter(
    (key) =>
      fields[key]?.trim() &&
      !MODAL_FIELD_POOL.some(
        (label) =>
          labelsMatch(label, key) || labelsMatch(label, canonicalColumnLabel(key)),
      ) &&
      !Object.prototype.hasOwnProperty.call(LEGACY_COLUMN_LABEL_ALIASES, key.trim()),
  );

  const wanted = new Set(
    [...IMPORT_ALWAYS_VISIBLE_MODAL_FIELDS, ...fromValues, ...customs].map(
      (label) => label.toLowerCase(),
    ),
  );

  const ordered = MODAL_FIELD_POOL.filter((label) =>
    wanted.has(label.toLowerCase()),
  );

  const extraCustoms = customs.filter(
    (label) =>
      !MODAL_FIELD_POOL.some(
        (entry) => entry.toLowerCase() === label.toLowerCase(),
      ),
  );

  return [...ordered, ...extraCustoms];
}

/** @deprecated Utiliser DEFAULT_MODAL_FIELDS + OPTIONAL_CLIENT_BUBBLES */
export const ADD_CLIENT_BUBBLES = [...OPTIONAL_CLIENT_BUBBLES, "Autres"] as const;

/** @deprecated Préférer getAddableColumnLabels() — liste dynamique selon colonnes visibles/masquées. */
export const LEFT_COLUMN_PRESETS = [
  "Date",
  COLUMN_LABEL_TELEPHONE,
  "Info",
  "Montant",
  COLUMN_LABEL_FACTURE,
];

function isColumnLabelPresent(columns: ColumnDef[], label: string) {
  const canonical = canonicalColumnLabel(label);
  return columns.some(
    (column) =>
      labelsMatch(column.label, label) ||
      labelsMatch(column.label, canonical) ||
      labelsMatch(canonicalColumnLabel(column.label), canonical),
  );
}

function columnPresetExistsInTable(
  leftColumns: ColumnDef[],
  hiddenLeftColumns: ColumnDef[],
  preset: ColumnDef,
): boolean {
  const all = [...leftColumns, ...hiddenLeftColumns];
  if (all.some((column) => column.id === preset.id)) return true;
  return isColumnLabelPresent(all, preset.label);
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
  variant: "relance" | "progression" | "statut";
  /** Libellé complet (nom de la relance) affiché au survol de l'en-tête. */
  headerTitle?: string;
  /** Colonne un peu plus étroite (en-têtes longs). */
  compact?: boolean;
};

export type PaymentStatus =
  | ""
  | "paye"
  | "aucune_reponse"
  | "promesse"
  | "delai"
  | "partiel"
  | "litige"
  | "refus"
  | "injoignable";

export const STATUT_COLUMN_ID = "statut";
export const PROGRESSION_COLUMN_ID = "progression";

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
  partial?: Partial<
    Pick<RelanceStep, "name" | "days" | "messageTemplate" | "channel" | "smsTemplate">
  >,
): RelanceStep {
  return {
    id: crypto.randomUUID(),
    name: partial?.name?.trim() || defaultRelanceStepName(0),
    days: partial?.days ?? 7,
    channel: partial?.channel ?? DEFAULT_RELANCE_STEP_CHANNEL,
    smsTemplate: partial?.smsTemplate ?? "",
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
  return ensureDefaultRelanceSteps(
    upgradeLegacyDefaultColumns({
      id: crypto.randomUUID(),
      name: `Tableau ${index}`,
      leftColumns: DEFAULT_LEFT_COLUMNS.map((column) => ({ ...column })),
      hiddenLeftColumns: [{ id: "lien_paiement", label: COLUMN_LABEL_PAYMENT_LINK }],
      rows: [],
      relanceSteps: [],
      ccCreditor: false,
    }),
  );
}

const MIN_CONFIGURED_RELANCE_MESSAGE_LENGTH = 40;

function buildDefaultRelanceSteps(existing: RelanceStep[] = []): RelanceStep[] {
  return DEFAULT_RELANCE_STEPS.map((step, ordre) => ({
    ...step,
    id: existing[ordre]?.id ?? crypto.randomUUID(),
    name: step.name.trim() || defaultRelanceStepName(ordre),
  }));
}

/** Copie fraîche des 3 relances par défaut (ids uniques) pour l’UI. */
export function buildDefaultRelanceStepsForUi(): RelanceStep[] {
  return buildDefaultRelanceSteps();
}

/** Relances jamais configurées (messages vides ou placeholders type « test »). */
export function relanceStepsLookUnconfigured(steps: RelanceStep[]): boolean {
  if (steps.length === 0) return true;
  return steps.every(
    (step) => step.messageTemplate.trim().length < MIN_CONFIGURED_RELANCE_MESSAGE_LENGTH,
  );
}

/**
 * Réinjecte les 3 relances par défaut si le tableau n'en a aucune (legacy)
 * ou si la config en base est incomplète / placeholder (≠ démo).
 */
export function ensureDefaultRelanceSteps(table: TableData): TableData {
  if (
    table.relanceSteps.length >= DEFAULT_RELANCE_STEPS.length ||
    (table.relanceSteps.length > 0 && !relanceStepsLookUnconfigured(table.relanceSteps))
  ) {
    return table;
  }

  return {
    ...table,
    relanceSteps: buildDefaultRelanceSteps(table.relanceSteps),
  };
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

export type UpgradeLegacyDefaultColumnsOptions = {
  /**
   * Ajoute les colonnes optionnelles manquantes (Téléphone, Date, etc.).
   * Réservé à la création d'un nouveau tableau — pas au chargement depuis la base.
   */
  seedMissingOptionalColumns?: boolean;
};

/** Migrations colonnes par défaut (Date→Échéance, ordre Montant/Échéance). */
export function upgradeLegacyDefaultColumns(
  table: TableData,
  options: UpgradeLegacyDefaultColumnsOptions = {},
): TableData {
  const seedMissingOptionalColumns = options.seedMissingOptionalColumns ?? true;
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

  next = renameStandardColumnLabels(next);
  next = reorderMontantBeforeEcheance(next);

  if (seedMissingOptionalColumns) {
    next = ensureDefaultOptionalLeftColumns(next);
    if (
      looksLikeLegacyDefaultColumnOrder(next.leftColumns) ||
      hasOnlyDefaultLeftColumnLabels(next.leftColumns)
    ) {
      next = reorderLeftColumnsToDefaultOrder(next);
    }
  }

  return next;
}

function renameStandardColumnLabels(table: TableData): TableData {
  const remapColumns = (columns: ColumnDef[]) => {
    let changed = false;
    const next = columns.map((column) => {
      if (column.id === "numero" && labelsMatch(column.label, "Numéro")) {
        changed = true;
        return { ...column, label: COLUMN_LABEL_TELEPHONE };
      }
      if (column.id === "reference" && labelsMatch(column.label, "Référence")) {
        changed = true;
        return { ...column, label: COLUMN_LABEL_FACTURE };
      }
      return column;
    });
    return { next, changed };
  };

  const left = remapColumns(table.leftColumns);
  const hidden = remapColumns(table.hiddenLeftColumns);
  if (!left.changed && !hidden.changed) return table;
  return { ...table, leftColumns: left.next, hiddenLeftColumns: hidden.next };
}

/** Ajoute Téléphone / Date / N°Facture / Info (en dernier) si jamais présentes. */
function ensureDefaultOptionalLeftColumns(table: TableData): TableData {
  let leftColumns = [...table.leftColumns];
  let hiddenLeftColumns = [...table.hiddenLeftColumns];
  let changed = false;

  for (const preset of [...DEFAULT_OPTIONAL_LEFT_COLUMNS, { id: "info", label: "Info" }]) {
    if (columnPresetExistsInTable(leftColumns, hiddenLeftColumns, preset)) {
      continue;
    }
    leftColumns.push({ ...preset });
    changed = true;
  }

  if (
    !columnPresetExistsInTable(leftColumns, hiddenLeftColumns, {
      id: "lien_paiement",
      label: COLUMN_LABEL_PAYMENT_LINK,
    })
  ) {
    hiddenLeftColumns.push({
      id: "lien_paiement",
      label: COLUMN_LABEL_PAYMENT_LINK,
    });
    changed = true;
  }

  if (!changed) return table;
  return reorderLeftColumnsToDefaultOrder({ ...table, leftColumns, hiddenLeftColumns });
}

function looksLikeLegacyDefaultColumnOrder(leftColumns: ColumnDef[]): boolean {
  if (leftColumns.length < 4) return false;
  return (
    labelsMatch(leftColumns[0].label, "Nom") &&
    labelsMatch(leftColumns[1].label, "Mail") &&
    labelsMatch(leftColumns[2].label, "Montant") &&
    labelsMatch(leftColumns[3].label, "Échéance")
  );
}

function hasOnlyDefaultLeftColumnLabels(leftColumns: ColumnDef[]): boolean {
  if (leftColumns.length === 0) return false;
  const allowed = new Set(
    DEFAULT_LEFT_COLUMNS.map((column) => column.label.toLowerCase()),
  );
  return leftColumns.every((column) =>
    allowed.has(column.label.trim().toLowerCase()),
  );
}

/** Remet les colonnes standards dans l'ordre par défaut (colonnes custom en fin). */
function reorderLeftColumnsToDefaultOrder(table: TableData): TableData {
  const { leftColumns } = table;
  if (leftColumns.length === 0) return table;

  const used = new Set<string>();
  const ordered: ColumnDef[] = [];

  for (const preset of DEFAULT_LEFT_COLUMNS) {
    const match = leftColumns.find(
      (column) =>
        !used.has(column.id) && labelsMatch(column.label, preset.label),
    );
    if (match) {
      ordered.push(match);
      used.add(match.id);
    }
  }

  for (const column of leftColumns) {
    if (!used.has(column.id)) {
      ordered.push(column);
    }
  }

  const sameOrder = ordered.every(
    (column, index) => column.id === leftColumns[index]?.id,
  );
  if (sameOrder) return table;
  return { ...table, leftColumns: ordered };
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
  const columns: RightColumnDef[] = [];

  if (relanceSteps.length > 0) {
    columns.push({
      id: PROGRESSION_COLUMN_ID,
      label: "Progression",
      headerTitle: "Progression des relances",
      accent: "neutral",
      variant: "progression",
    });
  }

  return [...columns, { ...STATUT_COLUMN }];
}

export function createColumn(label: string): ColumnDef {
  return { id: crypto.randomUUID(), label };
}

function labelsMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function labelsMatchField(columnLabel: string, fieldLabel: string) {
  return (
    labelsMatch(columnLabel, fieldLabel) ||
    labelsMatch(columnLabel, canonicalColumnLabel(fieldLabel))
  );
}

function importFieldHasValue(
  fields: Record<string, string>,
  label: string,
): boolean {
  if (fields[label]?.trim()) return true;
  const legacyKey = Object.entries(LEGACY_COLUMN_LABEL_ALIASES).find(([, canonical]) =>
    labelsMatch(canonical, label),
  )?.[0];
  return Boolean(legacyKey && fields[legacyKey]?.trim());
}

function findColumnByLabel(columns: ColumnDef[], label: string) {
  const canonical = canonicalColumnLabel(label);
  return columns.find(
    (column) =>
      labelsMatch(column.label, label) || labelsMatch(column.label, canonical),
  );
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
      labelsMatchField(column.label, label),
    );
    if (inSubmission) return false;
    return columnHasDataInRows(column.id, table.rows);
  });

  const leftColumns = [...fromSubmission, ...keptNotInSubmission];

  const values: Record<string, string> = {};
  for (const column of leftColumns) {
    const match = Object.entries(valuesByLabel).find(([label]) =>
      labelsMatchField(column.label, label),
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
    normalized.includes("telephone") ||
    normalized.includes("phone") ||
    normalized === "tel" ||
    normalized === "numero"
  );
}

/** Évite que le navigateur associe téléphone / montant à un formulaire de paiement. */
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
