"use client";

import { useEffect, useMemo, useState } from "react";

import { AuthField } from "@/components/auth/AuthField";
import { PreferenceAmountField } from "@/components/dashboard/PreferenceAmountField";
import { PreferenceDateField } from "@/components/dashboard/PreferenceDateField";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import {
  isAmountColumnLabel,
  parseAmountToStorage,
} from "@/lib/preferences/currency-format";
import {
  isDateColumnLabel,
  parseDateInputToIso,
} from "@/lib/preferences/date-format";
import type { ParsedInvoiceFields } from "@/lib/invoice/parse-invoice-fields";
import { getColumnInputType } from "@/types/tableau";
import type { TableSummary } from "@/types/tableau";

import { TableTargetSelect } from "./TableTargetSelect";

const FIELD_ORDER = [
  "Nom",
  "Mail",
  "Date",
  "Montant",
  "Échéance",
  "Référence",
  "Numéro",
  "Info",
] as const;

const CORE_FIELDS = ["Nom", "Mail", "Date", "Montant"] as const;

type InvoiceImportModalProps = {
  open: boolean;
  fileName: string;
  initialFields: ParsedInvoiceFields;
  tables: TableSummary[];
  targetTableId: string;
  onTargetTableIdChange: (tableId: string) => void;
  onClose: () => void;
  onSubmit: (valuesByLabel: Record<string, string>) => void;
};

export function InvoiceImportModal({
  open,
  fileName,
  initialFields,
  tables,
  targetTableId,
  onTargetTableIdChange,
  onClose,
  onSubmit,
}: InvoiceImportModalProps) {
  const { dateFormat } = useUserPreferences();
  const [values, setValues] = useState<ParsedInvoiceFields>({});
  const [error, setError] = useState<string | null>(null);

  const visibleFields = useMemo(() => {
    const extras = FIELD_ORDER.filter(
      (label) =>
        !CORE_FIELDS.includes(label as (typeof CORE_FIELDS)[number]) &&
        Boolean(initialFields[label]?.trim()),
    );
    return [...CORE_FIELDS, ...extras];
  }, [initialFields]);

  useEffect(() => {
    if (!open) return;
    setValues({ ...initialFields });
    setError(null);
  }, [open, initialFields]);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const payload: Record<string, string> = {};
    for (const label of visibleFields) {
      const raw = values[label]?.trim() ?? "";
      if (!raw) continue;
      payload[label] = isDateColumnLabel(label)
        ? parseDateInputToIso(raw, dateFormat)
        : isAmountColumnLabel(label)
          ? parseAmountToStorage(raw)
          : raw;
    }

    if (Object.keys(payload).length === 0) {
      setError("Corrigez ou complétez au moins un champ.");
      return;
    }

    onSubmit(payload);
    onClose();
  }

  if (!open) return null;

  return (
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
        aria-labelledby="invoice-import-title"
        className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-brand-card p-6 shadow-2xl shadow-black/50"
      >
        <h2 id="invoice-import-title" className="text-center text-xl font-bold">
          Importer la facture
        </h2>
        <p className="mt-1 truncate text-center text-sm text-brand-muted">
          {fileName}
        </p>
        <p className="mt-2 text-center text-xs text-brand-muted">
          Vérifiez les informations détectées avant d&apos;ajouter la ligne.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          {visibleFields.map((label) => (
            <div key={label}>
              {isDateColumnLabel(label) ? (
                <div className="space-y-2">
                  <label
                    htmlFor={`invoice-${label}`}
                    className="text-sm font-medium text-white"
                  >
                    {label}
                  </label>
                  <PreferenceDateField
                    id={`invoice-${label}`}
                    name={label}
                    value={values[label] ?? ""}
                    dateFormat={dateFormat}
                    onChange={(isoValue) =>
                      setValues((current) => ({ ...current, [label]: isoValue }))
                    }
                  />
                </div>
              ) : isAmountColumnLabel(label) ? (
                <div className="space-y-2">
                  <label
                    htmlFor={`invoice-${label}`}
                    className="text-sm font-medium text-white"
                  >
                    {label}
                  </label>
                  <PreferenceAmountField
                    id={`invoice-${label}`}
                    name={label}
                    value={values[label] ?? ""}
                    onChange={(storedValue) =>
                      setValues((current) => ({ ...current, [label]: storedValue }))
                    }
                  />
                </div>
              ) : (
                <AuthField
                  id={`invoice-${label}`}
                  label={label}
                  name={label}
                  type={getColumnInputType({ id: label, label })}
                  value={values[label] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [label]: event.target.value,
                    }))
                  }
                />
              )}
            </div>
          ))}

          <TableTargetSelect
            id="invoice-import-target-table"
            tables={tables}
            value={targetTableId}
            onChange={onTargetTableIdChange}
          />

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
              Ajouter au tableau
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
