import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/lib/auth/session";

export const IMPERSONATE_COOKIE = "lockin_impersonate_uid";

export type ImpersonationContext = {
  targetUserId: string;
  targetPrenom: string;
  targetSociete: string;
};

export async function getImpersonatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(IMPERSONATE_COOKIE)?.value ?? null;
}

export async function requireAdminUser() {
  const user = await getCurrentUser();
  if (!user?.email || !isAdminEmail(user.email)) {
    redirect("/dashboard");
  }
  return user;
}

export async function assertAdminApiAccess() {
  const user = await getCurrentUser();
  if (!user?.email || !isAdminEmail(user.email)) {
    throw new Error("Accès administrateur requis.");
  }
  return user;
}

/** ID utilisateur effectif pour le dashboard (impersonation ou session). */
export async function resolveDashboardUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const impersonatedId = await getImpersonatedUserId();
  if (impersonatedId && isAdminEmail(user.email)) {
    return impersonatedId;
  }

  return user.id;
}

export async function getImpersonationDisplayContext(): Promise<ImpersonationContext | null> {
  const user = await getCurrentUser();
  if (!user?.email || !isAdminEmail(user.email)) return null;

  const targetUserId = await getImpersonatedUserId();
  if (!targetUserId) return null;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data } = await admin
    .from("clients_lockin")
    .select("prenom_client, nom_societe")
    .eq("id_client", targetUserId)
    .maybeSingle();

  return {
    targetUserId,
    targetPrenom: data?.prenom_client ?? "Client",
    targetSociete: data?.nom_societe ?? "",
  };
}
