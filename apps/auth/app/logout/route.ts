import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@acongm/auth-client/server";
import { getDefaultReturnTo } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/login", request.url).toString(),
  );

  const supabase = createServerClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const returnTo = request.nextUrl.searchParams.get("return_to");
  if (returnTo) {
    return NextResponse.redirect(returnTo);
  }

  return NextResponse.redirect(getDefaultReturnTo());
}
