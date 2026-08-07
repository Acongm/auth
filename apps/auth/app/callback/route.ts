import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@acongm/auth-client/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import {
  getAllowedReturnHosts,
  getDefaultReturnTo,
} from "@/lib/supabase/server";
import { AUTH_RETURN_TO_COOKIE, sanitizeReturnTo } from "@/lib/utils";

function readReturnTo(request: NextRequest): string | null {
  const fromQuery = request.nextUrl.searchParams.get("return_to");
  if (fromQuery) return fromQuery;

  const raw = request.cookies.get(AUTH_RETURN_TO_COOKIE)?.value;
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const returnTo = readReturnTo(request);
  const fallback = getDefaultReturnTo();
  const destination = sanitizeReturnTo(
    returnTo,
    fallback,
    getAllowedReturnHosts(),
  );

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabaseEnv = getSupabasePublicEnv();
  if (!supabaseEnv) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "supabase_not_configured");
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(destination);
  response.cookies.set(AUTH_RETURN_TO_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });

  const supabase = createServerClient({
    supabaseUrl: supabaseEnv.supabaseUrl,
    supabaseAnonKey: supabaseEnv.supabaseAnonKey,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set(name, value);
        response.cookies.set(name, value, options);
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "oauth_callback_failed");
    if (returnTo) {
      loginUrl.searchParams.set("return_to", returnTo);
    }
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
