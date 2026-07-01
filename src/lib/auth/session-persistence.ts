import type { CookieOptions } from "@supabase/ssr";

export const REMEMBER_ME_COOKIE = "lockin-remember-me";
const PERSISTENT_MAX_AGE = 60 * 60 * 24 * 400;

type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

export function readRememberMePreference(cookies: CookieReader): boolean {
  const value = cookies.get(REMEMBER_ME_COOKIE)?.value;
  if (value === undefined) return true;
  return value === "1";
}

export function applyAuthCookiePersistence(
  options: CookieOptions,
  rememberMe: boolean,
): CookieOptions {
  if (rememberMe) {
    return { ...options, maxAge: PERSISTENT_MAX_AGE };
  }

  const { maxAge: _maxAge, expires: _expires, ...sessionOptions } = options;
  return sessionOptions;
}

export function rememberMeCookieOptions(rememberMe: boolean): CookieOptions {
  const base: CookieOptions = {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  if (rememberMe) {
    return { ...base, maxAge: PERSISTENT_MAX_AGE };
  }

  return base;
}

export function clearRememberMeCookieOptions(): CookieOptions {
  return {
    path: "/",
    maxAge: 0,
  };
}
