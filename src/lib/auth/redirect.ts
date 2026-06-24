export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

export function isAdminEmail(email: string | undefined | null): boolean {
  const adminEmail = getAdminEmail();
  if (!adminEmail || !email) return false;
  return email.trim().toLowerCase() === adminEmail;
}

export function getDashboardPathForEmail(email: string): "/admin" | "/dashboard" {
  return isAdminEmail(email) ? "/admin" : "/dashboard";
}
