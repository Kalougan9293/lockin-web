"use client";

import type { DateFormatPreference } from "@/lib/preferences/date-format";
import { getColumnFieldName } from "@/types/tableau";

import { DateTextInput } from "./DateTextInput";

type PreferenceDateFieldProps = {
  id: string;
  name: string;
  value: string;
  dateFormat: DateFormatPreference;
  disabled?: boolean;
  onChange: (isoValue: string) => void;
  className?: string;
};

export function PreferenceDateField({
  id,
  name,
  value,
  dateFormat,
  disabled = false,
  onChange,
  className,
}: PreferenceDateFieldProps) {
  return (
    <DateTextInput
      id={id}
      name={getColumnFieldName(name)}
      value={value}
      dateFormat={dateFormat}
      disabled={disabled}
      onChange={onChange}
      className={`w-full rounded-xl border border-white/10 bg-brand-dark px-4 py-3 text-sm text-white placeholder:text-brand-muted/70 transition-colors focus:border-brand-accent/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`}
    />
  );
}
