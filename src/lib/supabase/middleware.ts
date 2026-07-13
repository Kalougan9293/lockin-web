import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { IMPERSONATE_COOKIE } from "@/lib/admin/impersonation";
import { getDashboardPathForEmail, isAdminEmail } from "@/lib/auth/redirect";
import { DEMO_SEARCH_PARAM, isMvpDemoMode } from "@/lib/mvp-demo";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];
const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isProtectedRoute(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function withDemoAccess(request: NextRequest, response: NextResponse) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-lockin-demo", "1");

  const demoResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.cookies.getAll().forEach((cookie) => {
    demoResponse.cookies.set(cookie);
  });

  return demoResponse;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isDemoDashboard =
    pathname.startsWith("/dashboard") &&
    request.nextUrl.searchParams.get(DEMO_SEARCH_PARAM) === "1";

  if (!user && isProtectedRoute(pathname)) {
    if (isDemoDashboard) {
      return withDemoAccess(request, response);
    }

    if (isMvpDemoMode() && pathname.startsWith("/dashboard")) {
      return withDemoAccess(request, response);
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthRoute(pathname) && !isMvpDemoMode()) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = getDashboardPathForEmail(user.email ?? "");
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  if (user && pathname.startsWith("/admin") && !isAdminEmail(user.email)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  if (
    user &&
    pathname.startsWith("/dashboard") &&
    isAdminEmail(user.email) &&
    !request.cookies.get(IMPERSONATE_COOKIE)?.value &&
    !isMvpDemoMode() &&
    !isDemoDashboard
  ) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    adminUrl.search = "";
    return NextResponse.redirect(adminUrl);
  }

  if (isDemoDashboard) {
    return withDemoAccess(request, response);
  }

  return response;
}
