"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  requestPasswordResetAction,
  type AuthActionState,
} from "@/app/actions/auth";
import { FormPendingSubmitButton } from "@/components/navigation/link-pending-feedback";

import { AuthCard } from "./AuthCard";
import { AuthField } from "./AuthField";

const initialState: AuthActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  if (state.success) {
    return (
      <AuthCard
        title="E-mail envoyé"
        description={state.success}
        footer={
          <Link
            href="/login"
            className="font-medium text-white hover:text-brand-accent"
          >
            Retour à la connexion
          </Link>
        }
      >
        <p className="text-center text-sm leading-relaxed text-brand-muted">
          Pensez à vérifier vos spams si vous ne voyez rien dans votre boîte de
          réception.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Mot de passe oublié"
      description="Saisissez votre adresse e-mail. Nous vous enverrons un lien pour choisir un nouveau mot de passe."
      footer={
        <span className="text-brand-muted">
          Vous vous en souvenez ?{" "}
          <Link href="/login" className="font-medium text-white hover:text-brand-accent">
            Se connecter
          </Link>
        </span>
      }
    >
      <form action={formAction} className="space-y-5">
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={state.fieldErrors?.email}
        />

        {state.error ? (
          <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {state.error}
          </p>
        ) : null}

        <FormPendingSubmitButton
          pendingLabel="Envoi en cours…"
          className="btn-hover-grow w-full rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-90"
        >
          Envoyer le lien
        </FormPendingSubmitButton>
      </form>
    </AuthCard>
  );
}
