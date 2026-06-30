"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { signUpAction, type AuthActionState } from "@/app/actions/auth";
import { ACTIVITY_DOMAINS } from "@/lib/auth/activity-domains";

import { AuthCard } from "./AuthCard";
import { AuthField } from "./AuthField";
import { AuthSelect } from "./AuthSelect";
import { PasswordCriteria } from "./PasswordCriteria";

const initialState: AuthActionState = {};

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);
  const [password, setPassword] = useState("");

  if (state.success) {
    return (
      <AuthCard title="Inscription réussie">
        <p className="text-center text-sm leading-relaxed text-brand-muted">
          {state.success}
        </p>
        <Link
          href="/login"
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold transition-colors hover:bg-indigo-500"
        >
          Aller à la connexion
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Créer un compte"
      footer={
        <span className="text-brand-muted">
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-medium text-white hover:text-brand-accent">
            Se connecter
          </Link>
        </span>
      }
    >
      <form action={formAction} className="space-y-5">
        <AuthField
          label="Prénom"
          name="prenom"
          type="text"
          autoComplete="given-name"
          required
          error={state.fieldErrors?.prenom}
        />
        <AuthField
          label="Société"
          name="nomSociete"
          type="text"
          autoComplete="organization"
          required
          error={state.fieldErrors?.nomSociete}
        />
        <AuthSelect
          label="Domaine d'activité"
          name="domaineActivite"
          required
          defaultValue=""
          options={ACTIVITY_DOMAINS.map((domain) => ({
            value: domain,
            label: domain,
          }))}
          placeholder="Choisissez votre secteur"
          error={state.fieldErrors?.domaineActivite}
        />
        <AuthField
          label="Mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={state.fieldErrors?.email}
        />
        <div className="space-y-2">
          <AuthField
            label="Mot de passe"
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

        <div className="space-y-2">
          <label className="flex items-start gap-3 text-sm text-brand-muted">
            <input
              type="checkbox"
              name="acceptCgu"
              required
              className="mt-1 h-4 w-4 rounded border-white/20 bg-brand-dark text-brand-accent focus:ring-brand-accent/30"
            />
            <span>
              J&apos;accepte les{" "}
              <Link href="/cgu" className="text-white underline-offset-2 hover:underline">
                conditions générales d&apos;utilisation
              </Link>{" "}
              et la{" "}
              <Link
                href="/confidentialite"
                className="text-white underline-offset-2 hover:underline"
              >
                politique de confidentialité
              </Link>
              .
            </span>
          </label>
          {state.fieldErrors?.acceptCgu ? (
            <p className="text-xs text-red-400">{state.fieldErrors.acceptCgu}</p>
          ) : null}
        </div>

        {state.error ? (
          <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="btn-hover-grow w-full rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Inscription en cours…" : "S'inscrire"}
        </button>
      </form>
    </AuthCard>
  );
}
