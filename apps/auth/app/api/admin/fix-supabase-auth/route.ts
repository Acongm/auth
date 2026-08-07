import { NextResponse } from "next/server";
import {
  diagnoseAuthRedirectConfig,
  fetchSupabaseAuthConfig,
  getSupabaseDashboardUrl,
  patchSupabaseAuthConfig,
} from "@/lib/supabase/auth-redirect-config";

function isAuthorized(request: Request): boolean {
  const secret = process.env.AUTH_ADMIN_SECRET?.trim();
  if (!secret) return false;

  const header = request.headers.get("x-admin-secret")?.trim();
  const auth = request.headers.get("authorization")?.trim();
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;

  return header === secret || bearer === secret;
}

export async function GET() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  const adminConfigured = Boolean(process.env.AUTH_ADMIN_SECRET?.trim());

  if (!accessToken) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_supabase_access_token",
        message:
          "在 Vercel 为 auth 项目设置 SUPABASE_ACCESS_TOKEN 后，可用 POST 自动修复；或手动打开 Dashboard",
        dashboardUrl: getSupabaseDashboardUrl(),
        manualFix: {
          siteUrl: "https://auth.acongm.com",
          redirectUrls: [
            "https://auth.acongm.com/callback",
            "https://auth.acongm.com/**",
            "https://www.acongm.com/**",
            "https://chat.acongm.com/**",
          ],
        },
      },
      { status: 503 },
    );
  }

  try {
    const before = await fetchSupabaseAuthConfig(accessToken);
    const diagnosis = diagnoseAuthRedirectConfig(before);

    return NextResponse.json({
      ok: diagnosis.ok,
      adminConfigured,
      before,
      diagnosis,
      dashboardUrl: getSupabaseDashboardUrl(),
      fixAvailable: adminConfigured,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "diagnosis_failed",
        message: error instanceof Error ? error.message : "诊断失败",
        dashboardUrl: getSupabaseDashboardUrl(),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_supabase_access_token",
        dashboardUrl: getSupabaseDashboardUrl(),
      },
      { status: 503 },
    );
  }

  try {
    const before = await fetchSupabaseAuthConfig(accessToken);
    const after = await patchSupabaseAuthConfig(accessToken);
    const diagnosis = diagnoseAuthRedirectConfig(after);

    return NextResponse.json({
      ok: diagnosis.ok,
      before,
      after,
      diagnosis,
      message: diagnosis.ok
        ? "Supabase Auth URL 已更新，请重新测试第三方登录"
        : "已提交更新，但仍有配置问题，请检查 diagnosis.issues",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "patch_failed",
        message: error instanceof Error ? error.message : "更新失败",
        dashboardUrl: getSupabaseDashboardUrl(),
      },
      { status: 500 },
    );
  }
}
