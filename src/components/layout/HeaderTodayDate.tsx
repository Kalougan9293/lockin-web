"use client";

import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { formatDateOnlyIso, todayDateOnly } from "@/lib/dashboard/date-only";
import { formatDateForDisplay } from "@/lib/preferences/date-format";

export function HeaderTodayDate() {
  const { dateFormat } = useUserPreferences();
  const label = formatDateForDisplay(
    formatDateOnlyIso(todayDateOnly()),
    dateFormat,
  );

  return (
    <p
      className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-medium tracking-wide text-white/55 sm:text-xs"
      aria-label={`Date du jour : ${label}`}
    >
      {label}
    </p>
  );
}
