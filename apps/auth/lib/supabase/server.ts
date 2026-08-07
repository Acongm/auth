import { cookies } from "next/headers";
import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@acongm/auth-client/server";
import { loadSiteConfig } from "@acongm/config";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function createAuthServerClient() {
  const supabaseEnv = getSupabasePublicEnv();
  if (!supabaseEnv) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  const cookieStore = await cookies();

  return createServerClient({
    supabaseUrl: supabaseEnv.supabaseUrl,
    supabaseAnonKey: supabaseEnv.supabaseAnonKey,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot always mutate cookies.
        }
      },
    },
  });
}

export function getAllowedReturnHosts(): string[] {
  const config = loadSiteConfig();
  const hosts = new Set<string>(["*.acongm.com", "acongm.com"]);

  // Localhost return_to only when developing auth locally — never in production SSO.
  if (process.env.NEXT_PUBLIC_AUTH_LOCAL === "1") {
    hosts.add("localhost");
    hosts.add("127.0.0.1");
  }

  for (const domain of Object.values(config.domains) as string[]) {
    try {
      hosts.add(new URL(domain).hostname);
    } catch {
      // Ignore invalid domain values.
    }
  }

  return [...hosts];
}

export function getDefaultReturnTo(): string {
  return loadSiteConfig().domains.portal;
}
