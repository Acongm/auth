import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@acongm/auth-client/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function middleware(request: NextRequest) {
  // Site URL misconfig often lands OAuth codes on `/` — forward to /callback.
  if (
    request.nextUrl.pathname === "/" &&
    request.nextUrl.searchParams.has("code")
  ) {
    const target = request.nextUrl.clone();
    target.pathname = "/callback";
    return NextResponse.redirect(target);
  }

  const supabaseEnv = getSupabasePublicEnv();
  if (!supabaseEnv) {
    return NextResponse.next({ request });
  }

  try {
    let response = NextResponse.next({
      request,
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
          response = NextResponse.next({ request });
          response.cookies.set(name, value, options);
        },
      },
    });

    await supabase.auth.getUser();
    return response;
  } catch {
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
