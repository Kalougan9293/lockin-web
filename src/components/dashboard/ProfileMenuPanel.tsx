"use client";

import { useActionState, useEffect, useState } from "react";

import {
  getProfileAction,
  updateProfileAction,
  type ProfileActionState,
  type ProfileData,
} from "@/app/actions/profile";
import { AuthField } from "@/components/auth/AuthField";
import { PasswordCriteria } from "@/components/auth/PasswordCriteria";
import { MVP_DEMO_PROFILE } from "@/lib/mvp-demo";
import { useDemoSession } from "@/hooks/useDemoSession";

const initialState: ProfileActionState = {};

export function ProfileMenuPanel() {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialState,
  );
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { active: demoMode } = useDemoSession();

  useEffect(() => {
    setLoading(true);
    setPassword("");
    setConfirmPassword("");

    if (demoMode) {
      setProfile({ ...MVP_DEMO_PROFILE });
      setLoading(false);
      return;
    }

    getProfileAction()
      .then((data) => setProfile(data))
      .finally(() => setLoading(false));
  }, [demoMode]);

  return (
    <div className="border-t border-white/10 px-3 py-2.5">
      {loading || !profile ? (
        <p className="py-3 text-center text-xs text-brand-muted">Chargement…</p>
      ) : (
        <form
          action={demoMode ? undefined : formAction}
          className="space-y-2.5"
          onClick={(event) => event.stopPropagation()}
        >
          {demoMode ? (
            <p className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-2.5 py-2 text-[11px] leading-relaxed text-amber-100/90">
              Mode démo — modification à la mise en ligne.
            </p>
          ) : null}

          <AuthField
            label="Prénom"
            name="prenom"
            type="text"
            defaultValue={profile.prenom}
            required
            className="!py-2 text-sm"
          />
          <AuthField
            label="Société"
            name="nomSociete"
            type="text"
            defaultValue={profile.nomSociete}
            required
            className="!py-2 text-sm"
          />
          <AuthField
            label="Mail"
            name="email"
            type="email"
            defaultValue={profile.email}
            required
            className="!py-2 text-sm"
          />

          <div className="space-y-2 border-t border-white/10 pt-2">
            <p className="text-[11px] font-medium text-brand-muted">Mot de passe</p>
            <AuthField
              label="Nouveau"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Optionnel"
              className="!py-2 text-sm"
            />
            {password ? <PasswordCriteria password={password} /> : null}
            <AuthField
              label="Confirmer"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Optionnel"
              className="!py-2 text-sm"
            />
          </div>

          {state.error ? (
            <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-2.5 py-2 text-[11px] text-red-300">
              {state.error}
            </p>
          ) : null}

          {state.success ? (
            <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-2 text-[11px] text-emerald-300">
              {state.success}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={demoMode || isPending}
            className="w-full rounded-lg bg-brand-accent px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      )}
    </div>
  );
}
