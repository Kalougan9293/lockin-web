"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { updatePasswordAction, type AuthActionState } from "@/app/actions/auth";
import { FormPendingSubmitButton } from "@/components/navigation/link-pending-feedback";

import { AuthCard } from "./AuthCard";
import { AuthField } from "./AuthField";
import { PasswordCriteria } from "./PasswordCriteria";

const initialState: AuthActionState = {};

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(updatePasswordAction, initialState);
  const [password, setPassword] = useState("");

  return (
    <AuthCard
      title="Nouveau mot de passe"
      description="Choisissez un mot de passe sécurisé pour votre compte LockIn."
      footer={
        <Link href="/login" className="font-medium text-white hover:text-brand-accent">
          Retour à la connexion
        </Link>
      }
    >
      <form action={formAction} className="space-y-5">
        <div className="space-y-2">
          <AuthField
            label="Nouveau mot de passe"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={state.fieldErrors?.password}
          />
          <PasswordCriteria password={password} />
        </div>

        <AuthField
          label="Confirmer le mot de passe"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          error={state.fieldErrors?.confirmPassword}
        />

        {state.error ? (
          <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {state.error}
            {state.error.includes("expiré") || state.error.includes("invalide") ? (
              <>
                {" "}
                <Link href="/forgot-password" className="underline underline-offset-2">
                  Demander un nouveau lien
                </Link>
                .
              </>
            ) : null}
          </p>
        ) : null}

        <FormPendingSubmitButton
          pendingLabel="Enregistrement…"
          className="btn-hover-grow w-full rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-90"
        >
          Enregistrer le mot de passe
        </FormPendingSubmitButton>
      </form>
    </AuthCard>
  );
}
