"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useBodyWaitCursor } from "@/components/navigation/link-pending-feedback";
import type { TableSummary } from "@/types/tableau";

import { ImportZoneToggleButton } from "./ImportZoneToggleButton";

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

const panelClass =
  "flex min-h-[4.25rem] w-full min-w-0 flex-col rounded-xl border border-white/10 bg-brand-card/40 p-2 shadow-md shadow-violet-950/15 ring-1 ring-white/[0.06] sm:min-h-[4.5rem] sm:p-2.5";

import { DASHBOARD_CONTENT_BLEED_CLASS } from "@/lib/dashboard/content-bleed";

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
  useBodyWaitCursor(isProcessing);
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
    <section className={`mb-4 ${DASHBOARD_CONTENT_BLEED_CLASS}`}>
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
        className={`grid w-full grid-cols-1 gap-2 sm:grid-cols-3 sm:grid-rows-[auto_auto] sm:items-start sm:gap-x-3 sm:gap-y-1.5 ${
          isProcessing ? "opacity-80" : ""
        }`}
      >
        <div
          data-tutorial="import-target"
          className={`${panelClass} order-1 justify-center border-sky-400/25 bg-gradient-to-b from-sky-500/[0.09] to-indigo-500/[0.05] ring-sky-400/10 sm:order-none sm:col-start-1 sm:row-start-1`}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <TableTargetSelect
            id="import-target-table"
            tinted
            compact
            tables={tables}
            value={selectedTableId}
            onChange={onSelectedTableIdChange}
            onAddTable={onAddTable}
            canAddTable={canAddTable}
          />
        </div>

        <div
          data-tutorial="import-actions"
          className="order-2 grid grid-cols-1 gap-2 sm:order-none sm:col-start-2 sm:col-end-4 sm:row-start-1 sm:grid-cols-2 sm:gap-3"
        >
          <div
            className={`${panelClass} relative justify-center border-dashed p-0 ${
              isDemoWorkspace
                ? "border-violet-400/20 bg-violet-500/[0.04]"
                : isDragging
                  ? "border-violet-400/55 bg-violet-400/12 ring-violet-400/25"
                  : "border-violet-400/30 bg-violet-500/[0.07] ring-violet-400/10"
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
              className={`flex h-full w-full flex-row items-center justify-center gap-2 rounded-xl px-3 py-2 text-center disabled:cursor-not-allowed ${
                isDemoWorkspace
                  ? "cursor-not-allowed opacity-75"
                  : "group hover:bg-violet-500/[0.06]"
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border transition-colors ${
                  isDemoWorkspace
                    ? "border-white/10 bg-brand-surface/80"
                    : "border-violet-400/35 bg-violet-500/20 group-hover:border-violet-300/50 group-hover:bg-violet-500/30"
                }`}
              >
                {isProcessing ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300/30 border-t-violet-300" />
                ) : (
                  <svg
                    className={`h-5 w-5 ${
                      isDemoWorkspace ? "text-brand-muted/80" : "text-violet-300"
                    }`}
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
                className={`min-w-0 flex-1 text-xs font-medium leading-snug ${
                  isDemoWorkspace ? "text-brand-muted/80" : "text-white"
                }`}
              >
                {isProcessing ? (
                  "Lecture des fichiers…"
                ) : (
                  "Glisser un ou plusieurs PDF, un CSV ou parcourir"
                )}
              </p>
            </button>
          </div>

          <button
            type="button"
            onClick={onAddManual}
            disabled={addManualDisabled || isProcessing}
            className={`${panelClass} flex-row items-center justify-center gap-2 border-violet-400/40 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 text-xs font-medium text-violet-100 shadow-sm shadow-violet-950/20 transition-all hover:border-violet-300/55 hover:from-violet-500/25 hover:to-fuchsia-500/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-violet-400/40 disabled:hover:from-violet-500/15 disabled:hover:to-fuchsia-500/10 disabled:hover:text-violet-100`}
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-violet-400/30 bg-violet-500/20 text-xl font-medium leading-none text-white"
              aria-hidden
            >
              +
            </span>
            <span className="min-w-0 flex-1 text-center leading-snug">
              Ajouter un client manuellement
            </span>
          </button>
        </div>

        <ImportZoneToggleButton
          variant="hide"
          className="order-3 mx-auto sm:order-none sm:col-start-2 sm:row-start-2"
        />

      </div>

      {error ? (
        <p className="mt-3 text-center text-sm text-red-300">{error}</p>
      ) : null}
    </section>
  );
}
