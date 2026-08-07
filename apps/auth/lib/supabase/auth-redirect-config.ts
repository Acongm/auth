export const SUPABASE_PROJECT_REF = "ejprvntpxlyydkzsjqnv";

export const EXPECTED_SITE_URL = "https://auth.acongm.com";

export const EXPECTED_REDIRECT_URLS = [
  "https://auth.acongm.com/callback",
  "https://auth.acongm.com/callback/**",
  "https://auth.acongm.com/**",
  "http://localhost:3100/callback",
  "http://localhost:3100/callback/**",
  "https://www.acongm.com/**",
  "https://chat.acongm.com/**",
  "http://localhost:3000/**",
  "http://localhost:3200/**",
] as const;

export type SupabaseAuthConfig = {
  site_url?: string;
  uri_allow_list?: string;
};

export function getSupabaseAuthConfigUrl(projectRef = SUPABASE_PROJECT_REF): string {
  return `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
}

export function buildSupabaseAuthConfigPayload(): SupabaseAuthConfig {
  return {
    site_url: EXPECTED_SITE_URL,
    uri_allow_list: EXPECTED_REDIRECT_URLS.join("\n"),
  };
}

export function getSupabaseDashboardUrl(projectRef = SUPABASE_PROJECT_REF): string {
  return `https://supabase.com/dashboard/project/${projectRef}/auth/url-configuration`;
}

export function diagnoseAuthRedirectConfig(config: SupabaseAuthConfig | null): {
  ok: boolean;
  siteUrl: string | null;
  issues: string[];
  symptom: string;
} {
  const siteUrl = config?.site_url ?? null;
  const issues: string[] = [];

  if (!siteUrl) {
    issues.push("无法读取 Supabase site_url（需 SUPABASE_ACCESS_TOKEN 或手动检查 Dashboard）");
  } else if (siteUrl.includes("localhost")) {
    issues.push(`site_url 仍为 ${siteUrl}，OAuth 会回跳到本地而非 auth.acongm.com`);
  } else if (siteUrl !== EXPECTED_SITE_URL) {
    issues.push(`site_url 为 ${siteUrl}，期望 ${EXPECTED_SITE_URL}`);
  }

  const allowList = config?.uri_allow_list ?? "";
  if (!allowList.includes("https://auth.acongm.com/callback")) {
    issues.push("Redirect URLs 未包含 https://auth.acongm.com/callback");
  }

  return {
    ok: issues.length === 0,
    siteUrl,
    issues,
    symptom:
      "第三方登录后落到 http://localhost:3000/?code=... 表示 Supabase Site URL 或 Redirect URLs 未正确配置",
  };
}

export async function fetchSupabaseAuthConfig(
  accessToken: string,
  projectRef = SUPABASE_PROJECT_REF,
): Promise<SupabaseAuthConfig> {
  const response = await fetch(getSupabaseAuthConfigUrl(projectRef), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase auth config fetch failed (${response.status}): ${body}`);
  }

  return (await response.json()) as SupabaseAuthConfig;
}

export async function patchSupabaseAuthConfig(
  accessToken: string,
  projectRef = SUPABASE_PROJECT_REF,
): Promise<SupabaseAuthConfig> {
  const response = await fetch(getSupabaseAuthConfigUrl(projectRef), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildSupabaseAuthConfigPayload()),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase auth config patch failed (${response.status}): ${body}`);
  }

  return (await response.json()) as SupabaseAuthConfig;
}
