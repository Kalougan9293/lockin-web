import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { classifyServerImportFiles } from "./process-server-import";

type AdminClient = SupabaseClient<Database>;

/** Plafond beta : appels Claude (1 par PDF ou 1 par CSV) par mois et par compte. */
export const BETA_MAX_IA_IMPORTS_PER_MONTH = 30;

export function getCurrentImportMonthKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}

export function countIaCallsForFiles(files: File[]): number {
  const { pdfs, csvs } = classifyServerImportFiles(files);
  return pdfs.length + (csvs.length > 0 ? 1 : 0);
}

export function resolveMonthlyImportCount(
  count: number | null | undefined,
  month: string | null | undefined,
): number {
  if (month !== getCurrentImportMonthKey()) return 0;
  return count ?? 0;
}

export async function getMonthlyImportUsage(
  admin: AdminClient,
  userId: string,
): Promise<number> {
  const { data, error } = await admin
    .from("clients_lockin")
    .select("imports_ia_count, imports_ia_month")
    .eq("id_client", userId)
    .maybeSingle();

  if (error) throw error;
  return resolveMonthlyImportCount(data?.imports_ia_count, data?.imports_ia_month);
}

export function buildImportQuotaError(used: number, requested: number): string {
  const remaining = Math.max(0, BETA_MAX_IA_IMPORTS_PER_MONTH - used);
  if (remaining === 0) {
    return `Limite beta atteinte (${BETA_MAX_IA_IMPORTS_PER_MONTH} imports IA ce mois). Réessayez le mois prochain.`;
  }
  return `Limite beta : il vous reste ${remaining} import${remaining > 1 ? "s" : ""} IA ce mois (vous en demandez ${requested}).`;
}

export async function assertImportQuota(
  admin: AdminClient,
  userId: string,
  requestedCalls: number,
): Promise<string | null> {
  if (requestedCalls <= 0) return "Aucun fichier à importer.";
  const used = await getMonthlyImportUsage(admin, userId);
  if (used + requestedCalls > BETA_MAX_IA_IMPORTS_PER_MONTH) {
    return buildImportQuotaError(used, requestedCalls);
  }
  return null;
}

export async function recordImportUsage(
  admin: AdminClient,
  userId: string,
  calls: number,
): Promise<void> {
  if (calls <= 0) return;

  const month = getCurrentImportMonthKey();
  const used = await getMonthlyImportUsage(admin, userId);

  const { error } = await admin
    .from("clients_lockin")
    .update({
      imports_ia_count: used + calls,
      imports_ia_month: month,
    })
    .eq("id_client", userId);

  if (error) throw error;
}
