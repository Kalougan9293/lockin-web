"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AuthField } from "@/components/auth/AuthField";
import { PreferenceAmountField } from "@/components/dashboard/PreferenceAmountField";
import { PreferenceDateField } from "@/components/dashboard/PreferenceDateField";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { useHoldDragReorder } from "@/hooks/useHoldDragReorder";
import { normalizeImportFields } from "@/lib/invoice/normalize-import-fields";
import { isAmountColumnLabel } from "@/lib/preferences/currency-format";
import { isDateColumnLabel } from "@/lib/preferences/date-format";
import {
  DEFAULT_MODAL_FIELDS,
  MODAL_FIELD_POOL,
  getColumnAutocomplete,
  getColumnFieldName,
  getColumnInputType,
  resolveActiveFieldsFromImport,
  type TableSummary,
} from "@/types/tableau";

import { TableTargetSelect } from "./TableTargetSelect";

type AddClientModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (valuesByLabel: Record<string, string>) => void;
  /** Préremplissage après import PDF — seuls les champs détectés sont ouverts. */
  importedFields?: Record<string, string>;
  sourceFileName?: string;
  targetTable?: {
    tables: TableSummary[];
    value: string;
    onChange: (tableId: string) => void;
    onAddTable?: () => void;
    canAddTable?: boolean;
  };
};

const BUBBLE_COLORS: Record<string, { on: string; off: string }> = {
  Nom: {
    on: "border-violet-400/70 bg-violet-500/40 text-violet-50 shadow-md shadow-violet-900/25",
    off: "border-violet-400/30 bg-violet-500/15 text-violet-200 hover:bg-violet-500/25 hover:border-violet-400/50",
  },
  Mail: {
    on: "border-indigo-400/70 bg-indigo-500/40 text-indigo-50 shadow-md shadow-indigo-900/25",
    off: "border-indigo-400/30 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/25 hover:border-indigo-400/50",
  },
  Date: {
    on: "border-fuchsia-400/70 bg-fuchsia-500/40 text-fuchsia-50 shadow-md shadow-fuchsia-900/25",
    off: "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-200 hover:bg-fuchsia-500/25 hover:border-fuchsia-400/50",
  },
  Montant: {
    on: "border-emerald-400/70 bg-emerald-500/40 text-emerald-50 shadow-md shadow-emerald-900/25",
    off: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 hover:border-emerald-400/50",
  },
  Échéance: {
    on: "border-amber-400/70 bg-amber-500/40 text-amber-50 shadow-md shadow-amber-900/25",
    off: "border-amber-400/30 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 hover:border-amber-400/50",
  },
  Numéro: {
    on: "border-sky-400/70 bg-sky-500/40 text-sky-50 shadow-md shadow-sky-900/25",
    off: "border-sky-400/30 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25 hover:border-sky-400/50",
  },
  Info: {
    on: "border-rose-400/70 bg-rose-500/40 text-rose-50 shadow-md shadow-rose-900/25",
    off: "border-rose-400/30 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25 hover:border-rose-400/50",
  },
  Référence: {
    on: "border-orange-400/70 bg-orange-500/40 text-orange-50 shadow-md shadow-orange-900/25",
    off: "border-orange-400/30 bg-orange-500/15 text-orange-200 hover:bg-orange-500/25 hover:border-orange-400/50",
  },
  Autres: {
    on: "border-white/30 bg-white/15 text-white shadow-md shadow-black/20",
    off: "border-white/15 bg-white/[0.06] text-brand-muted hover:bg-white/10 hover:text-white hover:border-white/25",
  },
};

const CUSTOM_BUBBLE_COLORS = {
  on: "border-teal-400/70 bg-teal-500/40 text-teal-50 shadow-md shadow-teal-900/25",
  off: "border-teal-400/30 bg-teal-500/15 text-teal-200 hover:bg-teal-500/25 hover:border-teal-400/50",
};

function getBubbleClasses(label: string) {
  const palette =
    BUBBLE_COLORS[label] ??
    (label === "Autres" ? BUBBLE_COLORS.Autres : CUSTOM_BUBBLE_COLORS);

  return `rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-[1.03] ${palette.off}`;
}

