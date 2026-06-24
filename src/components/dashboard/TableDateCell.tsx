"use client";

import { useEffect, useState } from "react";

import type { DateFormatPreference } from "@/lib/preferences/date-format";
import {
  formatDateForDisplay,
  formatDateInputAsYouType,
  getDatePlaceholder,
  parseDateInputToIso,
} from "@/lib/preferences/date-format";

type TableDateCellProps = {
  /** Valeur stockée (ISO de préférence). */
  value: string;
  dateFormat: DateFormatPreference;
  ariaLabel: string;
  onChange: (isoValue: string) => void;
};

export function TableDateCell({
  value,
  dateFormat,
  ariaLabel,
  onChange,
}: TableDateCellProps) {
  const [draft, setDraft] = useState(() => formatDateForDisplay(value, dateFormat));

  useEffect(() => {
    setDraft(formatDateForDisplay(value, dateFormat));
  }, [value, dateFormat]);

  function commitDraft(nextDraft: string) {
    setDraft(nextDraft);
    onChange(parseDateInputToIso(nextDraft, dateFormat));
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={draft}
      placeholder={getDatePlaceholder(dateFormat)}
      aria-label={ariaLabel}
      onChange={(event) => {
        setDraft(formatDateInputAsYouType(event.target.value, dateFormat));
      }}
      onBlur={() => commitDraft(draft)}
      className="w-full min-w-[3ch] bg-transparent text-center text-sm text-white/90 outline-none placeholder:text-brand-muted/40 focus:text-white"
    />
  );
}
