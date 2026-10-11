"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

type AuthPasswordFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: string;
  error?: string;
};

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.3 17.3 0 0 1-3.2 4.4" />
      <path d="M6.1 6.1A17.4 17.4 0 0 0 2 12s3.5 7 10 7a10.2 10.2 0 0 0 4.2-.9" />
    </svg>
  );
}

export function AuthPasswordField({
  label,
  error,
  id,
  className,
  ...props
}: AuthPasswordFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? props.name ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={fieldId} className="block text-sm font-medium text-white">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={fieldId}
          type={visible ? "text" : "password"}
          className={`w-full rounded-xl border bg-brand-dark py-3 pl-4 pr-11 text-sm text-white placeholder:text-brand-muted/70 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent/30 ${
            error
              ? "border-red-400/60 focus:border-red-400/60"
              : "border-white/10 focus:border-brand-accent/50"
          } ${className ?? ""}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-brand-muted transition-colors hover:text-white"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          tabIndex={-1}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
