"use client";

import { useEffect, useState } from "react";

import { AuthField } from "@/components/auth/AuthField";
import {
  AMOUNT_PLACEHOLDER,
  formatAmountForDisplay,
  formatAmountInputAsYouType,
  parseAmountToStorage,
} from "@/lib/preferences/currency-format";
import { getColumnFieldName } from "@/types/tableau";

type PreferenceAmountFieldProps = {
  id: string;
  name: string;
  value: string;
  disabled?: boolean;
  onChange: (storedValue: string) => void;
  className?: string;
};

export function PreferenceAmountField({
  id,
  name,
  value,
  disabled = false,
  onChange,
  className,
}: PreferenceAmountFieldProps) {
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
    <AuthField
      id={id}
      label=""
      name={getColumnFieldName(name)}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      placeholder={AMOUNT_PLACEHOLDER}
      value={draft}
      disabled={disabled}
      onChange={(event) => {
        setDraft(formatAmountInputAsYouType(event.target.value));
      }}
      onBlur={() => commitDraft(draft)}
      className={className}
    />
  );
}
