"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  isDemoWorkspace?: boolean;
};

const DEMO_FILE_NOTICE_MS = 4000;
const DEMO_FILE_NOTICE =
  "Cette option est accessible qu'en compte connecté.";

function ImportSectionDivider({ label }: { label?: string }) {
  if (!label) {
    return (
      <div className="my-2.5 px-1" aria-hidden="true">
        <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>
    );
  }

  return (
    <div className="my-2.5 flex items-center gap-2.5 px-1">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-brand-muted/70">
        {label}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
    </div>
  );
}

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
  isDemoWorkspace = false,
}: ImportPromptProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [demoFileNotice, setDemoFileNotice] = useState(false);
  const demoNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (demoNoticeTimerRef.current) clearTimeout(demoNoticeTimerRef.current);
    };
  }, []);

  function showDemoFileNotice() {
    setDemoFileNotice(true);
    if (demoNoticeTimerRef.current) clearTimeout(demoNoticeTimerRef.current);
    demoNoticeTimerRef.current = setTimeout(() => {
      setDemoFileNotice(false);
      demoNoticeTimerRef.current = null;
    }, DEMO_FILE_NOTICE_MS);
  }

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
    if (!isProcessing && !isDemoWorkspace) setIsDragging(true);
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
    if (isDemoWorkspace) {
      showDemoFileNotice();
      return;
    }
    if (isProcessing) return;
    handleFiles(event.dataTransfer.files);
  }

  function openFilePicker() {
    if (isDemoWorkspace) {
      showDemoFileNotice();
      return;
    }
    if (isProcessing) return;
    inputRef.current?.click();
  }

  return (
      <section className="mb-7 flex flex-col items-center">
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
        data-tutorial="import-zone"
        className={`w-full max-w-md rounded-xl border bg-brand-card/40 p-3 shadow-md shadow-violet-950/15 ring-1 transition-all sm:p-3.5 ${
          isDragging
            ? "border-violet-400/45 ring-violet-400/25"
            : "border-white/10 ring-white/[0.06]"
        } ${isProcessing ? "opacity-80" : ""}`}
      >
        <div
          className="rounded-lg border border-sky-400/25 bg-gradient-to-b from-sky-500/[0.09] to-indigo-500/[0.05] px-3 py-2.5 ring-1 ring-sky-400/10"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <TableTargetSelect
            id="import-target-table"
            tinted
            tables={tables}
            value={selectedTableId}
            onChange={onSelectedTableIdChange}
            onAddTable={onAddTable}
            canAddTable={canAddTable}
          />
        </div>

        <ImportSectionDivider />

        <div
          className={`relative rounded-lg border-2 border-dashed px-4 py-3.5 text-center transition-all ${
            isDemoWorkspace
              ? "cursor-not-allowed border-violet-400/20 bg-violet-500/[0.04] opacity-75"
              : `group ${
                  isDragging
                    ? "border-violet-400/55 bg-violet-400/12 ring-1 ring-violet-400/20"
                    : "border-violet-400/30 bg-violet-500/[0.07] ring-1 ring-violet-400/10 hover:border-violet-400/45 hover:bg-violet-500/[0.1]"
                }`
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {demoFileNotice ? (
            <div
              role="status"
              className="absolute inset-x-3 top-3 z-10 rounded-lg border border-amber-400/50 bg-amber-500/25 px-3 py-2 text-center text-sm font-medium text-amber-50 shadow-lg shadow-amber-950/30 ring-1 ring-amber-300/30"
            >
              {DEMO_FILE_NOTICE}
            </div>
          ) : null}

          <button
            type="button"
            onClick={openFilePicker}
            disabled={isProcessing}
            aria-label={
              isDemoWorkspace
                ? "Import de fichiers réservé aux comptes connectés"
                : "Glisser des factures PDF, un CSV, ou cliquer pour parcourir"
            }
            className={`flex w-full flex-col items-center gap-2 disabled:cursor-not-allowed ${
              isDemoWorkspace ? "cursor-not-allowed" : ""
            }`}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-brand-surface/80 transition-colors ${
                isDemoWorkspace
                  ? ""
                  : "group-hover:border-violet-400/30 group-hover:bg-violet-400/10"
              }`}
            >
              {isProcessing ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300/30 border-t-violet-300" />
              ) : (
                <svg
                  className="h-4 w-4 text-brand-muted transition-colors group-hover:text-violet-300"
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

            <p
              className={`max-w-[16rem] text-sm font-light leading-snug transition-colors ${
                isDemoWorkspace
                  ? "text-brand-muted/80"
                  : "text-brand-muted group-hover:text-white/85"
              }`}
            >
              {isProcessing ? (
                "Lecture des fichiers…"
              ) : (
                <>
                  Glisser un ou plusieurs PDF, un CSV, ou{" "}
                  <span className="font-medium text-violet-300/90 group-hover:text-violet-200">
                    parcourir
                  </span>
                </>
              )}
            </p>
          </button>
        </div>

        <ImportSectionDivider label="ou" />

        <button
          type="button"
          onClick={onAddManual}
          disabled={addManualDisabled || isProcessing}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-400/40 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 px-3 py-2 text-sm font-medium text-violet-100 shadow-sm shadow-violet-950/20 transition-all hover:border-violet-300/55 hover:from-violet-500/25 hover:to-fuchsia-500/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-violet-400/40 disabled:hover:from-violet-500/15 disabled:hover:to-fuchsia-500/10 disabled:hover:text-violet-100"
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md border border-violet-400/30 bg-violet-500/20 text-sm leading-none"
            aria-hidden
          >
            +
          </span>
          Ajouter un client manuellement
        </button>
      </div>

      {error ? (
        <p className="mt-3 max-w-lg text-center text-sm text-red-300">{error}</p>
      ) : null}
    </section>
  );
}
