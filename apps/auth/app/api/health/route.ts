import { NextResponse } from "next/server";
import { loadSiteConfig } from "@acongm/config";
import {
  diagnoseAuthRedirectConfig,
  EXPECTED_SITE_URL,
  fetchSupabaseAuthConfig,
  getSupabaseDashboardUrl,
} from "@/lib/supabase/auth-redirect-config";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET() {
  const config = loadSiteConfig();
  const supabaseConfigured = isSupabaseConfigured();
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();

  let oauthRedirect:
    | ReturnType<typeof diagnoseAuthRedirectConfig>
    | undefined;

  if (accessToken) {
    try {
      const remoteConfig = await fetchSupabaseAuthConfig(accessToken);
      oauthRedirect = diagnoseAuthRedirectConfig(remoteConfig);
    } catch (error) {
      oauthRedirect = {
        ok: false,
        siteUrl: null,
        issues: [
          error instanceof Error
            ? error.message
            : "无法读取 Supabase Auth URL 配置",
        ],
        symptom:
          "第三方登录后落到 http://localhost:3000/?code=... 表示 Supabase Site URL 或 Redirect URLs 未正确配置",
      };
    }
  }

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
    oauth: {
      expectedCallback: `${config.domains.auth}/callback`,
      expectedSiteUrl: EXPECTED_SITE_URL,
      dashboardUrl: getSupabaseDashboardUrl(),
      redirectDiagnosis: oauthRedirect ?? {
        ok: null,
        siteUrl: null,
        issues: [
          "设置 SUPABASE_ACCESS_TOKEN 后可自动诊断；或手动打开 dashboardUrl 检查 Site URL",
        ],
        symptom:
          "若登录后跳到 http://localhost:3000/?code=...，请将 Site URL 改为 https://auth.acongm.com 并添加 /callback 到 Redirect URLs",
      },
      fixScript: "./scripts/fix-supabase-site-url.sh",
      fixApi: `${config.domains.auth}/api/admin/fix-supabase-auth`,
    },
  });
}
