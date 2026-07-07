"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isActivityDomain } from "@/lib/auth/activity-domains";
import {
  ensureClientFromAuthUser,
  ensureClientWithAdmin,
  ensureClientWithSession,
} from "@/lib/auth/ensure-client";
import { getDashboardPathForEmail } from "@/lib/auth/redirect";
import {
  getFirstError,
  validateSignIn,
  validateSignUp,
} from "@/lib/auth/validation";
import { getAppOrigin } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type SignUpFormValues = {
  prenom: string;
  nomSociete: string;
  domaineActivite: string;
  email: string;
  acceptCgu: boolean;
};

export type AuthActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
  values?: SignUpFormValues;
};

function toSignUpFormValues(input: {
  prenom: string;
  nomSociete: string;
  domaineActivite: string;
  email: string;
  acceptCgu: boolean;
}): SignUpFormValues {
  return {
    prenom: input.prenom,
    nomSociete: input.nomSociete,
    domaineActivite: input.domaineActivite,
    email: input.email,
    acceptCgu: input.acceptCgu,
  };
}

async function getOrigin(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "https";
  if (host) return `${protocol}://${host}`;
  return getAppOrigin();
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const domaineActivite = String(formData.get("domaineActivite") ?? "").trim();

  const input = {
    prenom: String(formData.get("prenom") ?? ""),
    nomSociete: String(formData.get("nomSociete") ?? ""),
    domaineActivite,
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    acceptCgu: formData.get("acceptCgu") === "on",
  };

  const fieldErrors = validateSignUp(input);
  const firstError = getFirstError(fieldErrors);
  if (firstError) {
    return {
      error: firstError,
      fieldErrors: fieldErrors as Record<string, string>,
      values: toSignUpFormValues(input),
    };
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const domaine = isActivityDomain(domaineActivite) ? domaineActivite : null;

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        prenom_client: input.prenom.trim(),
        nom_societe: input.nomSociete.trim(),
        domaine_activite: domaine,
        pays: "France",
      },
    },
  });

  if (error) {
    return {
      error:
        error.message.includes("Invalid API key") ||
        error.message.includes("Failed to fetch")
          ? "Connexion Supabase impossible. Vérifiez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans lockin-web/.env.local."
          : error.message,
      values: toSignUpFormValues(input),
    };
  }

  if (data.user) {
    const clientPayload = {
      idClient: data.user.id,
      prenomClient: input.prenom.trim(),
      nomSociete: input.nomSociete.trim(),
      ...(domaine ? { domaineActivite: domaine } : {}),
    };

    const clientError = await ensureClientWithAdmin(clientPayload);

    if (clientError) {
      console.warn("[signUp] clients_lockin admin upsert:", clientError);
    }

    if (data.session && data.user.email) {
      await ensureClientWithSession(supabase, clientPayload);
      redirect(getDashboardPathForEmail(data.user.email));
    }
  }

  return {
    success: "Merci pour votre inscription ! Vous pouvez maintenant vous connecter.",
  };
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const input = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const fieldErrors = validateSignIn(input);
  const firstError = getFirstError(fieldErrors);
  if (firstError) {
    return {
      error: firstError,
      fieldErrors: fieldErrors as Record<string, string>,
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  });

  if (error) {
    return { error: "Email ou mot de passe incorrect." };
  }

  const user = data.user;
  if (!user?.email) {
    return { error: "Impossible de récupérer votre session." };
  }

  const clientError = await ensureClientFromAuthUser(supabase, user);
  if (clientError) {
    console.warn("[signIn] clients_lockin upsert:", clientError);
  }

  redirect(getDashboardPathForEmail(user.email));
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
