/** Compte admin LockIn — figé en code pour ne pas dépendre d'ADMIN_EMAIL Netlify. */
export const LOCKIN_ADMIN_EMAIL = "contact@lockin-web.online";

export function getAdminEmail(): string {
  return LOCKIN_ADMIN_EMAIL;
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === LOCKIN_ADMIN_EMAIL;
}

export function getDashboardPathForEmail(email: string): "/admin" | "/dashboard" {
  return isAdminEmail(email) ? "/admin" : "/dashboard";
}
