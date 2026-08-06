# OAuth / SSO 配置指南

本仓库实现 **独立 auth 子域 SSO 中转**（业界常见模式：Central Authentication Service）。

## 架构

```mermaid
sequenceDiagram
  participant User
  participant Portal as www.acongm.com
  participant Auth as auth.acongm.com
  participant Supabase
  participant API as api.acongm.com

  User->>Portal: 访问受保护页面
  Portal->>Auth: 重定向 /login?return_to=...
  User->>Auth: GitHub OAuth
  Auth->>Supabase: exchangeCodeForSession
  Supabase-->>Auth: JWT + refresh token
  Auth-->>User: Set-Cookie Domain=.acongm.com
  Auth->>Portal: 重定向 return_to
  Portal->>API: Authorization: Bearer <supabase_jwt>
  API-->>Portal: 200 OK
```

## 技术选型

| 组件 | 选择 | 原因 |
| --- | --- | --- |
| 身份提供商 | **Supabase Auth** | 与 API `SUPABASE_JWT_SECRET` 校验一致 |
| SSR 集成 | `@supabase/ssr` | Next.js App Router 官方推荐 |
| 共享客户端 | `@acongm/auth-client` | portal/chat 复用 cookie + hooks |
| UI | Tailwind + Lucide | 轻量登录页，无 vendor lock-in |

## Supabase 控制台

1. **Authentication → Providers → GitHub**：启用并填入 GitHub OAuth App  
   - 若出现 `Unsupported provider: provider is not enabled`，说明 GitHub Provider 仍为关闭状态（与代码无关）
   - 可用脚本（需 token + GitHub OAuth 凭证）：`scripts/configure-supabase-github-auth.sh`（仓库根 `acongm/scripts`）
2. **GitHub OAuth App Callback**：填 Supabase `https://<project>.supabase.co/auth/v1/callback`
3. **Authentication → URL Configuration**
   - Site URL: `https://auth.acongm.com`
   - Redirect URLs:
     - `https://auth.acongm.com/callback`
     - `https://www.acongm.com/*`
     - `https://chat.acongm.com/*`
     - `http://localhost:3100/callback`

## Vercel 部署

**API 已部署后**，按 [docs/deploy-checklist.md](./docs/deploy-checklist.md) 部署本仓到 `auth.acongm.com`。

简要步骤：Vercel 导入本仓库 → Root Directory = `apps/auth` → 配置 Supabase 环境变量 → 绑定域名。

### 项目设置

| 项 | 值 |
| --- | --- |
| Root Directory | `apps/auth` |
| Framework | Next.js |
| Install Command | `cd ../.. && pnpm install` |
| Build Command | 见 `apps/auth/vercel.json` |

### 环境变量（Production）

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.acongm.com
```

本地开发设置 `NEXT_PUBLIC_AUTH_LOCAL=1` 以禁用跨域 cookie。

### 域名

在 Vercel Project → Settings → Domains 添加：

- `auth.acongm.com`

DNS（Cloudflare / 域名商）添加 CNAME：

```
auth.acongm.com -> cname.vercel-dns.com
```

### CLI 快速部署

```bash
pnpm install
pnpm build
cd apps/auth
vercel link
vercel env pull
vercel --prod
vercel domains add auth.acongm.com
```

## 子应用接入

```ts
import { getOAuthLoginUrl } from "@acongm/config";

const loginUrl = getOAuthLoginUrl({
  returnTo: window.location.href,
});

window.location.href = loginUrl;
```

登录后使用 `@acongm/auth-client` 读取 session，并将 access token 传给 API。

## 匿名 Thread 认领

```ts
import { claimAnonymousThreads, createBrowserClient } from "@acongm/auth-client";

const client = createBrowserClient();
const { data } = await client.auth.getSession();

await claimAnonymousThreads({
  apiBase: "https://api.acongm.com",
  clientId: "anon-client-id",
  accessToken: data.session!.access_token,
});
```

## 路由

| 路径 | 说明 |
| --- | --- |
| `/login` | SSO 登录页，支持 `?return_to=` |
| `/callback` | OAuth 回调，写入 `.acongm.com` cookie |
| `/logout` | 清除 session，可选 `?return_to=` |
| `/api/session` | 当前 session JSON |
