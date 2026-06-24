"use client";

import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDashboardTables } from "@/hooks/useDashboardTables";
import { useDemoSession } from "@/hooks/useDemoSession";
import {
  hasUsableInvoiceFields,
  parseInvoiceFields,
  type ParsedInvoiceFields,
} from "@/lib/invoice/parse-invoice-fields";
import { fredoka } from "@/lib/fonts/fredoka";
import {
  getRightColumns,
  hideLeftColumn,
  addOrRestoreLeftColumn,
  mergeClientValuesIntoTable,
} from "@/types/tableau";
import { filterDeliveriesForLigne, filterDeliveriesForTableau } from "@/lib/dashboard/relance-delivery-display";

import { AddClientModal } from "./AddClientModal";
import { ImportPrompt } from "./ImportPrompt";
import { InvoiceImportModal } from "./InvoiceImportModal";
import { TableauConfigModal } from "./TableauConfigModal";
import { TableauGrid } from "./TableauGrid";
import { RecoveryDrawer } from "./RecoveryDrawer";

type PendingImport = {
  tableId: string;
  fileName: string;
  fields: ParsedInvoiceFields;
};

type DashboardWorkspaceProps = {
  impersonationActive?: boolean;
};

export function DashboardWorkspace({
  impersonationActive = false,
}: DashboardWorkspaceProps) {
  const { fromUrl: isEphemeralDemo, sessionKey: demoSessionKey } = useDemoSession();
  const {
    tables,
    deliveries,
    loading,
    loadError,
    persistError,
    updateTable,
    addTableAfter,
    removeTable,
  } = useDashboardTables(impersonationActive, isEphemeralDemo, demoSessionKey);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteRowTarget, setDeleteRowTarget] = useState<{
    tableId: string;
    rowIndex: number;
  } | null>(null);
  const [addClientTargetId, setAddClientTargetId] = useState<string | null>(null);
  const [configTargetId, setConfigTargetId] = useState<string | null>(null);
  const [recoveryTarget, setRecoveryTarget] = useState<{
    tableId: string;
    rowIndex: number;
  } | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importTargetTableId, setImportTargetTableId] = useState("");

  const tableSummaries = tables.map((table) => ({
    id: table.id,
    name: table.name,
  }));

  useEffect(() => {
    if (!tables.length) return;
    if (tables.some((table) => table.id === importTargetTableId)) return;
    setImportTargetTableId(tables[0].id);
  }, [tables, importTargetTableId]);

  function openAddClient(tableId: string) {
    setAddClientTargetId(tableId);
  }

  function handleAddClient(valuesByLabel: Record<string, string>) {
    if (!addClientTargetId) return;

    updateTable(addClientTargetId, (table) =>
      mergeClientValuesIntoTable(table, valuesByLabel),
    );
  }

  async function handlePdfSelected(file: File) {
    const tableId = importTargetTableId || tables[0]?.id;
    if (!tableId) return;

    setImportError(null);

    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setImportError("Seuls les fichiers PDF sont acceptés.");
      return;
    }

    setImportLoading(true);
    try {
      const { extractTextFromPdf } = await import("@/lib/invoice/extract-pdf-text");
      const text = await extractTextFromPdf(file);
      if (!text.trim()) {
        setImportError(
          "Aucun texte lisible dans ce PDF. Les scans (images) ne sont pas encore supportés.",
        );
        return;
      }

      const fields = parseInvoiceFields(text);
      if (!hasUsableInvoiceFields(fields)) {
        setImportError(
          "Impossible de détecter des informations dans cette facture. Ajoutez la ligne manuellement.",
        );
        return;
      }

      setPendingImport({ tableId, fileName: file.name, fields });
    } catch {
      setImportError("Erreur lors de la lecture du PDF. Réessayez avec un autre fichier.");
    } finally {
      setImportLoading(false);
    }
  }

  function handleConfirmImport(valuesByLabel: Record<string, string>) {
    if (!pendingImport) return;

    updateTable(pendingImport.tableId, (table) =>
      mergeClientValuesIntoTable(table, valuesByLabel),
    );
    setPendingImport(null);
  }

  function confirmDelete() {
    if (!deleteTargetId) return;
    void removeTable(deleteTargetId);
    setDeleteTargetId(null);
  }

  function confirmDeleteRow() {
    if (!deleteRowTarget) return;

    updateTable(deleteRowTarget.tableId, (table) => ({
      ...table,
      rows: table.rows.filter((_, index) => index !== deleteRowTarget.rowIndex),
    }));
    setDeleteRowTarget(null);
  }

  const configTable = tables.find((table) => table.id === configTargetId);
  const recoveryTable = tables.find((table) => table.id === recoveryTarget?.tableId);
  const recoveryRow =
    recoveryTable && recoveryTarget
      ? recoveryTable.rows[recoveryTarget.rowIndex]
      : undefined;

  function handleImportTargetTableChange(tableId: string) {
    setImportTargetTableId(tableId);
    setPendingImport((current) =>
      current ? { ...current, tableId } : current,
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-brand-muted">
        Chargement de vos tableaux…
      </div>
    );
  }

  return (
    <>
      {isEphemeralDemo ? (
        <p className="mb-4 text-center text-sm font-semibold text-red-500">
          Mode démo : rien n&apos;est enregistré, les relances sont simulées
          selon les dates (aucun envoi réel).
        </p>
      ) : null}

      {loadError ? (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
          {loadError} — affichage en mode local.
        </p>
      ) : null}

      {persistError ? (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-100">
          {persistError}
        </p>
      ) : null}

      <ImportPrompt
        tables={tableSummaries}
        selectedTableId={importTargetTableId}
        onSelectedTableIdChange={setImportTargetTableId}
        onAddManual={() => importTargetTableId && openAddClient(importTargetTableId)}
        onPdfSelected={handlePdfSelected}
        isProcessing={importLoading}
        error={importError}
      />

      <div className="space-y-10">
        {tables.map((table, index) => (
          <section key={table.id} className="w-full">
            <div className="w-full overflow-x-auto">
              <div className="mx-auto w-max min-w-0 max-w-none">
                <TableauGrid
                  tableName={table.name}
                  onTableRename={(name) =>
                    updateTable(table.id, (current) => ({ ...current, name }))
                  }
                  leftColumns={table.leftColumns}
                  hiddenLeftColumns={table.hiddenLeftColumns}
                  relanceSteps={table.relanceSteps}
                  deliveries={filterDeliveriesForTableau(deliveries, table.id)}
                  rightColumns={getRightColumns(table.relanceSteps)}
                  onLeftColumnsChange={(leftColumns) =>
                    updateTable(table.id, (current) => ({ ...current, leftColumns }))
                  }
                  onHideLeftColumn={(columnId) =>
                    updateTable(table.id, (current) => hideLeftColumn(current, columnId))
                  }
                  onAddLeftColumn={(label) =>
                    updateTable(table.id, (current) => addOrRestoreLeftColumn(current, label))
                  }
                  rows={table.rows}
                  onRowsChange={(rows) =>
                    updateTable(table.id, (current) => ({ ...current, rows }))
                  }
                  onAddClient={() => openAddClient(table.id)}
                  onDeleteRow={(rowIndex) =>
                    setDeleteRowTarget({ tableId: table.id, rowIndex })
                  }
                  onConfigure={() => setConfigTargetId(table.id)}
                  onRecoveryClick={(rowIndex) =>
                    setRecoveryTarget({ tableId: table.id, rowIndex })
                  }
                  simulateRelances={isEphemeralDemo}
                />

                <div className="mt-4 flex min-h-10 w-full items-center justify-between">
                <button
                  type="button"
                  onClick={() => void addTableAfter(index, tables.length)}
                  aria-label="Ajouter un tableau"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-400/30 bg-gradient-to-br from-violet-500/25 to-fuchsia-500/20 shadow-sm shadow-violet-900/20 transition-transform hover:scale-105"
                >
                  <span
                    className={`${fredoka.className} text-2xl font-bold leading-none text-violet-100`}
                  >
                    +
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTargetId(table.id)}
                  aria-label="Effacer le tableau"
                  disabled={tables.length <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                >
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
            </div>
          </section>
        ))}
      </div>

      <AddClientModal
        open={addClientTargetId !== null}
        onClose={() => setAddClientTargetId(null)}
        onSubmit={handleAddClient}
      />

      <InvoiceImportModal
        open={pendingImport !== null}
        fileName={pendingImport?.fileName ?? ""}
        initialFields={pendingImport?.fields ?? {}}
        tables={tableSummaries}
        targetTableId={pendingImport?.tableId ?? importTargetTableId}
        onTargetTableIdChange={handleImportTargetTableChange}
        onClose={() => setPendingImport(null)}
        onSubmit={handleConfirmImport}
      />

      {configTable ? (
        <TableauConfigModal
          open
          initialSteps={configTable.relanceSteps}
          leftColumns={configTable.leftColumns}
          onClose={() => setConfigTargetId(null)}
          onSubmit={(relanceSteps) => {
            updateTable(configTable.id, (table) => ({ ...table, relanceSteps }));
            setConfigTargetId(null);
          }}
        />
      ) : null}

      {recoveryTable && recoveryRow ? (
        <RecoveryDrawer
          open
          row={recoveryRow}
          columns={[
            ...recoveryTable.leftColumns,
            ...recoveryTable.hiddenLeftColumns,
          ]}
          relanceSteps={recoveryTable.relanceSteps}
          deliveries={filterDeliveriesForLigne(deliveries, recoveryRow.id)}
          simulateRelances={isEphemeralDemo}
          onClose={() => setRecoveryTarget(null)}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Effacer le tableau"
        message="Êtes-vous sûr de vouloir effacer le tableau ?"
        confirmLabel="Effacer"
        cancelLabel="Annuler"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      <ConfirmDialog
        open={deleteRowTarget !== null}
        title="Effacer la ligne"
        message="Êtes-vous sûr de vouloir effacer cette ligne ?"
        confirmLabel="Effacer"
        cancelLabel="Annuler"
        onConfirm={confirmDeleteRow}
        onCancel={() => setDeleteRowTarget(null)}
      />
    </>
  );
}
