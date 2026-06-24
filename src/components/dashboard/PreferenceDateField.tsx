"use client";

import { useEffect, useState } from "react";

import { AuthField } from "@/components/auth/AuthField";
import type { DateFormatPreference } from "@/lib/preferences/date-format";
import {
  formatDateForDisplay,
  formatDateInputAsYouType,
  getDatePlaceholder,
  parseDateInputToIso,
} from "@/lib/preferences/date-format";

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
  const [draft, setDraft] = useState(() => formatDateForDisplay(value, dateFormat));

  useEffect(() => {
    setDraft(formatDateForDisplay(value, dateFormat));
  }, [value, dateFormat]);

  function commitDraft(nextDraft: string) {
    setDraft(nextDraft);
    onChange(parseDateInputToIso(nextDraft, dateFormat));
  }

  return (
    <AuthField
      id={id}
      label=""
      name={name}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={getDatePlaceholder(dateFormat)}
      value={draft}
      disabled={disabled}
      onChange={(event) => {
        const formatted = formatDateInputAsYouType(event.target.value, dateFormat);
        setDraft(formatted);
      }}
      onBlur={() => commitDraft(draft)}
      className={className}
    />
  );
}
