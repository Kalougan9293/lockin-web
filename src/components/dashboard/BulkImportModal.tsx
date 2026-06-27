"use client";

import { useEffect, useMemo, useState } from "react";

import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { getImportRowCapacity } from "@/lib/dashboard/plan-limits";
import {
  hasUsableInvoiceFields,
  type ParsedInvoiceFields,
} from "@/lib/invoice/parse-invoice-fields";
import { normalizeImportFields } from "@/lib/invoice/normalize-import-fields";
import type { BulkImportEntry } from "@/lib/invoice/process-import-files";
import { getColumnAutocomplete, getColumnFieldName } from "@/types/tableau";
import type { TableData, TableSummary } from "@/types/tableau";

import { TableTargetSelect } from "./TableTargetSelect";

const EDITABLE_FIELDS = [
  "Nom",
  "Mail",
  "Montant",
  "Échéance",
  "Date",
  "Référence",
  "Numéro",
] as const;

type BulkImportModalProps = {
  open: boolean;
  sourceLabel: string;
  entries: BulkImportEntry[];
  tables: TableSummary[];
  allTables: TableData[];
  targetTableId: string;
  onTargetTableIdChange: (tableId: string) => void;
  onAddTable?: () => void;
  canAddTable?: boolean;
  onClose: () => void;
  onSubmit: (
    tableId: string,
    rows: Record<string, string>[],
  ) => void;
};

export function BulkImportModal({
  open,
  sourceLabel,
  entries: initialEntries,
  tables,
  allTables,
  targetTableId,
  onTargetTableIdChange,
  onAddTable,
  canAddTable = true,
  onClose,
  onSubmit,
}: BulkImportModalProps) {
  const { dateFormat } = useUserPreferences();
  const [entries, setEntries] = useState<BulkImportEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const capacity = getImportRowCapacity(allTables, targetTableId);

  const activeEntries = useMemo(
    () => entries.filter((entry) => !entry.skipped && hasUsableInvoiceFields(entry.fields)),
    [entries],
  );

  const importCount = Math.min(activeEntries.length, capacity);

  useEffect(() => {
    if (!open) return;
    setEntries(initialEntries.map((entry) => ({ ...entry, fields: { ...entry.fields } })));
    setError(null);
  }, [open, initialEntries]);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  function updateField(entryId: string, label: string, value: string) {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === entryId
          ? { ...entry, fields: { ...entry.fields, [label]: value } }
          : entry,
      ),
    );
  }

  function removeEntry(entryId: string) {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === entryId ? { ...entry, skipped: true } : entry,
      ),
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (importCount === 0) {
      setError("Aucune ligne à importer. Complétez ou réactivez des lignes.");
      return;
    }

    const payloads = activeEntries
      .slice(0, capacity)
      .map((entry) => normalizeImportFields(entry.fields, dateFormat))
      .filter((payload) => Object.keys(payload).length > 0);

    if (payloads.length === 0) {
      setError("Corrigez au moins un champ par ligne.");
      return;
    }

    onSubmit(targetTableId, payloads);
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
        aria-labelledby="bulk-import-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-white/10 bg-brand-card shadow-2xl shadow-black/50"
      >
        <div className="border-b border-white/10 px-6 py-5">
          <h2 id="bulk-import-title" className="text-center text-xl font-bold">
            Vérifier l&apos;import
          </h2>
          <p className="mt-1 text-center text-sm text-brand-muted">{sourceLabel}</p>
          <p className="mt-2 text-center text-xs text-brand-muted">
            {importCount} ligne{importCount > 1 ? "s" : ""} seront ajoutée
            {importCount > 1 ? "s" : ""}
            {activeEntries.length > capacity
              ? ` (${activeEntries.length - capacity} ignorée${activeEntries.length - capacity > 1 ? "s" : ""})`
              : ""}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-6">
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-brand-muted">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Source</th>
                    {EDITABLE_FIELDS.map((field) => (
                      <th key={field} className="px-3 py-2.5 font-medium">
                        {field}
                      </th>
                    ))}
                    <th className="px-2 py-2.5" aria-label="Retirer" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) =>
                    entry.skipped ? null : (
                      <tr
                        key={entry.id}
                        className="border-t border-white/[0.06] hover:bg-white/[0.02]"
                      >
                        <td className="max-w-[8rem] truncate px-3 py-2 text-xs text-brand-muted">
                          {entry.source}
                        </td>
                        {EDITABLE_FIELDS.map((field) => (
                          <td key={field} className="px-2 py-1.5">
                            <input
                              type="text"
                              value={entry.fields[field] ?? ""}
                              name={getColumnFieldName(field)}
                              autoComplete={getColumnAutocomplete(field)}
                              onChange={(event) =>
                                updateField(entry.id, field, event.target.value)
                              }
                              className="w-full min-w-[5rem] rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-sm text-white outline-none focus:border-violet-300/40"
                            />
                          </td>
                        ))}
                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeEntry(entry.id)}
                            aria-label="Retirer cette ligne"
                            className="text-brand-muted transition-colors hover:text-red-300"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 border-t border-white/10 px-6 py-4">
            <TableTargetSelect
              id="bulk-import-target-table"
              tables={tables}
              value={targetTableId}
              onChange={onTargetTableIdChange}
              onAddTable={onAddTable}
              canAddTable={canAddTable}
            />

            {error ? (
              <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-brand-muted transition-colors hover:border-white/20 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={importCount === 0}
                className="btn-hover-grow flex-1 rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Importer {importCount > 0 ? importCount : ""} ligne
                {importCount > 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
