"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { useHoldDragReorder } from "@/hooks/useHoldDragReorder";
import {
  buildRelanceDisplayForRow,
  buildRelanceProgressForRow,
  filterDeliveriesForLigne,
} from "@/lib/dashboard/relance-delivery-display";
import { isRecoveryRequired, getRowFieldValue } from "@/lib/dashboard/recovery";
import { rowMissingDueDate } from "@/lib/dashboard/relance-schedule";
import {
  dashboardColumnHeaderClassName,
  dashboardConfigureTitleClassName,
  dashboardTitleGradientClassName,
} from "@/lib/dashboard/typography";
import {
  formatAmountForDisplay,
  isAmountColumnLabel,
} from "@/lib/preferences/currency-format";
import type { DateFormatPreference } from "@/lib/preferences/date-format";
import {
  formatDateForDisplay,
  isDateColumnLabel,
} from "@/lib/preferences/date-format";
import type { RelanceDeliveryRow } from "@/types/database";
import type { ClientRow, ColumnDef, PaymentStatus, RelanceStep, RightColumnDef } from "@/types/tableau";
import {
  getAddableColumnLabels,
  getColumnAutocomplete,
  getColumnFieldName,
  getColumnInputType,
  isRowPaid,
  STATUT_COLUMN_ID,
} from "@/types/tableau";

import { RecoveryBadge } from "./RecoveryBadge";
import { RelanceProgressCell } from "./RelanceProgressCell";
import { RelanceProgressDrawer } from "./RelanceProgressDrawer";
import { RelanceScheduleCell } from "./RelanceScheduleCell";
import {
  EditableTableTitle,
} from "./EditableTableTitle";
import { TableAmountCell } from "./TableAmountCell";
import { TableDateCell } from "./TableDateCell";

/** Style du libellé Configurer (Geist). */
const configureLabelClassName = dashboardConfigureTitleClassName;
const MIN_EMPTY_ROWS = 3;
const TABLE_DATA_ROW_HEIGHT = "min-h-16 h-16";
const TABLE_BORDER = "border-white/[0.12]";
const TABLE_CELL_BORDER = "border-white/[0.08]";
const TABLE_ROW_EVEN = "bg-white/[0.05]";
const TABLE_ROW_ODD = "bg-white/[0.025]";

function dataRowSurfaceClass(rowIndex: number, paid = false) {
  return `${rowIndex % 2 === 0 ? TABLE_ROW_EVEN : TABLE_ROW_ODD} transition-colors hover:bg-white/[0.08] ${
    paid ? "opacity-55" : ""
  }`;
}

type RowNumberColumnProps = {
  rows: ClientRow[];
  totalRows: number;
  onAddClient?: () => void;
  addRowDisabled?: boolean;
};

