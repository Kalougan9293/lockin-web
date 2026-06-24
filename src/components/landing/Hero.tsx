import { DemoEntryLink } from "@/components/landing/DemoEntryLink";
import { fredoka } from "@/lib/fonts/fredoka";

export function Hero() {
  return (
    <section className="relative mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-24 text-center">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 animate-pulse-slow rounded-full bg-brand-accent/10 blur-[120px]" />

      <div className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-brand-card px-3 py-1 text-xs font-medium text-brand-accent">
        <span>L&apos;extension de rétention pour votre CRM actuelle.</span>
      </div>

      <h1
        className={`${fredoka.className} mb-6 max-w-4xl text-4xl font-bold leading-[1.15] tracking-tight md:text-6xl`}
      >
        Suivez & relancez vos clients,{" "}
        <br className="hidden md:inline" />
        <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
          simplement
        </span>
        &nbsp;!
      </h1>

      <p className="mb-10 max-w-2xl text-lg font-light leading-relaxed text-brand-muted md:text-xl">
        Importez vos contacts, configurez cadence, ton et rythme — vous gardez
        le contrôle.
      </p>

      <div className="flex items-center justify-center">
        <DemoEntryLink />
      </div>
    </section>
  );
}
