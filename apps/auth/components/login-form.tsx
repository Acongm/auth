"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  createBrowserClient,
  isAnonymousSession,
  signInWithPassword,
  signUpWithPassword,
  startOAuthFlow,
} from "@acongm/auth-client";
import { AuthShell, SocialSignInButton } from "@/components/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  AUTH_RETURN_TO_COOKIE,
  cn,
  isLocalHostname,
} from "@/lib/utils";

type AuthMode = "signin" | "signup";
type BusyKind = "email" | "github" | "google" | null;

function formatAuthError(cause: unknown): string {
  const message =
    cause instanceof Error
      ? cause.message
      : cause && typeof cause === "object"
        ? String(
            (cause as { message?: string; msg?: string }).message ||
              (cause as { msg?: string }).msg ||
              "",
          )
        : "";

  if (!message) return "操作失败，请重试";

  if (/provider is not enabled/i.test(message)) {
    return "该第三方登录未启用：请在 Supabase → Authentication → Providers 开启对应 Provider，并填写 Client ID / Secret。";
  }
  if (/email address not authorized/i.test(message)) {
    return "当前项目未配置自定义 SMTP，确认邮件只能发给组织成员邮箱。本地开发可在 Supabase → Providers → Email 关闭 Confirm email，或改用组织成员邮箱注册。";
  }
  if (/email not confirmed/i.test(message)) {
    return "邮箱尚未确认。请查收确认邮件，或在 Supabase Dashboard 关闭 Confirm email 后再试。";
  }
  if (/invalid login credentials/i.test(message)) {
    return "邮箱或密码不正确。";
  }
  if (/user already registered/i.test(message)) {
    return "该邮箱已注册，请直接登录。";
  }

  return message;
}

function allowLocalReturnTo(): boolean {
  if (process.env.NEXT_PUBLIC_AUTH_LOCAL === "1") return true;
  if (typeof window === "undefined") return false;
  return isLocalHostname(window.location.hostname);
}

