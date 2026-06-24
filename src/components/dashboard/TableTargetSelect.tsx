"use client";

import type { TableSummary } from "@/types/tableau";

type TableTargetSelectProps = {
  id: string;
  label?: string;
  tables: TableSummary[];
  value: string;
  onChange: (tableId: string) => void;
};

export function TableTargetSelect({
  id,
  label = "Tableau de destination",
  tables,
  value,
  onChange,
}: TableTargetSelectProps) {
  if (tables.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-center text-sm font-medium text-white">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.04] px-8 py-2.5 text-center text-sm text-white outline-none focus:border-violet-300/40 focus:ring-2 focus:ring-violet-400/20"
        >
          {tables.map((table) => (
            <option
              key={table.id}
              value={table.id}
              className="bg-brand-card text-center text-white"
            >
              {table.name}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-brand-muted"
        >
          ▾
        </span>
      </div>
    </div>
  );
}
