"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInAction, type AuthActionState } from "@/app/actions/auth";
import { FormPendingSubmitButton } from "@/components/navigation/link-pending-feedback";

import { AuthCard } from "./AuthCard";
import { AuthField } from "./AuthField";

const initialState: AuthActionState = {};

export function SignInForm() {
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <AuthCard
      title="Connexion"
      footer={
        <span className="text-brand-muted">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-medium text-white hover:text-brand-accent">
            S&apos;inscrire
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
        <AuthField
          label="Mot de passe"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={state.fieldErrors?.password}
        />

        {state.error ? (
          <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {state.error}
          </p>
        ) : null}

        <FormPendingSubmitButton
          pendingLabel="Connexion…"
          className="btn-hover-grow w-full rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-90"
        >
          Se connecter
        </FormPendingSubmitButton>
      </form>
    </AuthCard>
  );
}
