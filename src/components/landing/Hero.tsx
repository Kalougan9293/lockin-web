import { DemoEntryLink } from "@/components/landing/DemoEntryLink";
import { fredoka } from "@/lib/fonts/fredoka";

export function Hero() {
  return (
    <section className="relative mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center gap-12 overflow-hidden px-6 pb-20 pt-24 text-center md:gap-14">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 animate-pulse-slow rounded-full bg-brand-accent/10 blur-[120px]" />

      <h1
        className={`${fredoka.className} max-w-4xl text-4xl font-bold leading-[1.15] tracking-tight md:text-6xl`}
      >
        Suivez & relancez vos factures,{" "}
        <br className="hidden md:inline" />
        <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
          simplement
        </span>
        &nbsp;!
      </h1>

      <p className="max-w-2xl text-lg font-light leading-relaxed text-white/90 md:text-xl">
        Importez. Configurez. Automatisez.
        <br />
        Choisissez la cadence, le ton et le rythme de vos relances.
      </p>

      <div className="flex flex-col items-center gap-5">
        <DemoEntryLink />
        <p className="text-xs font-medium text-brand-muted">
          L&apos;extension de rétention pour votre CRM actuelle.
        </p>
      </div>
    </section>
  );
}
