import {
  ACTIVITY_DOMAIN_UNSET_LABEL,
  ACTIVITY_DOMAINS,
  isActivityDomain,
} from "@/lib/auth/activity-domains";
import type { ClientLockin } from "@/types/database";
import { isAdminEmail } from "@/lib/auth/redirect";

export type ActivityDomainStat = {
  label: string;
  count: number;
  percent: number;
};

export function buildActivityDomainStats(
  clients: ClientLockin[],
  emailById: Map<string, string>,
  domaineById?: Map<string, string | null>,
): ActivityDomainStat[] {
  const counts = new Map<string, number>();

  for (const domain of ACTIVITY_DOMAINS) {
    counts.set(domain, 0);
  }
  counts.set(ACTIVITY_DOMAIN_UNSET_LABEL, 0);

  for (const client of clients) {
    const email = emailById.get(client.id_client) ?? "";
    if (isAdminEmail(email)) continue;

    const fallbackDomaine = domaineById?.get(client.id_client) ?? null;
    const rawDomaine = client.domaine_activite ?? fallbackDomaine;
    const label =
      rawDomaine && isActivityDomain(rawDomaine)
        ? rawDomaine
        : ACTIVITY_DOMAIN_UNSET_LABEL;

    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const entries = [...counts.entries()].filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) return [];

  return entries
    .map(([label, count]) => ({
      label,
      count,
      percent: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}
