"use client";

import { useEffect, useRef, useState } from "react";

import { fredoka } from "@/lib/fonts/fredoka";

type EditableTableTitleProps = {
  name: string;
  onRename: (name: string) => void;
};

export const tableTitleTextClassName = `${fredoka.className} text-4xl font-bold leading-none tracking-tight sm:text-5xl`;

export const tableTitleGradientClassName =
  "bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent";

export function EditableTableTitle({ name, onRename }: EditableTableTitleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed) onRename(trimmed);
    setEditing(false);
  }

  function cancel() {
    setDraft(name);
    setEditing(false);
  }

  if (editing) {
    const inputWidthCh = Math.max(draft.length, name.length, 6);

    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            cancel();
          }
        }}
        aria-label="Nom du tableau"
        style={{ width: `${inputWidthCh}ch` }}
        className={`${tableTitleTextClassName} box-border max-w-full border-b-2 border-violet-400/50 bg-transparent text-white outline-none`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Cliquer pour renommer"
      className={`${tableTitleTextClassName} group inline-flex max-w-full items-center gap-2 text-left`}
    >
      <span
        className={`${tableTitleGradientClassName} transition-opacity group-hover:opacity-90`}
      >
        {name}
      </span>
      <svg
        className="h-5 w-5 shrink-0 text-violet-300/35 transition-colors group-hover:text-violet-300/55 sm:h-6 sm:w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 7.125L16.862 4.487M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
        />
      </svg>
    </button>
  );
}
