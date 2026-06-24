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
      className={`${tableTitleTextClassName} group max-w-full text-left`}
    >
      <span
        className={`${tableTitleGradientClassName} transition-opacity group-hover:opacity-90`}
      >
        {name}
      </span>
    </button>
  );
}
