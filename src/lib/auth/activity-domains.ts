export const ACTIVITY_DOMAINS = [
  "Sport",
  "Transport",
  "Commerce",
  "Restauration",
  "Santé",
  "Bâtiment",
  "Services",
  "Autre",
] as const;

export type ActivityDomain = (typeof ACTIVITY_DOMAINS)[number];

export function isActivityDomain(value: string): value is ActivityDomain {
  return (ACTIVITY_DOMAINS as readonly string[]).includes(value);
}

export const ACTIVITY_DOMAIN_UNSET_LABEL = "Non renseigné";

export const ACTIVITY_DOMAIN_COLORS: Record<ActivityDomain, string> = {
  Sport: "#34d399",
  Transport: "#38bdf8",
  Commerce: "#a78bfa",
  Restauration: "#fb923c",
  Santé: "#fb7185",
  Bâtiment: "#fbbf24",
  Services: "#818cf8",
  Autre: "#94a3b8",
};

export const ACTIVITY_DOMAIN_UNSET_COLOR = "#71717a";

export function getActivityDomainColor(label: string): string {
  if (isActivityDomain(label)) {
    return ACTIVITY_DOMAIN_COLORS[label];
  }
  return ACTIVITY_DOMAIN_UNSET_COLOR;
}
