"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { validatePassword } from "@/lib/auth/validation";

export type ProfileData = {
  prenom: string;
  nomSociete: string;
  email: string;
};

export type ProfileActionState = {
  error?: string;
  success?: string;
};

export async function getProfileAction(): Promise<ProfileData | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("clients_lockin")
    .select("prenom_client, nom_societe")
    .eq("id_client", user.id)
    .maybeSingle();

  return {
    prenom: data?.prenom_client ?? String(user.user_metadata?.prenom_client ?? ""),
    nomSociete: data?.nom_societe ?? String(user.user_metadata?.nom_societe ?? ""),
    email: user.email ?? "",
  };
}

export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Session expirée. Reconnectez-vous." };
  }

  const prenom = String(formData.get("prenom") ?? "").trim();
  const nomSociete = String(formData.get("nomSociete") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!prenom) return { error: "Le prénom est requis." };
  if (!nomSociete) return { error: "La société est requise." };
  if (!email) return { error: "L'email est requis." };

  const supabase = await createClient();

  const { error: clientError } = await supabase
    .from("clients_lockin")
    .update({
      prenom_client: prenom,
      nom_societe: nomSociete,
      updated_at: new Date().toISOString(),
    })
    .eq("id_client", user.id);

  if (clientError) {
    return { error: `Profil : ${clientError.message}` };
  }

  const authUpdates: { email?: string; password?: string; data?: Record<string, string> } = {
    data: {
      prenom_client: prenom,
      nom_societe: nomSociete,
    },
  };

  if (email !== user.email) {
    authUpdates.email = email;
  }

  if (password || confirmPassword) {
    if (password !== confirmPassword) {
      return { error: "Les mots de passe ne correspondent pas." };
    }
    const passwordError = validatePassword(password);
    if (passwordError) return { error: passwordError };
    authUpdates.password = password;
  }

  const { error: authError } = await supabase.auth.updateUser(authUpdates);

  if (authError) {
    return { error: authError.message };
  }

  if (authUpdates.email && authUpdates.email !== user.email) {
    return {
      success:
        "Profil mis à jour. Un email de confirmation a été envoyé pour valider la nouvelle adresse.",
    };
  }

  return { success: "Profil mis à jour." };
}
