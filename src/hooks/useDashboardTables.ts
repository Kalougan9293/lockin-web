"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchRelanceDeliveriesForTableaux } from "@/lib/dashboard/fetch-relance-deliveries";
import {
  cancelCancellableDeliveriesForLigne,
  cancelCancellableDeliveriesForTableau,
  markDeliveriesCancelledLocally,
  markDeliveriesCancelledLocallyForTableau,
} from "@/lib/dashboard/cancel-queued-deliveries";
import { didDueDateChange } from "@/lib/dashboard/relance-schedule";
import {
  deleteLigne,
  deleteTable,
  fetchAllTables,
  getAddedRows,
  getRemovedRows,
  getUpdatedRows,
  insertFullTable,
  isPaymentStatusOnlyChange,
  insertLigne,
  relanceStepsChanged,
  syncRelanceSteps,
  tableMetaChanged,
  updateLigne,
  updateTableMeta,
} from "@/lib/dashboard/tableau-db";
import { createClient } from "@/lib/supabase/client";
import {
  canAddTable,
  clampRowsForTable,
  isTableRowsWithinLimits,
} from "@/lib/dashboard/plan-limits";
import type { RelanceDeliveryRow } from "@/types/database";
import type { ClientRow, ColumnDef, TableData } from "@/types/tableau";
import { createTableData, ensureDefaultRelanceSteps, isRowPaid } from "@/types/tableau";

import type { DashboardInitialData } from "@/types/dashboard";

const ROW_PERSIST_DEBOUNCE_MS = 450;

async function apiFetchDashboard(): Promise<{
  tables: TableData[];
  deliveries: RelanceDeliveryRow[];
}> {
  const response = await fetch("/api/dashboard/tableaux");
  const data = (await response.json()) as {
    tables?: TableData[];
    deliveries?: RelanceDeliveryRow[];
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Impossible de charger les tableaux.");
  }
  return {
    tables: data.tables ?? [],
    deliveries: data.deliveries ?? [],
  };
}

async function apiPersistTableDiff(prev: TableData, next: TableData) {
  const response = await fetch("/api/dashboard/tableaux", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prev, next }),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Impossible d'enregistrer le tableau.");
  }
}

async function apiPersistRow(row: ClientRow, previous?: ClientRow) {
  const response = await fetch("/api/dashboard/tableaux", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ row, previous }),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Impossible d'enregistrer la ligne.");
  }
}

async function apiInsertTable(table: TableData) {
  const response = await fetch("/api/dashboard/tableaux", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table }),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Impossible de créer le tableau.");
  }
}

async function apiDeleteTable(tableId: string) {
  const response = await fetch("/api/dashboard/tableaux", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "deleteTable", tableId }),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Impossible de supprimer le tableau.");
  }
}

