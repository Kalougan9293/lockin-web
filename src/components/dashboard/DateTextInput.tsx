"use client";

import { useEffect, useRef, useState } from "react";

import type { DateFormatPreference } from "@/lib/preferences/date-format";
import {
  assembleDraftParts,
  clampDateSegmentSelection,
  formatDateForDisplay,
  formatDateInputAsYouType,
  getDatePlaceholder,
  getDateSegmentIndexFromCaret,
  getDateSegmentMaxLengths,
  getDateSegmentRangeByIndex,
  isCompleteDateInput,
  parseDateInputToIso,
  parseDraftParts,
  type DateSegmentIndex,
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
  const activeSegmentRef = useRef<DateSegmentIndex>(0);
  const [draft, setDraft] = useState(() => formatDateForDisplay(value, dateFormat));

  useEffect(() => {
    if (focusedRef.current) return;
    setDraft(formatDateForDisplay(value, dateFormat));
  }, [value, dateFormat]);

  function commitDraft(nextDraft: string) {
    const iso = parseDateInputToIso(nextDraft, dateFormat);
    if (iso && isCompleteDateInput(nextDraft, dateFormat)) {
      setDraft(formatDateForDisplay(iso, dateFormat));
      onChange(iso);
      return;
    }

    setDraft(formatDateForDisplay(value, dateFormat));
  }

  function selectSegment(
    input: HTMLInputElement | null,
    segmentIndex: DateSegmentIndex,
  ) {
    if (!input) return;

    activeSegmentRef.current = segmentIndex;
    const range = clampDateSegmentSelection(
      getDateSegmentRangeByIndex(segmentIndex, dateFormat),
      input.value.length,
    );
    input.setSelectionRange(range.start, range.end);
  }

  function handleMouseDown() {
    skipFocusSelectRef.current = true;
  }

  function handleClick(event: React.MouseEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    requestAnimationFrame(() => {
      const caret = input.selectionStart ?? 0;
      const segmentIndex = getDateSegmentIndexFromCaret(caret, dateFormat);
      selectSegment(input, segmentIndex);
    });
  }

  function handleFocus(event: React.FocusEvent<HTMLInputElement>) {
    focusedRef.current = true;

    if (skipFocusSelectRef.current) {
      skipFocusSelectRef.current = false;
      return;
    }

    requestAnimationFrame(() => {
      selectSegment(event.currentTarget, 0);
    });
  }

  function handleBlur() {
    focusedRef.current = false;
    commitDraft(draft);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const input = event.currentTarget;

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const caret = input.selectionStart ?? 0;
      let segmentIndex = getDateSegmentIndexFromCaret(caret, dateFormat);

      if (event.key === "ArrowLeft" && segmentIndex > 0) {
        event.preventDefault();
        selectSegment(input, (segmentIndex - 1) as DateSegmentIndex);
        return;
      }

      if (event.key === "ArrowRight" && segmentIndex < 2) {
        event.preventDefault();
        selectSegment(input, (segmentIndex + 1) as DateSegmentIndex);
      }
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const inputValue = event.target.value;
    const newDigits = inputValue.replace(/\D/g, "");
    const oldDigits = draft.replace(/\D/g, "");

    if (
      Math.abs(newDigits.length - oldDigits.length) > 1 ||
      inputValue.length < draft.length - 2
    ) {
      const next = formatDateInputAsYouType(inputValue, dateFormat);
      setDraft(next);
      const iso = parseDateInputToIso(next, dateFormat);
      if (iso && isCompleteDateInput(next, dateFormat)) {
        onChange(iso);
      }
      return;
    }

    const segmentIndex = activeSegmentRef.current;
    const parts = parseDraftParts(draft, dateFormat);
    const range = clampDateSegmentSelection(
      getDateSegmentRangeByIndex(segmentIndex, dateFormat),
      inputValue.length,
    );
    const segmentText = inputValue
      .slice(range.start, range.end)
      .replace(/\D/g, "");
    const maxLengths = getDateSegmentMaxLengths(dateFormat);
    parts[segmentIndex] = segmentText.slice(0, maxLengths[segmentIndex]);

    const nextDraft = assembleDraftParts(parts, dateFormat);
    setDraft(nextDraft);

    if (
      parts[segmentIndex].length >= maxLengths[segmentIndex] &&
      segmentIndex < 2
    ) {
      const nextSegment = (segmentIndex + 1) as DateSegmentIndex;
      activeSegmentRef.current = nextSegment;
      requestAnimationFrame(() => {
        selectSegment(input, nextSegment);
      });
    }

    const iso = parseDateInputToIso(nextDraft, dateFormat);
    if (iso && isCompleteDateInput(nextDraft, dateFormat)) {
      onChange(iso);
    }
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
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      className={className}
    />
  );
}
