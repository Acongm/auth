import { NextResponse } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createAuthServerClient } from "@/lib/supabase/server";

const API_SESSION =
  process.env.AUTH_SESSION_URL?.trim() ||
  "https://api.acongm.com/api/auth/session";

function metadataString(
  metadata: Record<string, unknown> | undefined,
  keys: string[],
): string | null {
  if (!metadata) return null;
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export async function GET(request: Request) {
  const localEnv = getSupabasePublicEnv();
  const supabase = localEnv ? await createAuthServerClient() : null;
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (session?.access_token) {
    try {
      const upstream = await fetch(API_SESSION, {
        cache: "no-store",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          cookie: request.headers.get("cookie") || "",
          accept: "application/json",
        },
      });
      if (upstream.ok) {
        return NextResponse.json(await upstream.json(), {
          headers: { "cache-control": "no-store" },
        });
      }
    } catch {
      // fall through to local session snapshot
    }
  }

  const user = session?.user;
  const email = user?.email?.trim() || null;
  const name = metadataString(user?.user_metadata, [
    "display_name",
    "full_name",
    "name",
    "user_name",
    "preferred_username",
  ]) || email;
  const avatarUrl = metadataString(user?.user_metadata, [
    "avatar_url",
    "picture",
    "avatar",
    "profile_image",
  ]);
  const authenticated = Boolean(user && !user.is_anonymous);

  return NextResponse.json(
    {
      authenticated,
      configured: Boolean(localEnv),
      isAnonymous: Boolean(user?.is_anonymous),
      user: user
        ? {
            id: user.id,
            email,
            name,
            avatarUrl,
          }
        : null,
      userInfo: user
        ? {
            id: user.id,
            displayName: name || email || "用户",
            avatarUrl,
            email,
            accountLabel: email || name || "用户",
            role: user.is_anonymous ? "anonymous" : "viewer",
            tier: user.is_anonymous ? "anon" : "user",
            isAnonymous: Boolean(user.is_anonymous),
            source: "auth",
          }
        : null,
      accessToken: session?.access_token ?? null,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
