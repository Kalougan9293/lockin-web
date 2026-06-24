export function formatSupabaseError(error: unknown): string {
  if (!error) return "Erreur inconnue.";

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    if (typeof record.error_description === "string") {
      return record.error_description;
    }
    if (typeof record.hint === "string" && record.hint.trim()) {
      return record.hint;
    }
  }

  return "Erreur Supabase. Vérifiez SUPABASE_SERVICE_ROLE_KEY dans lockin-web/.env.local.";
}
