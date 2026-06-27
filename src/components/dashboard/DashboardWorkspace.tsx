"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDashboardTables } from "@/hooks/useDashboardTables";
import { useDemoSession } from "@/hooks/useDemoSession";
import { validatePdfFile } from "@/lib/dashboard/import-limits";
import {
  canAddRowToTable,
  canAddTable,
  getImportRowCapacity,
} from "@/lib/dashboard/plan-limits";
import { filterDeliveriesForLigne, filterDeliveriesForTableau } from "@/lib/dashboard/relance-delivery-display";
import type { ParsedInvoiceFields } from "@/lib/invoice/parse-invoice-fields";
import type { BulkImportEntry } from "@/lib/invoice/process-import-files";
import type { DashboardInitialData } from "@/types/dashboard";
import {
  getRightColumns,
  hideLeftColumn,
  addOrRestoreLeftColumn,
  mergeClientValuesIntoTable,
  mergeMultipleClientsIntoTable,
} from "@/types/tableau";

import { ImportPrompt } from "./ImportPrompt";
import { TableauGrid } from "./TableauGrid";

const AddClientModal = dynamic(
  () => import("./AddClientModal").then((mod) => mod.AddClientModal),
  { ssr: false },
);

const BulkImportModal = dynamic(
  () => import("./BulkImportModal").then((mod) => mod.BulkImportModal),
  { ssr: false },
);

const TableauConfigModal = dynamic(
  () => import("./TableauConfigModal").then((mod) => mod.TableauConfigModal),
  { ssr: false },
);

const RecoveryDrawer = dynamic(
  () => import("./RecoveryDrawer").then((mod) => mod.RecoveryDrawer),
  { ssr: false },
);

type PendingBulkImport = {
  tableId: string;
  sourceLabel: string;
  entries: BulkImportEntry[];
};

type PendingImport = {
  tableId: string;
  fileName: string;
  fields: ParsedInvoiceFields;
};

type DashboardWorkspaceProps = {
  impersonationActive?: boolean;
  initialDashboardData?: DashboardInitialData | null;
};

