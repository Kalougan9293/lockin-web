"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useImportZone } from "@/contexts/ImportZoneContext";
import { useTutorial } from "@/contexts/TutorialContext";
import { useDashboardTables } from "@/hooks/useDashboardTables";
import { useDemoSession } from "@/hooks/useDemoSession";
import {
  canAddRowToTable,
  canAddTable,
  getImportRowCapacity,
} from "@/lib/dashboard/plan-limits";
import { filterDeliveriesForLigne, filterDeliveriesForTableau } from "@/lib/dashboard/relance-delivery-display";
import { classifyServerImportFiles } from "@/lib/import/process-server-import";
import { importFilesViaApi } from "@/lib/import/import-via-api";
import type { ImportReviewQueueItem } from "@/lib/import/process-server-import";
import type { DashboardInitialData } from "@/types/dashboard";
import {
  getRightColumns,
  hideLeftColumn,
  addOrRestoreLeftColumn,
  mergeClientValuesIntoTable,
} from "@/types/tableau";

import { ImportPrompt } from "./ImportPrompt";
import { TableauGrid } from "./TableauGrid";
import { DashboardTutorial } from "./tutorial/DashboardTutorial";

const AddClientModal = dynamic(
  () => import("./AddClientModal").then((mod) => mod.AddClientModal),
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

type DashboardWorkspaceProps = {
  impersonationActive?: boolean;
  initialDashboardData?: DashboardInitialData | null;
  isDemoWorkspace?: boolean;
};

export function DashboardWorkspace({
  impersonationActive = false,
  initialDashboardData = null,
  isDemoWorkspace = false,
}: DashboardWorkspaceProps) {
  const { requestTutorial } = useTutorial();
  const { importZoneVisible } = useImportZone();
  const { sessionKey: demoSessionKey } = useDemoSession();
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
    isDemoWorkspace,
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
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importQueue, setImportQueue] = useState<ImportReviewQueueItem[]>([]);
  const [importQueueIndex, setImportQueueIndex] = useState(0);
  const [importedCountSession, setImportedCountSession] = useState(0);

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

  useEffect(() => {
    if (!importSuccess) return;

    const timer = window.setTimeout(() => setImportSuccess(null), 10_000);
    return () => window.clearTimeout(timer);
  }, [importSuccess]);

  function clearImportQueue() {
    setImportQueue([]);
    setImportQueueIndex(0);
    setImportedCountSession(0);
  }

  function openAddClient(tableId: string) {
    if (!canAddRowToTable(tables, tableId)) return;
    clearImportQueue();
    setAddClientTargetId(tableId);
  }

  function handleAddClient(valuesByLabel: Record<string, string>): boolean {
    if (!addClientTargetId) return false;
    if (!canAddRowToTable(tables, addClientTargetId)) {
      setImportError("Limite de lignes atteinte — impossible d'ajouter ce client.");
      return importQueue.length > importQueueIndex + 1;
    }

    updateTable(addClientTargetId, (table) =>
      mergeClientValuesIntoTable(table, valuesByLabel),
    );

    const nextIndex = importQueueIndex + 1;
    const addedFromQueue = importQueue.length > 0;
    const totalAdded = addedFromQueue ? importedCountSession + 1 : 0;

    if (addedFromQueue && nextIndex < importQueue.length) {
      setImportedCountSession(totalAdded);
      setImportQueueIndex(nextIndex);
      return true;
    }

    if (addedFromQueue) {
      const count = totalAdded;
      setImportSuccess(
        `${count} ligne${count > 1 ? "s" : ""} ajoutée${count > 1 ? "s" : ""} au tableau.`,
      );
      clearImportQueue();
      setAddClientTargetId(null);
      return false;
    }

    setAddClientTargetId(null);
    return false;
  }

  function startImportReviewQueue(
    queue: ImportReviewQueueItem[],
    tableId: string,
  ) {
    if (queue.length === 0) return;

    const capacity = getImportRowCapacity(tables, tableId);
    const items = queue.slice(0, capacity);
    const skipped = queue.length - items.length;

    if (items.length === 0) {
      setImportError("Limite de lignes atteinte — import impossible.");
      return;
    }

    if (skipped > 0) {
      setImportError(
        `${skipped} facture${skipped > 1 ? "s" : ""} ignorée${skipped > 1 ? "s" : ""} — limite du forfait atteinte.`,
      );
    }

    setImportQueue(items);
    setImportQueueIndex(0);
    setImportedCountSession(0);
    setAddClientTargetId(tableId);
  }

  async function handleFilesSelected(files: File[]) {
    const tableId = activeTableId || tables[0]?.id;
    if (!tableId || files.length === 0) return;

    setImportError(null);
    setImportSuccess(null);

    if (getImportRowCapacity(tables, tableId) === 0) {
      setImportError("Limite de lignes atteinte — import impossible.");
      return;
    }

    const { pdfs, csvs, invalid } = classifyServerImportFiles(files);

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

    setImportLoading(true);
    try {
      const result = await importFilesViaApi(tableId, files);

      const warningText = result.errors.slice(0, 2).join(" ");
      if (warningText) {
        setImportError(warningText);
      }

      startImportReviewQueue(result.reviewQueue, tableId);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Import impossible. Réessayez.",
      );
    } finally {
      setImportLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTargetId) return;

    const targetId = deleteTargetId;
    const remaining = tables.filter((table) => table.id !== targetId);

    await removeTable(targetId);

    if (targetId === activeTableId && remaining[0]) {
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
      {isDemoWorkspace ? (
        <div className="mb-4 flex flex-col items-center gap-3">
          <p className="text-center text-sm font-semibold text-red-500">
            Mode démo : rien n&apos;est enregistré, aucun e-mail n&apos;est envoyé.
            Juste pour découvrir
          </p>
          <button
            type="button"
            onClick={requestTutorial}
            className="rounded-xl border-2 border-[#ff8c00] bg-[#ff6b00]/20 px-6 py-2.5 text-sm font-bold tracking-wide text-[#ffb347] shadow-[0_0_18px_rgba(255,140,0,0.55)] ring-1 ring-[#ff8c00]/70 transition hover:bg-[#ff6b00]/35 hover:text-[#ffd9a0] hover:shadow-[0_0_24px_rgba(255,140,0,0.7)]"
          >
            Tutoriel
          </button>
        </div>
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

      {importSuccess ? (
        <div
          role="status"
          className="relative mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2 pl-4 pr-10 text-sm text-emerald-100"
        >
          <p>{importSuccess}</p>
          <button
            type="button"
            onClick={() => setImportSuccess(null)}
            aria-label="Fermer le message de succès"
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-emerald-200/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </div>
      ) : null}

      {importZoneVisible ? (
        <ImportPrompt
          tables={tableSummaries}
          selectedTableId={activeTableId}
          onSelectedTableIdChange={setActiveTableId}
          onAddManual={() => openAddClient(activeTableId)}
          onFilesSelected={handleFilesSelected}
          onAddTable={() => void handleAddTable()}
          canAddTable={canCreateTable}
          isProcessing={importLoading}
          error={importError}
        addManualDisabled={!canAddRowToActiveTable}
        isDemoWorkspace={isDemoWorkspace}
      />
      ) : null}

      <section className={`w-full ${importZoneVisible ? "pt-4" : ""}`}>
        <div className="mx-auto w-max max-w-full">
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
              onDeleteTable={() => setDeleteTargetId(activeTable.id)}
              deleteTableDisabled={tables.length <= 1}
              onConfigure={() => setConfigTargetId(activeTable.id)}
              onRecoveryClick={(rowIndex) =>
                setRecoveryTarget({ tableId: activeTable.id, rowIndex })
              }
              simulateRelances={isDemoWorkspace}
            />
        </div>
      </section>

      {addClientTargetId !== null ? (
        <AddClientModal
          open
          onClose={() => {
            setAddClientTargetId(null);
            clearImportQueue();
          }}
          onSubmit={handleAddClient}
          importedFields={
            importQueue.length > 0
              ? importQueue[importQueueIndex]?.fields
              : undefined
          }
          sourceFileName={
            importQueue.length > 0
              ? importQueue[importQueueIndex]?.fileName
              : undefined
          }
          importProgress={
            importQueue.length > 0
              ? { current: importQueueIndex + 1, total: importQueue.length }
              : undefined
          }
          importAmbigu={importQueue[importQueueIndex]?.ambigu}
          importReviewNotes={importQueue[importQueueIndex]?.notes || undefined}
          key={
            importQueue.length > 0
              ? `import-${importQueueIndex}-${importQueue[importQueueIndex]?.fileName}`
              : "manual-add"
          }
        />
      ) : null}

      {configTable ? (
        <TableauConfigModal
          open
          initialSteps={configTable.relanceSteps}
          initialCcCreditor={configTable.ccCreditor}
          leftColumns={configTable.leftColumns}
          onClose={() => setConfigTargetId(null)}
          onSubmit={({ relanceSteps, ccCreditor }) => {
            updateTable(configTable.id, (table) => ({
              ...table,
              relanceSteps,
              ccCreditor,
            }));
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
          simulateRelances={isDemoWorkspace}
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

      <DashboardTutorial />
    </>
  );
}
