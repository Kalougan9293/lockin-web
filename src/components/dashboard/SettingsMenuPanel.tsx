"use client";

import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import {
  DATE_FORMAT_OPTIONS,
  type DateFormatPreference,
} from "@/lib/preferences/date-format";

export function SettingsMenuPanel() {
  const { dateFormat, setDateFormat } = useUserPreferences();

  return (
    <div className="border-t border-white/10 px-3 py-2.5">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-brand-muted/80">
        Format des dates
      </p>
      <div className="space-y-1">
        {DATE_FORMAT_OPTIONS.map((option) => {
          const selected = dateFormat === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setDateFormat(option.id as DateFormatPreference)}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                selected
                  ? "bg-violet-500/20 text-violet-100"
                  : "text-brand-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-xs font-medium">{option.label}</span>
              <span className="text-[10px] text-brand-muted/80">{option.example}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
