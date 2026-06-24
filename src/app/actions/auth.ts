"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ensureClientWithAdmin, ensureClientWithSession } from "@/lib/auth/ensure-client";
import { getDashboardPathForEmail } from "@/lib/auth/redirect";
import {
  getFirstError,
  validateSignIn,
  validateSignUp,
} from "@/lib/auth/validation";
import { getAppOrigin } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

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
  const input = {
    prenom: String(formData.get("prenom") ?? ""),
    nomSociete: String(formData.get("nomSociete") ?? ""),
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
    };
  }

  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        prenom_client: input.prenom.trim(),
        nom_societe: input.nomSociete.trim(),
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
    };
  }

  if (data.user) {
    const clientPayload = {
      idClient: data.user.id,
      prenomClient: input.prenom.trim(),
      nomSociete: input.nomSociete.trim(),
    };

    const clientError = await ensureClientWithAdmin(clientPayload);

    if (clientError) {
      console.warn("[signUp] clients_lockin admin upsert:", clientError);
    }
  }

  return {
    success:
      "Inscription enregistrée. Consultez votre boîte mail pour confirmer votre adresse avant de vous connecter.",
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

  const metadata = user.user_metadata ?? {};
  await ensureClientWithSession(supabase, {
    idClient: user.id,
    prenomClient: String(metadata.prenom_client ?? ""),
    nomSociete: String(metadata.nom_societe ?? ""),
  });

  redirect(getDashboardPathForEmail(user.email));
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
