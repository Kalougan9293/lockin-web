"use client";

import { useEffect, useState } from "react";

import {
  AMOUNT_PLACEHOLDER,
  formatAmountForDisplay,
  formatAmountInputAsYouType,
  parseAmountToStorage,
} from "@/lib/preferences/currency-format";
import { getColumnFieldName } from "@/types/tableau";

type TableAmountCellProps = {
  value: string;
  columnLabel: string;
  ariaLabel: string;
  onChange: (storedValue: string) => void;
};

export function TableAmountCell({
  value,
  columnLabel,
  ariaLabel,
  onChange,
}: TableAmountCellProps) {
  const [draft, setDraft] = useState(() => formatAmountForDisplay(value));

  useEffect(() => {
    setDraft(formatAmountForDisplay(value));
  }, [value]);

  function commitDraft(nextDraft: string) {
    const stored = parseAmountToStorage(nextDraft);
    setDraft(stored ? formatAmountForDisplay(stored) : "");
    onChange(stored);
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      name={getColumnFieldName(columnLabel)}
      autoComplete="off"
      value={draft}
      placeholder={AMOUNT_PLACEHOLDER}
      aria-label={ariaLabel}
      onChange={(event) => {
        setDraft(formatAmountInputAsYouType(event.target.value));
      }}
      onBlur={() => commitDraft(draft)}
      className="w-full min-w-[3ch] bg-transparent text-center text-sm text-white/90 outline-none placeholder:text-brand-muted/40 focus:text-white"
    />
  );
}
