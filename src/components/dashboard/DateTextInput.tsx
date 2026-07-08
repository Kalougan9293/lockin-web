"use client";

import { useEffect, useRef, useState } from "react";

import type { DateFormatPreference } from "@/lib/preferences/date-format";
import {
  clampDateSegmentSelection,
  formatDateForDisplay,
  formatDateInputAsYouType,
  getDatePlaceholder,
  getDateSegmentIndexFromClickRatio,
  getDateSegmentRangeByIndex,
  parseDateInputToIso,
} from "@/lib/preferences/date-format";

type DateTextInputProps = {
  value: string;
  dateFormat: DateFormatPreference;
  name?: string;
  id?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  onChange: (isoValue: string) => void;
};

export function DateTextInput({
  value,
  dateFormat,
  name,
  id,
  ariaLabel,
  disabled = false,
  className,
  onChange,
}: DateTextInputProps) {
  const focusedRef = useRef(false);
  const skipFocusSelectRef = useRef(false);
  const [draft, setDraft] = useState(() => formatDateForDisplay(value, dateFormat));

  useEffect(() => {
    if (focusedRef.current) return;
    setDraft(formatDateForDisplay(value, dateFormat));
  }, [value, dateFormat]);

  function commitDraft(nextDraft: string) {
    setDraft(nextDraft);
    onChange(parseDateInputToIso(nextDraft, dateFormat));
  }

  function selectSegment(
    input: HTMLInputElement | null,
    segmentIndex: 0 | 1 | 2,
  ) {
    if (!input) return;

    const range = clampDateSegmentSelection(
      getDateSegmentRangeByIndex(segmentIndex, dateFormat),
      input.value.length,
    );
    input.setSelectionRange(range.start, range.end);
  }

  function handleMouseDown(event: React.MouseEvent<HTMLInputElement>) {
    event.preventDefault();
    skipFocusSelectRef.current = true;

    const input = event.currentTarget;
    input.focus();

    const rect = input.getBoundingClientRect();
    const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
    const segmentIndex = getDateSegmentIndexFromClickRatio(
      Math.max(0, Math.min(1, ratio)),
    );

    requestAnimationFrame(() => {
      selectSegment(input, segmentIndex);
    });
  }

  function handleFocus(event: React.FocusEvent<HTMLInputElement>) {
    focusedRef.current = true;

    if (skipFocusSelectRef.current) {
      skipFocusSelectRef.current = false;
      return;
    }

    const input = event.currentTarget;
    requestAnimationFrame(() => {
      selectSegment(input, 0);
    });
  }

  function handleBlur() {
    focusedRef.current = false;
    commitDraft(draft);
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      name={name}
      autoComplete="off"
      value={draft}
      disabled={disabled}
      placeholder={getDatePlaceholder(dateFormat)}
      aria-label={ariaLabel}
      onMouseDown={handleMouseDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={(event) => {
        const next = formatDateInputAsYouType(event.target.value, dateFormat);
        setDraft(next);
        onChange(parseDateInputToIso(next, dateFormat));
      }}
      className={className}
    />
  );
}
