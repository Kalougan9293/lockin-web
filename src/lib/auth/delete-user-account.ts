import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type AdminSupabase = SupabaseClient<Database>;

export async function deleteUserAccountData(
  admin: AdminSupabase,
  userId: string,
): Promise<{ error?: string }> {
  const { error: deleteTablesError } = await admin
    .from("tableaux")
    .delete()
    .eq("user_id", userId);

  if (deleteTablesError) {
    return { error: `Suppression des tableaux : ${deleteTablesError.message}` };
  }

  const { error: deleteClientError } = await admin
    .from("clients_lockin")
    .delete()
    .eq("id_client", userId);

  if (deleteClientError) {
    return { error: `Suppression du profil : ${deleteClientError.message}` };
  }

  const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);

  if (deleteAuthError) {
    return { error: `Suppression du compte : ${deleteAuthError.message}` };
  }

  return {};
}
