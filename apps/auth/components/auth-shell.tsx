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
            <li>• 独立 auth 子域集中处理 OAuth 登录</li>
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

type GitHubSignInButtonProps = {
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
};

export function GitHubSignInButton({
  disabled,
  onClick,
  href,
}: GitHubSignInButtonProps) {
  const className = cn(
    "inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3.5 text-base font-medium text-slate-900 transition hover:bg-slate-100",
    disabled && "cursor-not-allowed opacity-60 hover:bg-white",
  );

  if (href) {
    return (
      <a className={className} href={href}>
        <Github className="h-5 w-5" />
        使用 GitHub 登录
      </a>
    );
  }

  return (
    <button className={className} disabled={disabled} onClick={onClick} type="button">
      <Github className="h-5 w-5" />
      使用 GitHub 登录
    </button>
  );
}
