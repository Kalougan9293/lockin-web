"use client";

import { useSearchParams } from "next/navigation";

import { DEMO_SESSION_PARAM, isDemoDashboardUrl } from "@/lib/mvp-demo";

export function useDemoSession() {
  const searchParams = useSearchParams();
  const fromUrl = isDemoDashboardUrl(searchParams);
  const sessionKey = searchParams.get(DEMO_SESSION_PARAM) ?? "default";

  return { active: fromUrl, fromUrl, sessionKey };
}