function RowNumberColumn({
  rows,
  totalRows,
  onAddClient,
  addRowDisabled = false,
  showHeader = true,
}: RowNumberColumnProps & { showHeader?: boolean }) {
  return (
    <div className={`w-7 shrink-0 border-r ${TABLE_BORDER} sm:w-8`}>
      {showHeader ? (
        <div className={`h-11 border-b ${TABLE_CELL_BORDER} bg-violet-500/20`} />
      ) : null}
      {Array.from({ length: totalRows }).map((_, rowIndex) => {
        const isDataRow = rowIndex < rows.length;
        const isAddRow = rowIndex === rows.length;

        return (
          <div
            key={rowIndex}
            className={`flex ${TABLE_DATA_ROW_HEIGHT} items-center justify-center border-b ${TABLE_CELL_BORDER} ${
              rowIndex % 2 === 0 ? TABLE_ROW_EVEN : TABLE_ROW_ODD
            }`}
          >
            {isAddRow && onAddClient ? (
              <button
                type="button"
                onClick={onAddClient}
                disabled={addRowDisabled}
                aria-label="Ajouter un client"
                className="flex h-5 w-5 items-center justify-center rounded-full border border-violet-400/20 bg-violet-500/10 text-xs text-violet-300/80 transition-all hover:border-violet-400/40 hover:bg-violet-500/20 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-30"
              >
                +
              </button>
            ) : isDataRow ? (
              <span className="text-xs tabular-nums text-brand-muted/70">
                {rowIndex + 1}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function RowDeleteColumn({
  rows,
  totalRows,
  onDeleteRow,
  headerSpacerClassName = "h-12",
}: {
  rows: ClientRow[];
  totalRows: number;
  onDeleteRow: (rowIndex: number) => void;
  headerSpacerClassName?: string;
}) {
  return (
    <div className="flex w-8 shrink-0 flex-col pl-1.5">
      <div className={`${headerSpacerClassName} shrink-0`} aria-hidden />
      {Array.from({ length: totalRows }).map((_, rowIndex) => {
        const isDataRow = rowIndex < rows.length;

        return (
          <div
            key={rowIndex}
            className={`flex ${TABLE_DATA_ROW_HEIGHT} shrink-0 items-center justify-center`}
          >
            {isDataRow ? (
              <RowDeleteButton onClick={() => onDeleteRow(rowIndex)} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

type TableColumnProps = {
  column: ColumnDef;
  headerClass: string;
  dateFormat: DateFormatPreference;
  editable?: boolean;
  draggable?: boolean;
  bindItem?: ReturnType<typeof useHoldDragReorder<ColumnDef>>["bindItem"];
  bindHandle?: ReturnType<typeof useHoldDragReorder<ColumnDef>>["bindHandle"];
  rows: ClientRow[];
  totalRows: number;
  onRemove?: () => void;
  getCellValue: (rowIndex: number, columnId: string) => string;
  getCellRawValue?: (rowIndex: number, columnId: string) => string;
  onCellChange?: (rowIndex: number, columnId: string, value: string) => void;
  showHeader?: boolean;
  compressed?: boolean;
  onToggleCompress?: () => void;
};

const REMOVE_BUTTON_CH = 2.25;
const COMPRESS_BUTTON_CH = 2;
const COLUMN_WIDTH_PAD_CH = 0.35;
const RIGHT_COLUMN_WIDTH_PAD_CH = 1.5;
/** Largeur minimale d'une colonne relance (texte « Prévu : DD/MM »). */
const DEFAULT_RELANCE_COLUMN_MIN_WIDTH = "7rem";
/** Largeur minimale de la colonne Statut. */
const DEFAULT_STATUT_COLUMN_MIN_WIDTH = "5.75rem";
/** Largeur de la colonne Progression (badge + bouton timeline). */
const PROGRESSION_COLUMN_WIDTH = "12.75rem";

function normalizeColumnLabel(label: string) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Libellé court en-tête quand la colonne est compressée. */
function getCompressedColumnLabel(label: string): string {
  const key = normalizeColumnLabel(label);
  if (key === "reference") return "Ref";
  if (key === "montant") return "€";
  if (key === "numero") return "06";
  return label;
}

function getColumnCharWidth(
  column: ColumnDef,
  rows: ClientRow[],
  getLength: (rowIndex: number, columnId: string) => number,
  extraControlsCh = 0,
) {
  const lengths = rows.map((_, rowIndex) => getLength(rowIndex, column.id));
  const base = Math.max(column.label.length, ...lengths, 3);
  return base + extraControlsCh;
}

function computeColumnStyle(
  column: ColumnDef,
  rows: ClientRow[],
  getLength: (rowIndex: number, columnId: string) => number,
  options: {
    reserveRemoveButton?: boolean;
    reserveCompressButton?: boolean;
    compressed?: boolean;
  } = {},
) {
  const {
    reserveRemoveButton = false,
    reserveCompressButton = false,
    compressed = false,
  } = options;

  const controlsCh =
    (reserveRemoveButton ? REMOVE_BUTTON_CH : 0) +
    (reserveCompressButton ? COMPRESS_BUTTON_CH : 0);

  if (compressed) {
    const shortLabel = getCompressedColumnLabel(column.label);
    const columnCharWidth = Math.max(shortLabel.length, 3) + controlsCh;
    return {
      width: `${columnCharWidth + COLUMN_WIDTH_PAD_CH}ch`,
      minWidth: `${columnCharWidth + COLUMN_WIDTH_PAD_CH}ch`,
    };
  }

  const columnCharWidth = getColumnCharWidth(
    column,
    rows,
    getLength,
    controlsCh,
  );
  return { width: `${columnCharWidth + COLUMN_WIDTH_PAD_CH}ch` };
}

function getStatutColumnCharWidth(column: RightColumnDef) {
  return Math.max(column.label.length, "PAYE ?".length, "PAYE !".length, 4);
}

function computeRightColumnStyle(column: RightColumnDef) {
  if (column.variant === "progression") {
    return {
      minWidth: PROGRESSION_COLUMN_WIDTH,
      width: PROGRESSION_COLUMN_WIDTH,
    };
  }

  if (column.variant === "relance") {
    return { minWidth: DEFAULT_RELANCE_COLUMN_MIN_WIDTH };
  }

  const charWidth = getStatutColumnCharWidth(column);
  return {
    minWidth: DEFAULT_STATUT_COLUMN_MIN_WIDTH,
    width: `${charWidth + RIGHT_COLUMN_WIDTH_PAD_CH}ch`,
  };
}

function TableSeparator() {
  return (
    <div
      aria-hidden
      className="w-[3px] shrink-0 self-stretch bg-gradient-to-b from-violet-300/90 via-fuchsia-200/80 to-indigo-300/90 shadow-[0_0_14px_rgba(192,132,252,0.55)]"
    />
  );
}

function CompressColumnButton({
  compressed,
  onClick,
  columnLabel,
}: {
  compressed: boolean;
  onClick: () => void;
  columnLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        compressed
          ? `Développer la colonne ${columnLabel}`
          : `Compresser la colonne ${columnLabel}`
      }
      aria-pressed={compressed}
      title={compressed ? "Développer" : "Compresser"}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors hover:bg-white/10 ${
        compressed ? "text-violet-200" : "text-white/45 hover:text-violet-200"
      }`}
    >
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        aria-hidden="true"
      >
        {compressed ? (
          <>
            <path strokeLinecap="round" d="M9 8l-3 3 3 3M15 8l3 3-3 3" />
          </>
        ) : (
          <>
            <path strokeLinecap="round" d="M7 8l-3 3 3 3M17 8l3 3-3 3" />
          </>
        )}
      </svg>
    </button>
  );
}

function RowDeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Effacer la ligne"
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
    >
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </button>
  );
}

const RIGHT_COLUMN_STYLES = {
  green: {
    header: "bg-emerald-500/28 text-emerald-100",
    cell: "bg-emerald-500/[0.07]",
  },
  yellow: {
    header: "bg-amber-400/28 text-amber-100",
    cell: "bg-amber-400/[0.07]",
  },
  orange: {
    header: "bg-orange-500/28 text-orange-100",
    cell: "bg-orange-500/[0.07]",
  },
  red: {
    header: "bg-rose-500/30 text-rose-100",
    cell: "bg-rose-500/[0.08]",
  },
  neutral: {
    header: "bg-fuchsia-500/22 text-fuchsia-100",
    cell: "",
  },
} as const;

type RecoveryRowOverlaysProps = {
  rows: ClientRow[];
  allLeftColumns: ColumnDef[];
  relanceSteps: RelanceStep[];
  onRecoveryClick: (rowIndex: number) => void;
};

function RecoveryRowOverlays({
  rows,
  allLeftColumns,
  relanceSteps,
  onRecoveryClick,
}: RecoveryRowOverlaysProps) {
  return (
    <>
      {rows.map((row, rowIndex) => {
        if (!isRecoveryRequired(row, allLeftColumns, relanceSteps)) return null;

        return (
          <div
            key={row.id}
            className={`pointer-events-none absolute inset-x-0 z-10 flex ${TABLE_DATA_ROW_HEIGHT} items-center justify-center overflow-visible px-1`}
            style={{ top: `calc(2.75rem + ${rowIndex} * 4rem)` }}
          >
            <RecoveryBadge
              fullWidth
              onClick={() => onRecoveryClick(rowIndex)}
            />
          </div>
        );
      })}
    </>
  );
}

type RightTableColumnProps = {
  column: RightColumnDef;
  rows: ClientRow[];
  totalRows: number;
  allLeftColumns: ColumnDef[];
  relanceSteps: RelanceStep[];
  deliveries: RelanceDeliveryRow[];
  simulateRelances: boolean;
  onStatusChange: (rowIndex: number, status: PaymentStatus) => void;
  expandForRecovery?: boolean;
  onOpenProgressTimeline?: (rowIndex: number) => void;
};

function RightTableColumn({
  column,
  rows,
  totalRows,
  allLeftColumns,
  relanceSteps,
  deliveries,
  simulateRelances,
  onStatusChange,
  expandForRecovery = false,
  onOpenProgressTimeline,
}: RightTableColumnProps) {
  const styles = RIGHT_COLUMN_STYLES[column.accent];
  const columnStyle = computeRightColumnStyle(column);
  const isRelanceColumn = column.variant === "relance";
  const isProgressionColumn = column.variant === "progression";

  return (
    <div
      style={columnStyle}
      className={`shrink-0 border-r ${TABLE_BORDER} ${
        isRelanceColumn
          ? expandForRecovery
            ? "min-w-[5rem] flex-1"
            : ""
          : isProgressionColumn
            ? expandForRecovery
              ? ""
              : ""
            : "last:border-r-0"
      }`}
    >
      <div
        className={`flex h-11 flex-col items-center justify-center border-b ${TABLE_CELL_BORDER} px-2 py-0.5 ${styles.header}`}
        title={column.headerTitle}
      >
        <span
          className={`${dashboardColumnHeaderClassName} whitespace-nowrap text-center font-bold leading-none ${
            column.variant === "statut"
              ? "text-base"
              : column.variant === "progression"
                ? "text-sm"
                : "text-xs"
          }`}
        >
          {column.label}
        </span>
      </div>

      {Array.from({ length: totalRows }).map((_, rowIndex) => {
        const isDataRow = rowIndex < rows.length;
        const row = rows[rowIndex];
        const status = (row?.values[STATUT_COLUMN_ID] ?? "") as PaymentStatus;
        const paid = isDataRow && row ? isRowPaid(row) : false;
        const recovery =
          isDataRow && row
            ? isRecoveryRequired(row, allLeftColumns, relanceSteps)
            : false;
        const missingDueDate =
          isDataRow && row ? rowMissingDueDate(row, allLeftColumns) : false;

        return (
          <div
            key={rowIndex}
            className={`flex ${TABLE_DATA_ROW_HEIGHT} items-center justify-center border-b ${TABLE_CELL_BORDER} px-2 ${
              recovery && isProgressionColumn
                ? "border-transparent bg-transparent"
                : dataRowSurfaceClass(rowIndex, paid)
            } ${isRelanceColumn ? styles.cell : ""}`}
          >
            {isDataRow && column.variant === "statut" ? (
              <button
                type="button"
                onClick={() =>
                  onStatusChange(rowIndex, status === "paye" ? "" : "paye")
                }
                className={`whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-bold tracking-wide transition-all ${
                  status === "paye"
                    ? "bg-emerald-500/45 text-emerald-50 shadow-[0_0_12px_rgba(52,211,153,0.35)] ring-1 ring-emerald-300/70"
                    : "bg-white/[0.06] text-brand-muted hover:bg-white/10 hover:text-white"
                }`}
              >
                PAYE {status === "paye" ? "!" : "?"}
              </button>
            ) : isDataRow && column.variant === "progression" ? (
              recovery ? null : (
                <RelanceProgressCell
                  paid={paid}
                  missingDueDate={missingDueDate}
                  progress={
                    missingDueDate
                      ? null
                      : buildRelanceProgressForRow(
                          row,
                          allLeftColumns,
                          relanceSteps,
                          filterDeliveriesForLigne(deliveries, row.id),
                          new Date(),
                          { simulateFromDates: simulateRelances },
                        )
                  }
                  onOpenTimeline={() => onOpenProgressTimeline?.(rowIndex)}
                />
              )
            ) : isDataRow && column.variant === "relance" ? (
              recovery ? null : (
                <RelanceScheduleCell
                  paid={paid}
                  missingDueDate={missingDueDate}
                  item={
                    missingDueDate
                      ? null
                      : buildRelanceDisplayForRow(
                          row,
                          allLeftColumns,
                          relanceSteps,
                          filterDeliveriesForLigne(deliveries, row.id),
                          new Date(),
                          { simulateFromDates: simulateRelances },
                        ).get(column.id) ?? null
                  }
                />
              )
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function TableColumn({
  column,
  headerClass,
  dateFormat,
  editable = false,
  draggable = false,
  bindItem,
  bindHandle,
  rows,
  totalRows,
  onRemove,
  getCellValue,
  getCellRawValue,
  onCellChange,
  showHeader = true,
  compressed = false,
  onToggleCompress,
}: TableColumnProps) {
  const itemProps = draggable && bindItem ? bindItem(column.id) : null;
  const handleProps = draggable && bindHandle ? bindHandle(column.id) : null;
  const cellsEditable = Boolean(onCellChange && getCellRawValue);

  const hasRemoveButton = editable && Boolean(onRemove);
  const hasCompressButton = editable && Boolean(onToggleCompress);
  const isDateColumn = isDateColumnLabel(column.label);
  const isAmountColumn = isAmountColumnLabel(column.label);

  const columnStyle = computeColumnStyle(
    column,
    rows,
    (rowIndex, columnId) => {
      const raw =
        getCellRawValue?.(rowIndex, columnId) ?? getCellValue(rowIndex, columnId);
      const display = isDateColumn
        ? formatDateForDisplay(raw, dateFormat)
        : isAmountColumn
          ? formatAmountForDisplay(raw)
          : raw;
      return display.length || 1;
    },
    {
      reserveRemoveButton: hasRemoveButton,
      reserveCompressButton: hasCompressButton,
      compressed,
    },
  );

  const headerLabel = compressed
    ? getCompressedColumnLabel(column.label)
    : column.label;

  return (
    <div
      data-drag-item-id={itemProps?.["data-drag-item-id"]}
      style={columnStyle}
      className={`shrink-0 border-r ${TABLE_BORDER} transition-[opacity,box-shadow] duration-150 ${itemProps?.className ?? ""}`}
    >
      {showHeader ? (
      <div
        className={`flex h-11 items-center gap-0 border-b ${TABLE_CELL_BORDER} px-0.5 ${headerClass}`}
      >
        <span
          {...(handleProps ?? {})}
          title={
            compressed && headerLabel !== column.label ? column.label : undefined
          }
          className={`${dashboardColumnHeaderClassName} min-w-0 flex-1 truncate text-center ${handleProps?.className ?? ""}`}
        >
          {headerLabel}
        </span>
        {hasCompressButton ? (
          <CompressColumnButton
            compressed={compressed}
            onClick={onToggleCompress!}
            columnLabel={column.label}
          />
        ) : null}
        {hasRemoveButton ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Masquer la colonne ${column.label}`}
            title="Masquer la colonne"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        ) : null}
      </div>
      ) : null}

      {Array.from({ length: totalRows }).map((_, rowIndex) => {
        const isDataRow = rowIndex < rows.length;
        const rowPaid = isDataRow ? isRowPaid(rows[rowIndex]) : false;
        const displayValue = isDataRow ? getCellValue(rowIndex, column.id) : "";
        const showCompressedValue =
          compressed && isDataRow && Boolean(displayValue?.trim());

        return (
          <div
            key={rowIndex}
            className={`flex ${TABLE_DATA_ROW_HEIGHT} items-center justify-center border-b ${TABLE_CELL_BORDER} px-0.5 text-center ${dataRowSurfaceClass(rowIndex, rowPaid)}`}
          >
            {showCompressedValue ? (
              <span
                className="w-full text-sm text-white/90"
                title={displayValue}
                aria-label={`${column.label}, ligne ${rowIndex + 1} : ${displayValue}`}
              >
                …
              </span>
            ) : isDataRow && cellsEditable ? (
              isDateColumn ? (
                <TableDateCell
                  value={getCellRawValue!(rowIndex, column.id)}
                  columnLabel={column.label}
                  dateFormat={dateFormat}
                  ariaLabel={`${column.label}, ligne ${rowIndex + 1}`}
                  onChange={(isoValue) =>
                    onCellChange!(rowIndex, column.id, isoValue)
                  }
                />
              ) : isAmountColumn ? (
                <TableAmountCell
                  value={getCellRawValue!(rowIndex, column.id)}
                  columnLabel={column.label}
                  ariaLabel={`${column.label}, ligne ${rowIndex + 1}`}
                  onChange={(storedValue) =>
                    onCellChange!(rowIndex, column.id, storedValue)
                  }
                />
              ) : (
              <input
                type={getColumnInputType(column)}
                value={getCellRawValue!(rowIndex, column.id)}
                onChange={(event) =>
                  onCellChange!(rowIndex, column.id, event.target.value)
                }
                name={getColumnFieldName(column.label)}
                autoComplete={getColumnAutocomplete(column.label)}
                aria-label={`${column.label}, ligne ${rowIndex + 1}`}
                className="w-full min-w-[3ch] bg-transparent text-center text-sm text-white/90 outline-none placeholder:text-brand-muted/40 focus:text-white"
                placeholder="—"
              />
              )
            ) : isDataRow ? (
              <span className="w-full whitespace-nowrap text-center text-sm text-white/90">
                {getCellValue(rowIndex, column.id) || (
                  <span className="text-brand-muted/40">—</span>
                )}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

type AddColumnButtonProps = {
  availableLabels: string[];
  onAdd: (label: string) => void;
  accentClass: string;
  totalRows: number;
};

function AddColumnButton({
  availableLabels,
  onAdd,
  accentClass,
  totalRows,
  showHeader = true,
}: AddColumnButtonProps & { showHeader?: boolean }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  useEffect(() => {
    if (!open || !buttonRef.current) return;

    function updatePosition() {
      if (!buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 160;
      const left = Math.min(
        Math.max(8, rect.left),
        window.innerWidth - menuWidth - 8,
      );

      setMenuPosition({
        top: rect.bottom + 8,
        left,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  function handlePreset(label: string) {
    onAdd(label);
    setOpen(false);
  }

  function handleCustom() {
    const label = window.prompt("Nom de la colonne :");
    if (label?.trim()) {
      onAdd(label.trim());
    }
    setOpen(false);
  }

  return (
    <div className={`relative min-w-[2.75rem] shrink-0 border-r ${TABLE_BORDER} last:border-r-0`}>
      {showHeader ? (
      <div
        className={`flex h-11 items-center justify-center border-b ${TABLE_CELL_BORDER} ${accentClass}`}
      >
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Ajouter une colonne"
          aria-expanded={open}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-lg text-white/50 transition-all hover:bg-white/10 hover:text-violet-200"
        >
          +
        </button>
      </div>
      ) : null}
      {Array.from({ length: totalRows }).map((_, index) => (
        <div
          key={index}
          className={`${TABLE_DATA_ROW_HEIGHT} border-b ${TABLE_CELL_BORDER} ${
            index % 2 === 0 ? TABLE_ROW_EVEN : TABLE_ROW_ODD
          }`}
        />
      ))}

      {open && menuPosition && typeof document !== "undefined"
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Fermer"
                className="fixed inset-0 z-[100] cursor-default bg-transparent"
                onClick={() => setOpen(false)}
              />
              <div
                role="menu"
                style={{ top: menuPosition.top, left: menuPosition.left }}
                className="fixed z-[101] min-w-[10rem] overflow-hidden rounded-xl border border-white/10 bg-brand-card py-1 shadow-xl shadow-black/50"
              >
                {availableLabels.map((label) => (
                  <button
                    key={label}
                    type="button"
                    role="menuitem"
                    onClick={() => handlePreset(label)}
                    className="block w-full px-3 py-2 text-left text-sm text-brand-muted transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {label}
                  </button>
                ))}
                {availableLabels.length > 0 ? (
                  <div className="my-1 border-t border-white/10" />
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleCustom}
                  className="block w-full px-3 py-2 text-left text-sm text-violet-300 transition-colors hover:bg-white/5"
                >
                  Autre…
                </button>
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}

type TableauGridProps = {
  tableName: string;
  onTableRename: (name: string) => void;
  leftColumns: ColumnDef[];
  hiddenLeftColumns: ColumnDef[];
  relanceSteps: RelanceStep[];
  deliveries: RelanceDeliveryRow[];
  rightColumns: RightColumnDef[];
  onLeftColumnsChange: (columns: ColumnDef[]) => void;
  onHideLeftColumn: (columnId: string) => void;
  onAddLeftColumn: (label: string) => void;
  rows: ClientRow[];
  onRowsChange: (rows: ClientRow[]) => void;
  onAddClient: () => void;
  addRowDisabled?: boolean;
  onDeleteRow: (rowIndex: number) => void;
  onConfigure: () => void;
  onRecoveryClick: (rowIndex: number) => void;
  simulateRelances?: boolean;
};

export function TableauGrid({
  tableName,
  onTableRename,
  leftColumns,
  hiddenLeftColumns,
  relanceSteps,
  deliveries,
  rightColumns,
  onLeftColumnsChange,
  onHideLeftColumn,
  onAddLeftColumn,
  rows,
  onRowsChange,
  onAddClient,
  addRowDisabled = false,
  onDeleteRow,
  onConfigure,
  onRecoveryClick,
  simulateRelances = false,
}: TableauGridProps) {
  const { dateFormat } = useUserPreferences();
  const [compressedColumnIds, setCompressedColumnIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [progressDrawerRowIndex, setProgressDrawerRowIndex] = useState<
    number | null
  >(null);
  const totalRows = Math.max(MIN_EMPTY_ROWS, rows.length + 1);
  const allLeftColumns = [...leftColumns, ...hiddenLeftColumns];
  const addableColumnLabels = getAddableColumnLabels(
    leftColumns,
    hiddenLeftColumns,
  );
  const progressionColumn = rightColumns.find(
    (column) => column.variant === "progression",
  );
  const statutColumns = rightColumns.filter((column) => column.variant === "statut");
  const hasRecoveryRows = rows.some((row) =>
    isRecoveryRequired(row, allLeftColumns, relanceSteps),
  );

  const handleReorder = useCallback(
    (next: ColumnDef[]) => onLeftColumnsChange(next),
    [onLeftColumnsChange],
  );

  const { bindItem: bindColumnItem, bindHandle: bindColumnHandle, DragPreview } =
    useHoldDragReorder({
      items: leftColumns,
      getId: (column) => column.id,
      getLabel: (id) =>
        leftColumns.find((column) => column.id === id)?.label ?? id,
      onReorder: handleReorder,
      axis: "x",
    });

  function hideLeftColumn(id: string) {
    setCompressedColumnIds((current) => {
      if (!current.has(id)) return current;
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    onHideLeftColumn(id);
  }

  function toggleColumnCompressed(columnId: string) {
    setCompressedColumnIds((current) => {
      const next = new Set(current);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  }

  function getCellRawValue(rowIndex: number, columnId: string) {
    return rows[rowIndex]?.values[columnId] ?? "";
  }

  function getCellValue(rowIndex: number, columnId: string) {
    const raw = getCellRawValue(rowIndex, columnId);
    const column = leftColumns.find((entry) => entry.id === columnId);
    if (column && isDateColumnLabel(column.label)) {
      return formatDateForDisplay(raw, dateFormat);
    }
    if (column && isAmountColumnLabel(column.label)) {
      return formatAmountForDisplay(raw);
    }
    return raw;
  }

  function handleCellChange(rowIndex: number, columnId: string, value: string) {
    onRowsChange(
      rows.map((row, index) =>
        index === rowIndex
          ? { ...row, values: { ...row.values, [columnId]: value } }
          : row,
      ),
    );
  }

  function handleStatusChange(rowIndex: number, status: PaymentStatus) {
    onRowsChange(
      rows.map((row, index) =>
        index === rowIndex
          ? { ...row, values: { ...row.values, [STATUT_COLUMN_ID]: status } }
          : row,
      ),
    );
  }

  function getClientLabel(rowIndex: number) {
    return (
      getRowFieldValue(rows[rowIndex], allLeftColumns, "Nom", "nom", "Client") ||
      `Client ${rowIndex + 1}`
    );
  }

  const progressDrawerRow =
    progressDrawerRowIndex !== null ? rows[progressDrawerRowIndex] : null;

  return (
    <>
      {DragPreview}
      <div className="w-max">
        <div className="grid w-max grid-cols-[auto_3px_auto]">
          <div
            className="col-start-1 row-start-1 mb-5 min-w-0 self-end overflow-hidden"
            data-tutorial="table-title"
          >
            <EditableTableTitle name={tableName} onRename={onTableRename} />
          </div>

          <div className="col-start-2 row-start-1 mb-5" aria-hidden />

          <div
            className="col-start-3 row-start-1 mb-5 flex flex-col items-center gap-1 self-end px-1"
            data-tutorial="configure-zone"
          >
            <button
              type="button"
              data-tutorial="configure-btn"
              onClick={onConfigure}
              className="group inline-flex items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              <span
                className={`${configureLabelClassName} whitespace-nowrap ${dashboardTitleGradientClassName}`}
              >
                Configurer
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200/75 shadow-sm shadow-fuchsia-950/20 transition-all group-hover:border-fuchsia-300/45 group-hover:bg-fuchsia-500/15 group-hover:text-fuchsia-100">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </span>
            </button>
            <span className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-fuchsia-300/40">
              Relances
            </span>
          </div>

          <div
            data-tutorial="table-left"
            className={`col-start-1 row-start-2 rounded-bl-2xl border border-t ${TABLE_BORDER} border-r-0 bg-brand-surface shadow-xl shadow-violet-950/25 ring-1 ring-white/[0.07]`}
          >
            <div className="flex shrink-0 bg-gradient-to-b from-violet-500/[0.12] to-brand-surface/80">
          <RowNumberColumn
            rows={rows}
            totalRows={totalRows}
            onAddClient={onAddClient}
            addRowDisabled={addRowDisabled}
          />
          {leftColumns.map((column) => (
            <TableColumn
              key={column.id}
              column={column}
              dateFormat={dateFormat}
              headerClass="bg-violet-500/22 text-violet-100"
              editable
              draggable
              bindItem={bindColumnItem}
              bindHandle={bindColumnHandle}
              rows={rows}
              totalRows={totalRows}
              compressed={compressedColumnIds.has(column.id)}
              onToggleCompress={() => toggleColumnCompressed(column.id)}
              onRemove={() => hideLeftColumn(column.id)}
              getCellValue={getCellValue}
              getCellRawValue={getCellRawValue}
              onCellChange={handleCellChange}
            />
          ))}
          <AddColumnButton
            availableLabels={addableColumnLabels}
            accentClass="bg-violet-500/16"
            totalRows={totalRows}
            onAdd={(label) => onAddLeftColumn(label)}
          />
              </div>
            </div>

          <div className="col-start-2 row-start-2 self-stretch">
            <TableSeparator />
          </div>

          <div className="col-start-3 row-start-2 flex items-start gap-1.5">
            <div className="relative min-w-0">
              <span
                aria-hidden
                className="pointer-events-none absolute -top-2.5 left-4 right-4 h-2.5 rounded-t-lg border border-b-0 border-fuchsia-400/20 bg-fuchsia-500/[0.04]"
              />
              <div
                data-tutorial="table-right"
                className={`relative overflow-hidden rounded-br-2xl border border-t ${TABLE_BORDER} border-fuchsia-400/15 bg-brand-surface shadow-xl shadow-fuchsia-950/20 ring-1 ring-fuchsia-400/10`}
              >
                <div className="h-px bg-gradient-to-r from-transparent via-fuchsia-400/30 to-transparent" />
                <div className="flex shrink-0 bg-gradient-to-b from-fuchsia-500/[0.11] to-brand-surface/80">
                  <div className="relative flex overflow-visible">
                    {progressionColumn ? (
                      <RightTableColumn
                        key={progressionColumn.id}
                        column={progressionColumn}
                        rows={rows}
                        totalRows={totalRows}
                        allLeftColumns={allLeftColumns}
                        relanceSteps={relanceSteps}
                        deliveries={deliveries}
                        simulateRelances={simulateRelances}
                        expandForRecovery={hasRecoveryRows}
                        onStatusChange={handleStatusChange}
                        onOpenProgressTimeline={setProgressDrawerRowIndex}
                      />
                    ) : null}
                    <RecoveryRowOverlays
                      rows={rows}
                      allLeftColumns={allLeftColumns}
                      relanceSteps={relanceSteps}
                      onRecoveryClick={onRecoveryClick}
                    />
                  </div>
                  <TableSeparator />
                  {statutColumns.map((column) => (
                    <RightTableColumn
                      key={column.id}
                      column={column}
                      rows={rows}
                      totalRows={totalRows}
                      allLeftColumns={allLeftColumns}
                      relanceSteps={relanceSteps}
                      deliveries={deliveries}
                      simulateRelances={simulateRelances}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            </div>

            <RowDeleteColumn
              rows={rows}
              totalRows={totalRows}
              onDeleteRow={onDeleteRow}
            />
          </div>
        </div>
      </div>

      <RelanceProgressDrawer
        open={progressDrawerRowIndex !== null}
        onClose={() => setProgressDrawerRowIndex(null)}
        clientLabel={
          progressDrawerRowIndex !== null
            ? getClientLabel(progressDrawerRowIndex)
            : ""
        }
        paid={progressDrawerRow ? isRowPaid(progressDrawerRow) : false}
        missingDueDate={
          progressDrawerRow
            ? rowMissingDueDate(progressDrawerRow, allLeftColumns)
            : false
        }
        progress={
          progressDrawerRow && !rowMissingDueDate(progressDrawerRow, allLeftColumns)
            ? buildRelanceProgressForRow(
                progressDrawerRow,
                allLeftColumns,
                relanceSteps,
                filterDeliveriesForLigne(deliveries, progressDrawerRow.id),
                new Date(),
                { simulateFromDates: simulateRelances },
              )
            : null
        }
      />
    </>
  );
}
