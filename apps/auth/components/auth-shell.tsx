import { Github } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300">
            Platform v2 SSO
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            {description}
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            <li>• 邮箱账号或第三方 OAuth 统一登录</li>
            <li>• `.acongm.com` 共享 Supabase Session Cookie</li>
            <li>• portal / chat / API 通过 JWT 统一鉴权</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#0b1220] p-8 shadow-2xl shadow-blue-950/30">
          {children}
        </section>
      </div>
    </main>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.4-.2-2H12z"
      />
      <path
        fill="#34A853"
        d="M6.6 14.3l-.7.5-2.4 1.9C5.1 19.3 8.3 21 12 21c2.7 0 4.9-.9 6.5-2.4l-3.1-2.4c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1z"
      />
      <path
        fill="#4A90E2"
        d="M3.5 7.3C2.9 8.5 2.5 9.7 2.5 11s.4 2.5 1 3.7c0 .1 3.1-2.4 3.1-2.4-.2-.5-.3-1.1-.3-1.6s.1-1.1.3-1.6L3.5 7.3z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.5c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.5 14.7 1.5 12 1.5 8.3 1.5 5.1 3.2 3.5 6.1l3.1 2.4C7.2 7.2 9.4 5.5 12 5.5z"
      />
    </svg>
  );
}

type SocialSignInButtonProps = {
  provider: "github" | "google";
  disabled?: boolean;
  onClick?: () => void;
};

const PROVIDER_LABEL = {
  github: "使用 GitHub 登录",
  google: "使用 Google 登录",
} as const;

export function SocialSignInButton({
  provider,
  disabled,
  onClick,
}: SocialSignInButtonProps) {
  const className = cn(
    "inline-flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-3.5 text-base font-medium transition",
    provider === "github"
      ? "bg-white text-slate-900 hover:bg-slate-100"
      : "border border-white/15 bg-white/5 text-white hover:bg-white/10",
    disabled && "cursor-not-allowed opacity-60",
  );

  return (
    <button className={className} disabled={disabled} onClick={onClick} type="button">
      {provider === "github" ? (
        <Github className="h-5 w-5" />
      ) : (
        <GoogleIcon className="h-5 w-5" />
      )}
      {PROVIDER_LABEL[provider]}
    </button>
  );
}

/** @deprecated 使用 SocialSignInButton */
export function GitHubSignInButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  return (
    <SocialSignInButton provider="github" disabled={disabled} onClick={onClick} />
  );
}
