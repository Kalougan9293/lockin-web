"use client";

import { buildDemoDashboardUrl } from "@/lib/mvp-demo";

export function DemoEntryLink() {
  return (
    <button
      type="button"
      onClick={() => {
        window.location.href = buildDemoDashboardUrl();
      }}
      className="demo-cta-btn demo-cta-pulse flex w-full items-center justify-center rounded-xl bg-brand-accent px-8 py-4 font-semibold sm:w-auto"
    >
      Commencer la démo
    </button>
  );
}
