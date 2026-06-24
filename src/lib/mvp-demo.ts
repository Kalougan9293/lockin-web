export const DEMO_SEARCH_PARAM = "demo";
export const DEMO_SESSION_PARAM = "s";

/**
 * Démo éphémère via « Voir démo » (?demo=1) :
 * - pas de persistance Supabase ;
 * - pas de relance_deliveries / N8N / envoi mail ;
 * - voyants relance calculés uniquement sur les dates (fictif).
 */
export function isEphemeralDemoUrl(
  searchParams: { get: (key: string) => string | null },
): boolean {
  return searchParams.get(DEMO_SEARCH_PARAM) === "1";
}

/** Accès dashboard sans login — activer avec NEXT_PUBLIC_MVP_DEMO_MODE=true */
export function isMvpDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_MVP_DEMO_MODE === "true";
}

export function isDemoDashboardUrl(
  searchParams: { get: (key: string) => string | null },
): boolean {
  return isEphemeralDemoUrl(searchParams);
}

export function buildDemoDashboardUrl(): string {
  return `/dashboard?${DEMO_SEARCH_PARAM}=1&${DEMO_SESSION_PARAM}=${Date.now()}`;
}

export const MVP_DEMO_PROFILE = {
  prenom: "Démo",
  nomSociete: "Ma société",
  email: "demo@lockin.app",
} as const;
