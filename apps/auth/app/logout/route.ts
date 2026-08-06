import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@acongm/auth-client/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { getDefaultReturnTo } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/login", request.url).toString(),
  );

  const supabaseEnv = getSupabasePublicEnv();
  if (supabaseEnv) {
    const supabase = createServerClient({
      supabaseUrl: supabaseEnv.supabaseUrl,
      supabaseAnonKey: supabaseEnv.supabaseAnonKey,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set(name, value, options);
      },
    },
  });

    await supabase.auth.signOut();
  }

  const returnTo = request.nextUrl.searchParams.get("return_to");
  if (returnTo) {
    return NextResponse.redirect(returnTo);
  }

  return NextResponse.redirect(getDefaultReturnTo());
}