export function useDashboardTables(
  impersonationMode = false,
  demoMode = false,
  demoSessionKey = "default",
  initialData: DashboardInitialData | null = null,
) {
  const hasInitialData = initialData !== null;
  const [tables, setTables] = useState<TableData[]>(() => {
    const source = initialData?.tables ?? (demoMode ? [createTableData()] : []);
    return source.map(ensureDefaultRelanceSteps);
  });
  const [deliveries, setDeliveries] = useState<RelanceDeliveryRow[]>(
    () => initialData?.deliveries ?? [],
  );
  const [loading, setLoading] = useState(() => !hasInitialData && !demoMode);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);

  const persistEnabledRef = useRef(hasInitialData);
  const useApiRef = useRef(impersonationMode);
  const rowTimersRef = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );
  const rowPersistSnapshotsRef = useRef(new Map<string, ClientRow>());
  const rowPersistColumnsRef = useRef(new Map<string, ColumnDef[]>());
  const supabaseRef = useRef(createClient());

  useApiRef.current = impersonationMode;

  const reportPersistError = useCallback((message: string) => {
    setPersistError(message);
    console.error("[dashboard persist]", message);
  }, []);

  const persistRowNow = useCallback(
    async (row: ClientRow, previous?: ClientRow, columns?: ColumnDef[]) => {
      if (!persistEnabledRef.current) return;

      try {
        if (useApiRef.current) {
          await apiPersistRow(row, previous);
          if (
            (previous && didDueDateChange(previous, row, columns)) ||
            (isRowPaid(row) && !(previous && isRowPaid(previous)))
          ) {
            setDeliveries((current) =>
              markDeliveriesCancelledLocally(current, row.id),
            );
          }
        } else {
          const { dueDateChanged, becamePaid } = await updateLigne(
            supabaseRef.current,
            row,
            previous,
            columns,
          );
          if (dueDateChanged || becamePaid) {
            setDeliveries((current) =>
              markDeliveriesCancelledLocally(current, row.id),
            );
          }
        }
      } catch (error) {
        reportPersistError(
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer la ligne.",
        );
      }
    },
    [reportPersistError],
  );

  const scheduleRowPersist = useCallback(
    (row: ClientRow, previous?: ClientRow, columns?: ColumnDef[]) => {
      if (!persistEnabledRef.current) return;

      const timers = rowTimersRef.current;
      const snapshots = rowPersistSnapshotsRef.current;
      const columnSnapshots = rowPersistColumnsRef.current;
      const existing = timers.get(row.id);
      if (existing) clearTimeout(existing);

      if (previous && !snapshots.has(row.id)) {
        snapshots.set(row.id, previous);
      }
      if (columns && !columnSnapshots.has(row.id)) {
        columnSnapshots.set(row.id, columns);
      }

      timers.set(
        row.id,
        setTimeout(() => {
          timers.delete(row.id);
          const snapshot = snapshots.get(row.id);
          const columnSnapshot = columnSnapshots.get(row.id);
          snapshots.delete(row.id);
          columnSnapshots.delete(row.id);
          void persistRowNow(row, snapshot, columnSnapshot);
        }, ROW_PERSIST_DEBOUNCE_MS),
      );
    },
    [persistRowNow],
  );

  const persistTableDiff = useCallback(
    async (prev: TableData, next: TableData) => {
      if (!persistEnabledRef.current) return;

      try {
        if (useApiRef.current) {
          await apiPersistTableDiff(prev, next);
          if (relanceStepsChanged(prev, next)) {
            setDeliveries((current) =>
              markDeliveriesCancelledLocallyForTableau(current, next.id),
            );
          }
          return;
        }

        if (tableMetaChanged(prev, next)) {
          await updateTableMeta(supabaseRef.current, next);
        }

        if (relanceStepsChanged(prev, next)) {
          await cancelCancellableDeliveriesForTableau(
            supabaseRef.current,
            next.id,
          );
          await syncRelanceSteps(
            supabaseRef.current,
            next.id,
            next.relanceSteps,
          );
          setDeliveries((current) =>
            markDeliveriesCancelledLocallyForTableau(current, next.id),
          );
        }

        const columns = [...next.leftColumns, ...next.hiddenLeftColumns];

        for (const row of getRemovedRows(prev.rows, next.rows)) {
          await deleteLigne(supabaseRef.current, row.id);
        }

        for (const row of getAddedRows(prev.rows, next.rows)) {
          await insertLigne(supabaseRef.current, next.id, row);
        }

        for (const row of getUpdatedRows(prev.rows, next.rows)) {
          const previous = prev.rows.find((entry) => entry.id === row.id);
          if (previous && isPaymentStatusOnlyChange(previous, row)) {
            void persistRowNow(row, previous, columns);
          } else {
            scheduleRowPersist(row, previous, columns);
          }
        }
      } catch (error) {
        reportPersistError(
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer le tableau.",
        );
      }
    },
    [reportPersistError, scheduleRowPersist],
  );

  const updateTable = useCallback(
    (id: string, updater: (table: TableData) => TableData) => {
      setTables((current) => {
        let previous: TableData | undefined;
        let next: TableData | undefined;

        const updated = current.map((table) => {
          if (table.id !== id) return table;
          previous = table;
          const candidate = updater(table);
          const rows = isTableRowsWithinLimits(current, id, candidate.rows)
            ? candidate.rows
            : clampRowsForTable(current, id, candidate.rows);
          next = rows === candidate.rows ? candidate : { ...candidate, rows };
          return next;
        });

        if (previous && next) {
          void persistTableDiff(previous, next);
        }

        return updated;
      });
    },
    [persistTableDiff],
  );

  const addTableAfter = useCallback(
    async (index: number, currentLength: number): Promise<string | null> => {
      const newTable = createTableData(currentLength + 1);
      let createdId: string | null = null;

      setTables((current) => {
        if (!canAddTable(current)) return current;

        createdId = newTable.id;
        const updated = [...current];
        updated.splice(index + 1, 0, newTable);
        return updated;
      });

      if (!createdId) return null;

      if (!persistEnabledRef.current) return createdId;

      try {
        if (useApiRef.current) {
          await apiInsertTable(newTable);
          return createdId;
        }

        const {
          data: { user },
        } = await supabaseRef.current.auth.getUser();
        if (!user) return createdId;

        await insertFullTable(supabaseRef.current, user.id, newTable);
        return createdId;
      } catch (error) {
        reportPersistError(
          error instanceof Error
            ? error.message
            : "Impossible de créer le tableau.",
        );
        return createdId;
      }
    },
    [reportPersistError],
  );

  const removeTable = useCallback(
    async (tableId: string) => {
      setTables((current) => {
        if (current.length <= 1) return current;
        return current.filter((table) => table.id !== tableId);
      });

      if (!persistEnabledRef.current) return;

      try {
        if (useApiRef.current) {
          await apiDeleteTable(tableId);
          return;
        }

        await deleteTable(supabaseRef.current, tableId);
      } catch (error) {
        reportPersistError(
          error instanceof Error
            ? error.message
            : "Impossible de supprimer le tableau.",
        );
      }
    },
    [reportPersistError],
  );

  const syncTableFromServer = useCallback((table: TableData) => {
    setTables((current) =>
      current.map((entry) => (entry.id === table.id ? table : entry)),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (demoMode) {
        persistEnabledRef.current = false;
        if (!cancelled) {
          setLoadError(null);
          setPersistError(null);
          setDeliveries([]);
          setTables([createTableData()]);
          setLoading(false);
        }
        return;
      }

      if (hasInitialData && initialData) {
        persistEnabledRef.current = true;
        if (!cancelled) {
          setTables(initialData.tables.map(ensureDefaultRelanceSteps));
          setDeliveries(initialData.deliveries);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setLoadError(null);

      try {
        if (useApiRef.current) {
          persistEnabledRef.current = true;
          const { tables: loaded, deliveries: loadedDeliveries } =
            await apiFetchDashboard();

          if (cancelled) return;

          setDeliveries(loadedDeliveries);

          if (loaded.length === 0) {
            const initial = createTableData();
            await apiInsertTable(initial);
            setTables([initial]);
            setDeliveries([]);
          } else {
            setTables(loaded.map(ensureDefaultRelanceSteps));
          }
          return;
        }

        const supabase = supabaseRef.current;
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          persistEnabledRef.current = false;
          if (!cancelled) {
            setDeliveries([]);
            setTables([createTableData()]);
            setLoading(false);
          }
          return;
        }

        persistEnabledRef.current = true;
        const loaded = await fetchAllTables(supabase);

        if (cancelled) return;

        const tableauIds = loaded.map((table) => table.id);
        const loadedDeliveries = await fetchRelanceDeliveriesForTableaux(
          supabase,
          tableauIds,
        );

        if (cancelled) return;

        setDeliveries(loadedDeliveries);

        if (loaded.length === 0) {
          const initial = createTableData();
          await insertFullTable(supabase, user.id, initial);
          setTables([initial]);
          setDeliveries([]);
        } else {
          setTables(loaded.map(ensureDefaultRelanceSteps));
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Impossible de charger vos tableaux.",
          );
          setTables([createTableData()]);
          persistEnabledRef.current = false;
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
      for (const timer of rowTimersRef.current.values()) {
        clearTimeout(timer);
      }
      rowTimersRef.current.clear();
    };
  }, [impersonationMode, demoMode, demoSessionKey, hasInitialData, initialData]);

  return {
    tables,
    deliveries,
    loading,
    loadError,
    persistError,
    updateTable,
    addTableAfter,
    removeTable,
    syncTableFromServer,
  };
}
