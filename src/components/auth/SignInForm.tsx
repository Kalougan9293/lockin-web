"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInAction, type AuthActionState } from "@/app/actions/auth";

import { AuthCard } from "./AuthCard";
import { AuthField } from "./AuthField";

const initialState: AuthActionState = {};

export function SignInForm() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <AuthCard
      title="Connexion"
      description="Accédez à votre espace LockIn."
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

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </AuthCard>
  );
}
