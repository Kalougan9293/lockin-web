"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  IMPERSONATE_COOKIE,
  requireAdminUser,
} from "@/lib/admin/impersonation";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteUserAccountData } from "@/lib/auth/delete-user-account";

export type AdminActionState = {
  error?: string;
  success?: string;
};

export async function startImpersonationAction(userId: string) {
  await requireAdminUser();

  const admin = createAdminClient();
  const { data: client } = await admin
    .from("clients_lockin")
    .select("id_client")
    .eq("id_client", userId)
    .maybeSingle();

  if (!client) {
    return { error: "Client introuvable." } satisfies AdminActionState;
  }

  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATE_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4,
  });

  redirect("/dashboard");
}

export async function stopImpersonationAction() {
  await requireAdminUser();

  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATE_COOKIE);

  redirect("/admin");
}

export async function deleteProviderAction(
  userId: string,
): Promise<AdminActionState> {
  await requireAdminUser();

  const admin = createAdminClient();

  const result = await deleteUserAccountData(admin, userId);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin");
  return { success: "Client supprimé." };
}
