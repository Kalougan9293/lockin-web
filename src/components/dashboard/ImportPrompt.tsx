"use client";

import { useCallback, useRef, useState } from "react";

import type { TableSummary } from "@/types/tableau";

import { TableTargetSelect } from "./TableTargetSelect";

type ImportPromptProps = {
  tables: TableSummary[];
  selectedTableId: string;
  onSelectedTableIdChange: (tableId: string) => void;
  onAddManual: () => void;
  onFilesSelected: (files: File[]) => void;
  onAddTable?: () => void;
  canAddTable?: boolean;
  isProcessing?: boolean;
  error?: string | null;
  addManualDisabled?: boolean;
};

export function ImportPrompt({
  tables,
  selectedTableId,
  onSelectedTableIdChange,
  onAddManual,
  onFilesSelected,
  onAddTable,
  canAddTable = true,
  isProcessing = false,
  error = null,
  addManualDisabled = false,
}: ImportPromptProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList | File[] | null | undefined) => {
      if (!fileList?.length) return;
      onFilesSelected([...fileList]);
    },
    [onFilesSelected],
  );

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!isProcessing) setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (isProcessing) return;
    handleFiles(event.dataTransfer.files);
  }

  function openFilePicker() {
    if (isProcessing) return;
    inputRef.current?.click();
  }

  return (
    <section className="mb-6 flex flex-col items-center">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf,.csv,text/csv"
        multiple
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div
        className={`group flex w-full max-w-lg flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-7 text-center transition-all sm:py-8 ${
          isDragging
            ? "border-violet-400/60 bg-violet-400/10"
            : "border-white/20 bg-white/[0.04] hover:border-violet-400/40 hover:bg-violet-400/[0.06]"
        } ${isProcessing ? "opacity-70" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <button
          type="button"
          onClick={openFilePicker}
          disabled={isProcessing}
          aria-label="Glisser des factures PDF, un CSV, ou cliquer pour parcourir"
          className="flex w-full flex-col items-center gap-3 disabled:cursor-not-allowed"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-brand-card/80 transition-colors group-hover:border-violet-400/25 group-hover:bg-violet-400/10">
            {isProcessing ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-violet-300/30 border-t-violet-300" />
            ) : (
              <svg
                className="h-5 w-5 text-brand-muted transition-colors group-hover:text-violet-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75h6M12 9.75v6"
                />
              </svg>
            )}
          </div>

          <p className="max-w-sm text-base font-light leading-snug text-brand-muted transition-colors group-hover:text-white/90 sm:text-lg">
            {isProcessing ? (
              "Lecture des fichiers…"
            ) : (
              <>
                Glisser un ou plusieurs PDF, un CSV, ou{" "}
                <span className="text-violet-300/90 group-hover:text-violet-200">
                  cliquer pour parcourir
                </span>
              </>
            )}
          </p>
        </button>

        <div
          className="w-full max-w-xs"
          onClick={(event) => event.stopPropagation()}
        >
          <TableTargetSelect
            id="import-target-table"
            tables={tables}
            value={selectedTableId}
            onChange={onSelectedTableIdChange}
            onAddTable={onAddTable}
            canAddTable={canAddTable}
          />
        </div>

        <button
          type="button"
          onClick={onAddManual}
          disabled={addManualDisabled}
          className="text-sm text-brand-muted underline-offset-2 transition-colors hover:text-violet-200 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-brand-muted disabled:hover:no-underline"
        >
          Ajouter manuellement sans fichier
        </button>
      </div>

      {error ? (
        <p className="mt-3 max-w-lg text-center text-sm text-red-300">{error}</p>
      ) : null}
    </section>
  );
}
