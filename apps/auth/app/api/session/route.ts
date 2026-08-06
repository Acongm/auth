import { NextResponse } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createAuthServerClient } from "@/lib/supabase/server";

export async function GET() {
  if (!getSupabasePublicEnv()) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      configured: false,
    });
  }

  const supabase = await createAuthServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return NextResponse.json({
    authenticated: Boolean(session),
    configured: true,
    user: session?.user
      ? {
          id: session.user.id,
          email: session.user.email,
        }
      : null,
  });
}
