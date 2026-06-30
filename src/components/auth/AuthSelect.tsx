import type { SelectHTMLAttributes } from "react";

type AuthSelectOption = {
  value: string;
  label: string;
};

type AuthSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: readonly AuthSelectOption[];
  placeholder?: string;
  error?: string;
};

export function AuthSelect({
  label,
  options,
  placeholder = "Sélectionnez une option",
  error,
  id,
  className,
  ...props
}: AuthSelectProps) {
  const fieldId = id ?? props.name;

  return (
    <div className="space-y-2">
      <label htmlFor={fieldId} className="block text-sm font-medium text-white">
        {label}
      </label>
      <select
        id={fieldId}
        className={`w-full rounded-xl border bg-brand-dark px-4 py-3 text-sm text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent/30 ${
          error
            ? "border-red-400/60 focus:border-red-400/60"
            : "border-white/10 focus:border-brand-accent/50"
        } ${className ?? ""}`}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-brand-dark">
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
