"use client";

import { signOutAction } from "@/app/actions/auth";
import { FormPendingSubmitButton } from "@/components/navigation/link-pending-feedback";

type SignOutFormProps = {
  variant?: "menu" | "header";
};

export function SignOutForm({ variant = "header" }: SignOutFormProps) {
  if (variant === "menu") {
    return (
      <form action={signOutAction} className="block w-full">
        <FormPendingSubmitButton
          role="menuitem"
          pendingLabel="Déconnexion…"
          className="block w-full px-4 py-2.5 text-left text-sm text-brand-muted transition-colors hover:bg-white/5 hover:text-white disabled:opacity-90"
        >
          Déconnexion
        </FormPendingSubmitButton>
      </form>
    );
  }

  return (
    <form action={signOutAction}>
      <FormPendingSubmitButton
        pendingLabel="Déconnexion…"
        className="rounded-lg border border-white/10 px-3 py-1.5 text-center text-sm text-brand-muted transition-colors hover:border-white/20 hover:text-white disabled:opacity-90"
      >
        Déconnexion
      </FormPendingSubmitButton>
    </form>
  );
}