export function DashboardWorkspace({
  impersonationActive = false,
  initialDashboardData = null,
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
  } = useDashboardTables(
    impersonationActive,
    isEphemeralDemo,
    demoSessionKey,
    initialDashboardData,
  );

  const [activeTableId, setActiveTableId] = useState(
    () => initialDashboardData?.tables[0]?.id ?? "",
  );
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
  const [importQueue, setImportQueue] = useState<PendingImport[]>([]);
  const [pendingBulkImport, setPendingBulkImport] =
    useState<PendingBulkImport | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const tableSummaries = tables.map((table) => ({
    id: table.id,
    name: table.name,
  }));

  const activeTableIndex = tables.findIndex((table) => table.id === activeTableId);
  const activeTable = activeTableIndex >= 0 ? tables[activeTableIndex] : tables[0];
  const canCreateTable = canAddTable(tables);
  const canAddRowToActiveTable = activeTable
    ? canAddRowToTable(tables, activeTable.id)
    : false;

  useEffect(() => {
    if (!tables.length) return;
    if (tables.some((table) => table.id === activeTableId)) return;
    setActiveTableId(tables[0].id);
  }, [tables, activeTableId]);

  function openAddClient(tableId: string) {
    if (!canAddRowToTable(tables, tableId)) return;
    setAddClientTargetId(tableId);
  }

  function handleAddClient(valuesByLabel: Record<string, string>) {
    if (!addClientTargetId) return;
    if (!canAddRowToTable(tables, addClientTargetId)) return;

    updateTable(addClientTargetId, (table) =>
      mergeClientValuesIntoTable(table, valuesByLabel),
    );
  }

  async function handleFilesSelected(files: File[]) {
    const tableId = activeTableId || tables[0]?.id;
    if (!tableId || files.length === 0) return;

    setImportError(null);

    if (getImportRowCapacity(tables, tableId) === 0) return;

    const { classifyImportFiles, processImportFiles } = await import(
      "@/lib/invoice/process-import-files"
    );
    const { pdfs, csvs, invalid } = classifyImportFiles(files);

    if (invalid.length > 0) {
      setImportError("Formats acceptés : PDF et CSV.");
      return;
    }

    if (pdfs.length > 0 && csvs.length > 0) {
      setImportError("Importez soit un fichier CSV, soit des PDF — pas les deux.");
      return;
    }

    if (csvs.length > 1) {
      setImportError("Un seul fichier CSV à la fois.");
      return;
    }

    if (csvs.length === 1) {
      setImportLoading(true);
      try {
        const { entries, errors } = await processImportFiles(files);
        if (errors.length > 0) {
          setImportError(errors.slice(0, 3).join(" "));
        }
        if (entries.length === 0) return;

        setPendingBulkImport({
          tableId,
          sourceLabel: files[0]?.name ?? "Import CSV",
          entries,
        });
      } finally {
        setImportLoading(false);
      }
      return;
    }

    if (pdfs.length === 0) return;

    const { IMPORT_LIMITS } = await import("@/lib/dashboard/import-limits");
    if (pdfs.length > IMPORT_LIMITS.MAX_PDF_FILES) {
      setImportError(`Maximum ${IMPORT_LIMITS.MAX_PDF_FILES} PDF par import.`);
      return;
    }

    setImportLoading(true);
    try {
      const [{ extractTextFromPdf }, { parseInvoiceFields, hasUsableInvoiceFields }] =
        await Promise.all([
          import("@/lib/invoice/extract-pdf-text"),
          import("@/lib/invoice/parse-invoice-fields"),
        ]);

      const queue: PendingImport[] = [];
      const errors: string[] = [];

      for (const file of pdfs) {
        if (!canAddRowToTable(tables, tableId)) {
          errors.push("Limite de lignes atteinte — import interrompu.");
          break;
        }

        const validationError = validatePdfFile(file);
        if (validationError) {
          errors.push(`${file.name} : ${validationError}`);
          continue;
        }

        try {
          const text = await extractTextFromPdf(file);
          if (!text.trim()) {
            errors.push(
              `${file.name} : aucun texte lisible (scan non supporté).`,
            );
            continue;
          }

          const fields = parseInvoiceFields(text);
          if (!hasUsableInvoiceFields(fields)) {
            errors.push(`${file.name} : informations non détectées.`);
            continue;
          }

          queue.push({ tableId, fileName: file.name, fields });
        } catch {
          errors.push(`${file.name} : lecture impossible.`);
        }
      }

      if (errors.length > 0) {
        setImportError(errors.slice(0, 3).join(" "));
      }

      if (queue.length > 0) {
        setImportQueue(queue);
      }
    } catch {
      setImportError("Erreur lors de la lecture des PDF. Réessayez.");
    } finally {
      setImportLoading(false);
    }
  }

  function closeCurrentImport() {
    setImportQueue((queue) => queue.slice(1));
  }

  function formatImportFileLabel(fileName: string, queueLength: number) {
    if (queueLength <= 1) return fileName;
    const remaining = queueLength - 1;
    return `${fileName} — encore ${remaining} facture${remaining > 1 ? "s" : ""}`;
  }

  function handleConfirmImport(valuesByLabel: Record<string, string>) {
    const current = importQueue[0];
    if (!current) return;

    if (!canAddRowToTable(tables, current.tableId)) {
      closeCurrentImport();
      return;
    }

    updateTable(current.tableId, (table) =>
      mergeClientValuesIntoTable(table, valuesByLabel),
    );
    closeCurrentImport();
  }

  function handleConfirmBulkImport(
    tableId: string,
    rows: Record<string, string>[],
  ) {
    if (rows.length === 0) return;

    updateTable(tableId, (table) => mergeMultipleClientsIntoTable(table, rows));
    setPendingBulkImport(null);
  }

  function confirmDelete() {
    if (!deleteTargetId) return;

    const remaining = tables.filter((table) => table.id !== deleteTargetId);
    void removeTable(deleteTargetId);

    if (deleteTargetId === activeTableId && remaining[0]) {
      setActiveTableId(remaining[0].id);
    }

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

  async function handleAddTable() {
    if (!canCreateTable || !activeTable) return;

    const newTableId = await addTableAfter(activeTableIndex, tables.length);
    if (newTableId) {
      setActiveTableId(newTableId);
    }
  }

  function handleActiveTableChange(tableId: string) {
    setActiveTableId(tableId);
    setImportQueue((queue) =>
      queue.length > 0 ? [{ ...queue[0], tableId }, ...queue.slice(1)] : queue,
    );
  }

  const configTable = tables.find((table) => table.id === configTargetId);
  const recoveryTable = tables.find((table) => table.id === recoveryTarget?.tableId);
  const recoveryRow =
    recoveryTable && recoveryTarget
      ? recoveryTable.rows[recoveryTarget.rowIndex]
      : undefined;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-brand-muted">
        Chargement de vos tableaux…
      </div>
    );
  }

  if (!activeTable) {
    return null;
  }

  return (
    <>
      {isEphemeralDemo ? (
        <p className="mb-4 text-center text-sm font-semibold text-red-500">
          Mode démo : rien n&apos;est enregistré, aucun e-mail n&apos;est
          envoyé. Créez un compte pour envoyer des relances.
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
        selectedTableId={activeTableId}
        onSelectedTableIdChange={handleActiveTableChange}
        onAddManual={() => openAddClient(activeTableId)}
        onFilesSelected={handleFilesSelected}
        onAddTable={() => void handleAddTable()}
        canAddTable={canCreateTable}
        isProcessing={importLoading}
        error={importError}
        addManualDisabled={!canAddRowToActiveTable}
      />

      <section className="w-full">
        <div className="w-full overflow-x-auto">
          <div className="mx-auto w-max min-w-0 max-w-none">
            <TableauGrid
              tableName={activeTable.name}
              onTableRename={(name) =>
                updateTable(activeTable.id, (current) => ({ ...current, name }))
              }
              leftColumns={activeTable.leftColumns}
              hiddenLeftColumns={activeTable.hiddenLeftColumns}
              relanceSteps={activeTable.relanceSteps}
              deliveries={filterDeliveriesForTableau(deliveries, activeTable.id)}
              rightColumns={getRightColumns(activeTable.relanceSteps)}
              onLeftColumnsChange={(leftColumns) =>
                updateTable(activeTable.id, (current) => ({ ...current, leftColumns }))
              }
              onHideLeftColumn={(columnId) =>
                updateTable(activeTable.id, (current) =>
                  hideLeftColumn(current, columnId),
                )
              }
              onAddLeftColumn={(label) =>
                updateTable(activeTable.id, (current) =>
                  addOrRestoreLeftColumn(current, label),
                )
              }
              rows={activeTable.rows}
              onRowsChange={(rows) =>
                updateTable(activeTable.id, (current) => ({ ...current, rows }))
              }
              onAddClient={() => openAddClient(activeTable.id)}
              addRowDisabled={!canAddRowToActiveTable}
              onDeleteRow={(rowIndex) =>
                setDeleteRowTarget({ tableId: activeTable.id, rowIndex })
              }
              onConfigure={() => setConfigTargetId(activeTable.id)}
              onRecoveryClick={(rowIndex) =>
                setRecoveryTarget({ tableId: activeTable.id, rowIndex })
              }
              simulateRelances={isEphemeralDemo}
            />

            <div className="mt-4 flex min-h-10 w-full items-center justify-end">
              <button
                type="button"
                onClick={() => setDeleteTargetId(activeTable.id)}
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

      {addClientTargetId !== null ? (
        <AddClientModal
          open
          onClose={() => setAddClientTargetId(null)}
          onSubmit={handleAddClient}
        />
      ) : null}

      {importQueue[0] ? (
        <AddClientModal
          open
          importedFields={importQueue[0].fields}
          sourceFileName={formatImportFileLabel(
            importQueue[0].fileName,
            importQueue.length,
          )}
          targetTable={{
            tables: tableSummaries,
            value: importQueue[0].tableId,
            onChange: handleActiveTableChange,
            onAddTable: () => void handleAddTable(),
            canAddTable: canCreateTable,
          }}
          onClose={closeCurrentImport}
          onSubmit={handleConfirmImport}
        />
      ) : null}

      {pendingBulkImport ? (
        <BulkImportModal
          open
          sourceLabel={pendingBulkImport.sourceLabel}
          entries={pendingBulkImport.entries}
          tables={tableSummaries}
          allTables={tables}
          targetTableId={pendingBulkImport.tableId}
          onTargetTableIdChange={(tableId) =>
            setPendingBulkImport((current) =>
              current ? { ...current, tableId } : current,
            )
          }
          onAddTable={() => void handleAddTable()}
          canAddTable={canCreateTable}
          onClose={() => setPendingBulkImport(null)}
          onSubmit={handleConfirmBulkImport}
        />
      ) : null}

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
