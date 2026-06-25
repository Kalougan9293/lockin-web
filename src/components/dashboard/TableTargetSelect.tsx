"use client";

import { useEffect, useRef, useState } from "react";

import type { TableSummary } from "@/types/tableau";

type TableTargetSelectProps = {
  id: string;
  label?: string;
  tables: TableSummary[];
  value: string;
  onChange: (tableId: string) => void;
  onAddTable?: () => void;
  canAddTable?: boolean;
};

export function TableTargetSelect({
  id,
  label = "Tableau de destination",
  tables,
  value,
  onChange,
  onAddTable,
  canAddTable = true,
}: TableTargetSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selectedTable =
    tables.find((table) => table.id === value) ?? tables[0];

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (tables.length === 0 || !selectedTable) return null;

  function selectTable(tableId: string) {
    onChange(tableId);
    setOpen(false);
  }

  function handleAddTable() {
    if (!canAddTable || !onAddTable) return;
    onAddTable();
    setOpen(false);
  }

  return (
    <div className="space-y-1.5">
      <span
        id={`${id}-label`}
        className="block text-center text-sm font-medium text-white"
      >
        {label}
      </span>
      <div ref={containerRef} className="relative">
        <button
          id={id}
          type="button"
          aria-labelledby={`${id}-label`}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-8 py-2.5 text-center text-sm text-white outline-none transition-colors hover:border-violet-300/30 focus:border-violet-300/40 focus:ring-2 focus:ring-violet-400/20"
        >
          <span className="truncate">{selectedTable.name}</span>
          <span aria-hidden className="ml-2 text-[10px] text-brand-muted">
            ▾
          </span>
        </button>

        {open ? (
          <div
            role="listbox"
            aria-labelledby={`${id}-label`}
            className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-white/10 bg-brand-card py-1 shadow-xl shadow-black/40"
          >
            {tables.map((table) => (
              <button
                key={table.id}
                type="button"
                role="option"
                aria-selected={table.id === value}
                onClick={() => selectTable(table.id)}
                className={`block w-full px-4 py-2.5 text-center text-sm transition-colors hover:bg-white/5 hover:text-white ${
                  table.id === value
                    ? "font-medium text-violet-300"
                    : "text-brand-muted"
                }`}
              >
                {table.name}
              </button>
            ))}

            {onAddTable ? (
              <>
                <div className="my-1 border-t border-white/10" />
                <button
                  type="button"
                  onClick={handleAddTable}
                  disabled={!canAddTable}
                  className="flex w-full items-center justify-center gap-1.5 px-4 py-2.5 text-sm text-violet-300 transition-colors hover:bg-white/5 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <span className="text-base leading-none">+</span>
                  <span>Ajouter un tableau</span>
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
