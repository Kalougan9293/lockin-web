import { NextResponse } from "next/server";

import { ensureClientFromAuthUser } from "@/lib/auth/ensure-client";
import { getDashboardPathForEmail } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const clientError = await ensureClientFromAuthUser(supabase, user);
        if (clientError) {
          console.warn("[auth/callback] clients_lockin upsert:", clientError);
        }
      }

      const redirectPath = user?.email
        ? getDashboardPathForEmail(user.email)
        : "/dashboard";

      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
