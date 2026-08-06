"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthShell, GitHubSignInButton } from "@/components/auth-shell";

function formatLoginError(cause: unknown): string {
  if (cause && typeof cause === "object") {
    const record = cause as {
      message?: string;
      msg?: string;
      error_code?: string;
      code?: string | number;
    };
    const message = record.message || record.msg || "";
    const code = String(record.error_code || record.code || "");
    if (
      /provider is not enabled/i.test(message) ||
      (/validation_failed/i.test(code) && /provider/i.test(message))
    ) {
      return "GitHub 登录未启用：请在 Supabase Dashboard → Authentication → Providers → GitHub 开启，并填写 GitHub OAuth App 的 Client ID / Secret。";
    }
    if (cause instanceof Error) {
      if (/provider is not enabled/i.test(cause.message)) {
        return "GitHub 登录未启用：请在 Supabase Dashboard → Authentication → Providers → GitHub 开启，并填写 GitHub OAuth App 的 Client ID / Secret。";
      }
      return cause.message;
    }
    if (message) return message;
  }

  return "登录失败，请重试";
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return_to");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = useMemo(() => {
    const url = new URL("/callback", window.location.origin);
    if (returnTo) {
      url.searchParams.set("return_to", returnTo);
    }
    return url.toString();
  }, [returnTo]);

  async function handleSignIn() {
    setLoading(true);
    setError(null);

    try {
      const { createBrowserClient, signInWithGitHub } = await import(
        "@acongm/auth-client"
      );
      const client = createBrowserClient();
      await signInWithGitHub(client, { redirectTo: callbackUrl });
    } catch (cause) {
      setError(formatLoginError(cause));
      setLoading(false);
    }
  }

  return (
    <AuthShell
      description="通过 auth.acongm.com 完成 GitHub OAuth 登录，并在所有 acongm.com 子域共享会话。"
      title="统一登录中转"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">登录到 Acongm</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            登录成功后将返回来源站点。未配置 Supabase 时，请先设置环境变量。
          </p>
        </div>

        <GitHubSignInButton disabled={loading} onClick={handleSignIn} />

        {returnTo ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            登录后返回：
            <span className="mt-1 block break-all text-blue-200">{returnTo}</span>
          </p>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <p className="text-xs leading-5 text-slate-500">
          其他应用可跳转至{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5">
            https://auth.acongm.com/login?return_to=...
          </code>
        </p>
      </div>
    </AuthShell>
  );
}
