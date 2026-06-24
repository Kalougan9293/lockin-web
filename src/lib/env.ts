function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function normalizeSupabaseUrl(url: string): string {
  return trimTrailingSlash(
    url.trim().replace(/\/rest\/v1\/?$/i, ""),
  );
}

function normalizeAppUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimTrailingSlash(trimmed);
  return `https://${trimTrailingSlash(trimmed)}`;
}

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export function isSupabaseConfigured(): boolean {
  return Boolean(rawSupabaseUrl && supabaseAnonKey);
}

export function getSupabaseEnv() {
  if (!rawSupabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Variables Supabase manquantes. Créez lockin-web/.env.local (voir .env.local.example).",
    );
  }

  return {
    url: normalizeSupabaseUrl(rawSupabaseUrl),
    anonKey: supabaseAnonKey,
  };
}

/** URL publique de l'app (Vercel, Netlify ou domaine custom). */
export function getAppOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return normalizeAppUrl(explicit);

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return normalizeAppUrl(vercelUrl);

  const netlifyUrl = process.env.URL?.trim();
  if (netlifyUrl) return normalizeAppUrl(netlifyUrl);

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL manquante en production (ex. https://app.lockin.app).",
    );
  }

  return "http://localhost:3000";
}