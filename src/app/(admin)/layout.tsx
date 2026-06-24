import { redirect } from "next/navigation";

import { requireAdminUser } from "@/lib/admin/impersonation";
import { isMvpDemoMode } from "@/lib/mvp-demo";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isMvpDemoMode()) {
    return children;
  }

  await requireAdminUser();

  return children;
}
