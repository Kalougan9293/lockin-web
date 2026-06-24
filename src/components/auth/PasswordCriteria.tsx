"use client";

import { getPasswordCriteria } from "@/lib/auth/validation";

type PasswordCriteriaProps = {
  password: string;
};

function CriterionIcon({ met }: { met: boolean }) {
  if (met) {
    return (
      <svg
        className="h-4 w-4 shrink-0 text-emerald-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }

  return (
    <span
      className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border border-white/20"
      aria-hidden="true"
    />
  );
}

export function PasswordCriteria({ password }: PasswordCriteriaProps) {
  const criteria = getPasswordCriteria(password);

  return (
    <ul className="space-y-1.5" aria-live="polite">
      {criteria.map((criterion) => (
        <li
          key={criterion.id}
          className={`flex items-center gap-2 text-xs transition-colors ${
            criterion.met ? "text-emerald-400" : "text-brand-muted"
          }`}
        >
          <CriterionIcon met={criterion.met} />
          <span>{criterion.label}</span>
        </li>
      ))}
    </ul>
  );
}
