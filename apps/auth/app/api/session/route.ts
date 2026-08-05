import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createAuthServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return NextResponse.json({
    authenticated: Boolean(session),
    user: session?.user
      ? {
          id: session.user.id,
          email: session.user.email,
        }
      : null,
  });
}
