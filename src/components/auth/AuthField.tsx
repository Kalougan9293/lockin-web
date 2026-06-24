import type { InputHTMLAttributes } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function AuthField({ label, error, id, className, ...props }: AuthFieldProps) {
  const fieldId = id ?? props.name;

  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={fieldId} className="block text-sm font-medium text-white">
          {label}
        </label>
      ) : null}
      <input
        id={fieldId}
        className={`w-full rounded-xl border bg-brand-dark px-4 py-3 text-sm text-white placeholder:text-brand-muted/70 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent/30 ${
          error
            ? "border-red-400/60 focus:border-red-400/60"
            : "border-white/10 focus:border-brand-accent/50"
        } ${className ?? ""}`}
        {...props}
      />
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