function safeReturnTo(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!allowLocalReturnTo() && isLocalHostname(url.hostname)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/** Production OAuth must use exact allow-listed callback (no query string). */
function resolveOAuthCallbackUrl(): string {
  if (typeof window === "undefined") {
    return "https://auth.acongm.com/callback";
  }
  const host = window.location.hostname;
  const origin =
    host === "auth.acongm.com" || isLocalHostname(host)
      ? window.location.origin
      : "https://auth.acongm.com";
  return new URL("/callback", origin).toString();
}

function persistReturnTo(returnTo: string | null) {
  if (typeof document === "undefined") return;
  if (!returnTo) {
    document.cookie = `${AUTH_RETURN_TO_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    return;
  }
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${AUTH_RETURN_TO_COOKIE}=${encodeURIComponent(returnTo)}; Path=/; Max-Age=600; SameSite=Lax${secure}`;
}

/**
 * Email-based same-uid anonymous upgrade requires email confirmation followed by
 * password setup. Until #27 owns that full lifecycle, block only SIGNUP from an
 * anonymous session. Existing-account SIGNIN remains an explicit identity switch.
 */
async function protectAnonymousEmailSignup(
  client: ReturnType<typeof createBrowserClient>,
) {
  const {
    data: { session },
    error,
  } = await client.auth.getSession();
  if (error) {
    throw new Error(error.message || "无法读取当前登录状态");
  }
  if (isAnonymousSession(session)) {
    throw new Error(
      "当前访客会话已经拥有独立身份和聊天数据。邮箱注册的同 UID 升级需要先完成邮箱确认与设密闭环，暂由 Auth #27 实现；现在可使用 Google / GitHub 注册来保留当前访客会话，或切换到“登录”进入已有邮箱账号（不会自动合并匿名聊天）。",
    );
  }
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("return_to"));
  const requestedProvider = searchParams.get("provider");
  const initialMode =
    searchParams.get("mode") === "signup" ? "signup" : "signin";

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<BusyKind>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const callbackUrl = useMemo(() => resolveOAuthCallbackUrl(), []);

  useEffect(() => {
    persistReturnTo(returnTo);
  }, [returnTo]);

  const finishRedirect = (fallback = "https://www.acongm.com") => {
    window.location.assign(returnTo || fallback);
  };

  async function handleOAuth(provider: "github" | "google") {
    setBusy(provider);
    setError(null);
    setInfo(null);
    try {
      persistReturnTo(returnTo);
      const client = createBrowserClient();
      await startOAuthFlow(client, {
        provider,
        redirectTo: callbackUrl,
        intent: mode === "signup" ? "sign-up" : "sign-in",
      });
    } catch (cause) {
      setError(formatAuthError(cause));
      setBusy(null);
    }
  }

  useEffect(() => {
    if (requestedProvider !== "github" && requestedProvider !== "google") {
      return;
    }
    let cancelled = false;
    void (async () => {
      setBusy(requestedProvider);
      setError(null);
      try {
        persistReturnTo(returnTo);
        const client = createBrowserClient();
        await startOAuthFlow(client, {
          provider: requestedProvider,
          redirectTo: callbackUrl,
          intent: mode === "signup" ? "sign-up" : "sign-in",
        });
      } catch (cause) {
        if (!cancelled) {
          setError(formatAuthError(cause));
          setBusy(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestedProvider, callbackUrl, returnTo, mode]);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("email");
    setError(null);
    setInfo(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || password.length < 6) {
      setError("请输入有效邮箱，且密码至少 6 位。");
      setBusy(null);
      return;
    }

    try {
      const client = createBrowserClient();

      if (mode === "signin") {
        // Existing-account login is an explicit identity switch. Chat consumers
        // key durable state by auth.uid() and clear active/cache on UID change.
        await signInWithPassword(client, {
          email: trimmedEmail,
          password,
        });
        finishRedirect();
        return;
      }

      // Do not silently replace an anonymous UID during account creation.
      await protectAnonymousEmailSignup(client);
      persistReturnTo(returnTo);
      const result = await signUpWithPassword(client, {
        email: trimmedEmail,
        password,
        emailRedirectTo: callbackUrl,
      });

      if (result.needsEmailConfirmation) {
        setInfo("注册成功。请查收确认邮件后再登录（若未收到可检查垃圾箱）。");
        setMode("signin");
        setBusy(null);
        return;
      }

      finishRedirect();
    } catch (cause) {
      setError(formatAuthError(cause));
      setBusy(null);
    }
  }

  const loading = busy !== null;

  return (
    <AuthShell
      description="通过 auth.acongm.com 完成邮箱或第三方登录，并在所有 acongm.com 子域共享会话。"
      title="统一登录中转"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">
            {mode === "signin" ? "登录到 Acongm" : "注册 Acongm 账号"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {mode === "signin"
              ? "登录已有账号会切换 auth.uid()；访客聊天不会静默合并到另一个账号。"
              : "从 Chat 访客会话进入时，Google / GitHub 注册会绑定到当前匿名身份并保留 auth.uid()。"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted p-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full rounded-md",
              mode === "signin"
                ? "bg-background text-foreground shadow-sm hover:bg-background"
                : "text-muted-foreground",
            )}
            onClick={() => {
              setMode("signin");
              setError(null);
              setInfo(null);
            }}
            disabled={loading}
          >
            登录
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full rounded-md",
              mode === "signup"
                ? "bg-background text-foreground shadow-sm hover:bg-background"
                : "text-muted-foreground",
            )}
            onClick={() => {
              setMode("signup");
              setError(null);
              setInfo(null);
            }}
            disabled={loading}
          >
            注册
          </Button>
        </div>

        <form className="space-y-4" onSubmit={handleEmailSubmit}>
          <Field className="gap-1.5">
            <FieldLabel
              htmlFor="auth-email"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              邮箱
            </FieldLabel>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-lg px-4"
              placeholder="you@example.com"
              disabled={loading}
            />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel
              htmlFor="auth-password"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              密码
            </FieldLabel>
            <Input
              id="auth-password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 rounded-lg px-4"
              placeholder="至少 6 位"
              disabled={loading}
            />
          </Field>
          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {busy === "email"
              ? mode === "signin"
                ? "登录中…"
                : "注册中…"
              : mode === "signin"
                ? "邮箱登录"
                : "注册账号"}
          </Button>
        </form>

        <FieldSeparator>或使用第三方</FieldSeparator>

        <div className="space-y-3">
          <SocialSignInButton
            provider="google"
            disabled={loading}
            onClick={() => {
              void handleOAuth("google");
            }}
          />
          <SocialSignInButton
            provider="github"
            disabled={loading}
            onClick={() => {
              void handleOAuth("github");
            }}
          />
        </div>

        {returnTo ? (
          <Card className="bg-muted/50 px-4 py-3 text-sm text-muted-foreground shadow-none">
            登录后返回：
            <span className="mt-1 block break-all text-primary">{returnTo}</span>
          </Card>
        ) : null}

        {info ? (
          <Alert>
            <AlertDescription>{info}</AlertDescription>
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <p className="text-xs leading-5 text-muted-foreground">
          其他应用可跳转至{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
            https://auth.acongm.com/login?return_to=...
          </code>
          ，亦支持{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
            ?provider=google|github
          </code>
          。
        </p>
      </div>
    </AuthShell>
  );
}
