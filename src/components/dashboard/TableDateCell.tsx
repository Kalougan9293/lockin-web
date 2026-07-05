"use client";

import type { DateFormatPreference } from "@/lib/preferences/date-format";
import { getColumnFieldName } from "@/types/tableau";

import { DateTextInput } from "./DateTextInput";

type TableDateCellProps = {
  /** Valeur stockée (ISO de préférence). */
  value: string;
  columnLabel: string;
  dateFormat: DateFormatPreference;
  ariaLabel: string;
  onChange: (isoValue: string) => void;
};

export function TableDateCell({
  value,
  columnLabel,
  dateFormat,
  ariaLabel,
  onChange,
}: TableDateCellProps) {
  return (
    <DateTextInput
      value={value}
      dateFormat={dateFormat}
      name={getColumnFieldName(columnLabel)}
      ariaLabel={ariaLabel}
      onChange={onChange}
      className="w-full min-w-[3ch] bg-transparent text-center text-sm text-white/90 outline-none placeholder:text-brand-muted/40 focus:text-white"
    />
  );
}
