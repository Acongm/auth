import { NextResponse } from "next/server";
import { loadSiteConfig } from "@acongm/config";

export async function GET() {
  const config = loadSiteConfig();
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return NextResponse.json({
    ok: true,
    service: "auth",
    supabaseConfigured,
    cookieDomain:
      process.env.NEXT_PUBLIC_AUTH_LOCAL === "1"
        ? "localhost"
        : process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN ?? ".acongm.com",
    domains: config.domains,
    routes: {
      login: `${config.domains.auth}/login`,
      callback: `${config.domains.auth}/callback`,
      logout: `${config.domains.auth}/logout`,
      session: `${config.domains.auth}/api/session`,
    },
    api: {
      mode: `${config.domains.api}/api/auth/mode`,
      me: `${config.domains.api}/api/auth/me`,
      claim: `${config.domains.api}/api/auth/oauth/claim`,
    },
  });
}
