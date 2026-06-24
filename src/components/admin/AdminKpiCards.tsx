import type { AdminKpis } from "@/lib/admin/queries";
import { fredoka } from "@/lib/fonts/fredoka";

type AdminKpiCardsProps = {
  kpis: AdminKpis;
};

const cards: {
  key: keyof AdminKpis;
  label: string;
  accent: string;
}[] = [
  {
    key: "providerCount",
    label: "Nombre de clients",
    accent: "from-violet-500/30 via-violet-500/10 to-transparent ring-violet-400/25",
  },
  {
    key: "invoiceCount",
    label: "Factures suivies",
    accent: "from-fuchsia-500/30 via-fuchsia-500/10 to-transparent ring-fuchsia-400/25",
  },
  {
    key: "relanceCount",
    label: "Relances effectuées",
    accent: "from-indigo-500/30 via-indigo-500/10 to-transparent ring-indigo-400/25",
  },
];

export function AdminKpiCards({ kpis }: AdminKpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`rounded-2xl border border-white/10 bg-gradient-to-br ${card.accent} p-5 text-center shadow-lg shadow-violet-950/20 ring-1`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-brand-muted">
            {card.label}
          </p>
          <p
            className={`${fredoka.className} mt-2 text-4xl font-bold tabular-nums text-white`}
          >
            {kpis[card.key].toLocaleString("fr-FR")}
          </p>
        </div>
      ))}
    </div>
  );
}
