import type { ActivityDomainStat } from "@/lib/admin/activity-domain-stats";

type AdminActivityDomainChartProps = {
  stats: ActivityDomainStat[];
};

export function AdminActivityDomainChart({ stats }: AdminActivityDomainChartProps) {
  if (stats.length === 0) return null;

  return (
    <div className="border-t border-white/10 pt-4">
      <p className="text-xs text-brand-muted/75">
        {stats.map((stat, index) => (
          <span key={stat.label}>
            {index > 0 ? (
              <span className="mx-2 text-brand-muted/40" aria-hidden>
                ·
              </span>
            ) : null}
            {stat.label} - {stat.count}
          </span>
        ))}
      </p>
    </div>
  );
}