export function AddClientModal({
  open,
  onClose,
  onSubmit,
  importedFields,
  sourceFileName,
  targetTable,
}: AddClientModalProps) {
  const { dateFormat } = useUserPreferences();
  const isImportMode = Boolean(importedFields);
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeFields, setActiveFields] = useState<string[]>([...DEFAULT_MODAL_FIELDS]);
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const inactiveBubbles = useMemo(() => {
    const pool = [...MODAL_FIELD_POOL, ...customFields].filter(
      (label, index, labels) =>
        labels.findIndex(
          (entry) => entry.toLowerCase() === label.toLowerCase(),
        ) === index,
    ).filter((label) => !activeFields.includes(label));

    return [...pool, "Autres"];
  }, [activeFields, customFields]);

  const handleFieldReorder = useCallback((next: string[]) => {
    setActiveFields(next);
  }, []);

  const { bindItem: bindFieldItem, bindHandle: bindFieldHandle, DragPreview } =
    useHoldDragReorder({
      items: activeFields,
      getId: (label) => label,
      getLabel: (id) => id,
      onReorder: handleFieldReorder,
      axis: "y",
    });

  useEffect(() => {
    if (!open) return;

    if (importedFields) {
      const detected = resolveActiveFieldsFromImport(importedFields);
      const customs = detected.filter(
        (label) =>
          !MODAL_FIELD_POOL.some(
            (entry) => entry.toLowerCase() === label.toLowerCase(),
          ),
      );

      setValues({ ...importedFields });
      setActiveFields(
        detected.length > 0 ? detected : [...DEFAULT_MODAL_FIELDS],
      );
      setCustomFields(customs);
    } else {
      setValues({});
      setActiveFields([...DEFAULT_MODAL_FIELDS]);
      setCustomFields([]);
    }

    setError(null);
  }, [open, importedFields]);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  function deactivateField(label: string) {
    setActiveFields((current) => current.filter((entry) => entry !== label));
  }

  function openFieldFromBubble(label: string) {
    if (label === "Autres") {
      const name = window.prompt("Nom du champ :");
      if (!name?.trim()) return;

      const trimmed = name.trim();
      const existsInPool = [...MODAL_FIELD_POOL, ...customFields].some(
        (entry) => entry.toLowerCase() === trimmed.toLowerCase(),
      );

      if (!existsInPool) {
        setCustomFields((current) => [...current, trimmed]);
      }

      setActiveFields((current) =>
        current.includes(trimmed) ? current : [...current, trimmed],
      );
      return;
    }

    setActiveFields((current) =>
      current.includes(label) ? current : [...current, label],
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const payloadInput: Record<string, string> = {};
    for (const label of activeFields) {
      payloadInput[label] = values[label] ?? "";
    }

    const payload = normalizeImportFields(payloadInput, dateFormat);

    if (Object.keys(payload).length === 0) {
      setError(
        isImportMode
          ? "Corrigez ou complétez au moins un champ."
          : "Activez au moins un champ et renseignez une valeur.",
      );
      return;
    }

    const hasEcheanceField = activeFields.some(
      (label) => label.toLowerCase() === "échéance" || label.toLowerCase() === "echeance",
    );
    const echeanceValue =
      payload.Échéance?.trim() ??
      payloadInput.Échéance?.trim() ??
      payloadInput.Echeance?.trim() ??
      "";

    if (hasEcheanceField && !echeanceValue) {
      setError("Renseignez la date d'échéance pour planifier les relances.");
      return;
    }

    onSubmit(payload);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      {DragPreview}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          type="button"
          aria-label="Fermer"
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-client-title"
          className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-brand-card p-6 shadow-2xl shadow-black/50"
        >
          <h2 id="add-client-title" className="text-center text-xl font-bold">
            Ajouter un client
          </h2>

          {sourceFileName ? (
            <p className="mt-1 truncate text-center text-sm text-brand-muted">
              {sourceFileName}
            </p>
          ) : null}

          {isImportMode ? (
            <p className="mt-3 text-center text-sm font-semibold text-red-500">
              Vérifier bien les informations
            </p>
          ) : null}

          {inactiveBubbles.length > 0 ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {inactiveBubbles.map((bubble) => (
                <button
                  key={bubble}
                  type="button"
                  onClick={() => openFieldFromBubble(bubble)}
                  className={getBubbleClasses(bubble)}
                >
                  {bubble}
                </button>
              ))}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" autoComplete="off">
            {activeFields.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-brand-muted">
                Aucun champ actif — choisissez une bulle ci-dessus.
              </p>
            ) : null}

            {activeFields.map((label) => {
              const itemProps = bindFieldItem(label);
              const handleProps = bindFieldHandle(label);

              return (
                <div
                  key={label}
                  data-drag-item-id={itemProps["data-drag-item-id"]}
                  className={`space-y-2 rounded-xl transition-[opacity,box-shadow] duration-150 ${itemProps.className}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      {...handleProps}
                      className={`text-sm font-medium text-white ${handleProps.className}`}
                    >
                      {label}
                    </span>
                    <button
                      type="button"
                      onClick={() => deactivateField(label)}
                      aria-label={`Replier le champ ${label} en bulle`}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs text-brand-muted transition-colors hover:bg-red-500/15 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                  {isDateColumnLabel(label) ? (
                    <PreferenceDateField
                      id={`field-${label}`}
                      name={label}
                      value={values[label] ?? ""}
                      dateFormat={dateFormat}
                      onChange={(isoValue) =>
                        setValues((prev) => ({
                          ...prev,
                          [label]: isoValue,
                        }))
                      }
                    />
                  ) : isAmountColumnLabel(label) ? (
                    <PreferenceAmountField
                      id={`field-${label}`}
                      name={label}
                      value={values[label] ?? ""}
                      onChange={(storedValue) =>
                        setValues((prev) => ({
                          ...prev,
                          [label]: storedValue,
                        }))
                      }
                    />
                  ) : (
                    <AuthField
                      id={`field-${label}`}
                      label=""
                      name={getColumnFieldName(label)}
                      type={getColumnInputType({ id: label, label })}
                      autoComplete={getColumnAutocomplete(label)}
                      value={values[label] ?? ""}
                      onChange={(event) =>
                        setValues((prev) => ({
                          ...prev,
                          [label]: event.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              );
            })}

            {targetTable ? (
              <TableTargetSelect
                id="add-client-target-table"
                tables={targetTable.tables}
                value={targetTable.value}
                onChange={targetTable.onChange}
                onAddTable={targetTable.onAddTable}
                canAddTable={targetTable.canAddTable}
              />
            ) : null}

            {error ? (
              <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-brand-muted transition-colors hover:border-white/20 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-hover-grow flex-1 rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white"
              >
                Ajouter
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
