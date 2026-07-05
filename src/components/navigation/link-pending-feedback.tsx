"use client";

import type { ComponentProps } from "react";
import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useLinkStatus } from "next/link";

/** Curseur « chargement » sur toute la page pendant une navigation. */
export function useBodyWaitCursor(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const previous = document.body.style.cursor;
    document.body.style.cursor = "wait";

    return () => {
      document.body.style.cursor = previous;
    };
  }, [active]);
}

type InlinePendingSpinnerProps = {
  className?: string;
  size?: "sm" | "md";
};

/** Spinner inline pour boutons et liens en attente. */
export function InlinePendingSpinner({
  className = "",
  size = "sm",
}: InlinePendingSpinnerProps) {
  const sizeClass = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <span
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70 ${sizeClass} ${className}`}
      aria-hidden
    />
  );
}

type FormPendingSubmitButtonProps = ComponentProps<"button"> & {
  pendingLabel?: string;
};

/** Bouton submit pour formulaires avec server action — spinner + curseur attente. */
export function FormPendingSubmitButton({
  children,
  pendingLabel,
  disabled,
  className = "",
  ...props
}: FormPendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  useBodyWaitCursor(pending);

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className={`${pending ? "cursor-wait" : ""} ${className}`.trim()}
      {...props}
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <InlinePendingSpinner size="md" />
          {pendingLabel ?? "Chargement…"}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/** À placer à l'intérieur d'un composant <Link> Next.js. */
export function LinkPendingSpinner({ className = "" }: { className?: string }) {
  const { pending } = useLinkStatus();
  useBodyWaitCursor(pending);

  if (!pending) {
    return (
      <span
        className={`inline-block h-3.5 w-3.5 shrink-0 ${className}`}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={`inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70 ${className}`}
      aria-hidden
    />
  );
}
