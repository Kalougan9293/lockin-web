"use client";

import { useMemo, useState } from "react";

import {
  ACTIVITY_DOMAIN_UNSET_LABEL,
  getActivityDomainColor,
} from "@/lib/auth/activity-domains";
import type { ActivityDomainStat } from "@/lib/admin/activity-domain-stats";
import { fredoka } from "@/lib/fonts/fredoka";

type AdminActivityDomainChartProps = {
  stats: ActivityDomainStat[];
};

type ChartSegment = ActivityDomainStat & {
  id: string;
  color: string;
  startAngle: number;
  endAngle: number;
};

const CX = 100;
const CY = 100;
const OUTER_R = 78;
const INNER_R = 48;

function polarToCartesian(radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(angleRad),
    y: CY + radius * Math.sin(angleRad),
  };
}

function describeDonutSegment(
  startAngle: number,
  endAngle: number,
  outerR: number,
  innerR: number,
) {
  const startOuter = polarToCartesian(outerR, endAngle);
  const endOuter = polarToCartesian(outerR, startAngle);
  const startInner = polarToCartesian(innerR, startAngle);
  const endInner = polarToCartesian(innerR, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

function buildSegments(stats: ActivityDomainStat[]): ChartSegment[] {
  let cursor = 0;

  return stats.map((stat, index) => {
    const isLast = index === stats.length - 1;
    const sweep = isLast
      ? Math.max(0, 360 - cursor)
      : (stat.percent / 100) * 360;
    const safeSweep = sweep >= 359.99 ? 359.99 : sweep;
    const segment: ChartSegment = {
      ...stat,
      id: stat.label,
      color: getActivityDomainColor(stat.label),
      startAngle: cursor,
      endAngle: cursor + safeSweep,
    };
    cursor += safeSweep;
    return segment;
  });
}

export function AdminActivityDomainChart({ stats }: AdminActivityDomainChartProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const segments = useMemo(() => buildSegments(stats), [stats]);
  const total = useMemo(
    () => stats.reduce((sum, stat) => sum + stat.count, 0),
    [stats],
  );

  const activeSegment =
    segments.find((segment) => segment.id === activeId) ?? null;

  if (total === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center text-sm text-brand-muted">
        Aucun client inscrit pour afficher la répartition par domaine.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div className="mb-5 text-center sm:text-left">
        <h3 className="text-base font-semibold text-white">
          Répartition par domaine d&apos;activité
        </h3>
        <p className="mt-1 text-xs text-brand-muted">
          {total} client{total > 1 ? "s" : ""} inscrit{total > 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-center">
        <div className="relative w-full max-w-[240px]">
          <svg viewBox="0 0 200 200" className="h-auto w-full" role="img" aria-label="Graphique en anneau des domaines d'activité">
            {segments.map((segment) => {
              const isActive = activeId === null || activeId === segment.id;

              return (
                <path
                  key={segment.id}
                  d={describeDonutSegment(
                    segment.startAngle,
                    segment.endAngle,
                    OUTER_R,
                    INNER_R,
                  )}
                  fill={segment.color}
                  opacity={isActive ? 1 : 0.35}
                  className="transition-opacity duration-200"
                  onMouseEnter={() => setActiveId(segment.id)}
                  onMouseLeave={() => setActiveId(null)}
                  onFocus={() => setActiveId(segment.id)}
                  onBlur={() => setActiveId(null)}
                  tabIndex={0}
                  aria-label={`${segment.label} : ${segment.count} client${segment.count > 1 ? "s" : ""}`}
                />
              );
            })}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            {activeSegment ? (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wide text-brand-muted">
                  {activeSegment.label}
                </p>
                <p className={`${fredoka.className} text-2xl font-bold text-white`}>
                  {activeSegment.count}
                </p>
                <p className="text-xs text-brand-muted">
                  {activeSegment.percent.toLocaleString("fr-FR", {
                    maximumFractionDigits: 1,
                  })}
                  %
                </p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wide text-brand-muted">
                  Total
                </p>
                <p className={`${fredoka.className} text-2xl font-bold text-white`}>
                  {total}
                </p>
              </>
            )}
          </div>
        </div>

        <ul className="grid w-full max-w-md gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {segments.map((segment) => {
            const isActive = activeId === segment.id;

            return (
              <li key={segment.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveId(segment.id)}
                  onMouseLeave={() => setActiveId(null)}
                  onFocus={() => setActiveId(segment.id)}
                  onBlur={() => setActiveId(null)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    isActive
                      ? "border-white/20 bg-white/[0.08]"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/10"
                      style={{ backgroundColor: segment.color }}
                      aria-hidden
                    />
                    <span className="truncate text-sm text-white">{segment.label}</span>
                  </span>
                  <span className="shrink-0 text-right text-xs text-brand-muted">
                    <span className="font-semibold tabular-nums text-white">
                      {segment.count}
                    </span>
                    {" · "}
                    {segment.percent.toLocaleString("fr-FR", {
                      maximumFractionDigits: 1,
                    })}
                    %
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {stats.some((stat) => stat.label === ACTIVITY_DOMAIN_UNSET_LABEL) ? (
        <p className="mt-4 text-center text-[11px] text-brand-muted lg:text-left">
          « Non renseigné » regroupe les comptes créés avant l&apos;ajout du champ
          domaine d&apos;activité.
        </p>
      ) : null}
    </div>
  );
}
