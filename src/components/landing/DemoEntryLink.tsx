"use client";

import { buildDemoDashboardUrl } from "@/lib/mvp-demo";

export function DemoEntryLink() {
  return (
    <button
      type="button"
      onClick={() => {
        window.location.href = buildDemoDashboardUrl();
      }}
      className="flex w-full transform items-center justify-center rounded-xl bg-brand-accent px-8 py-4 font-semibold shadow-lg shadow-brand-accent/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 sm:w-auto"
    >
      Voir démo
    </button>
  );
}
