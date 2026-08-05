# auth

OAuth 中枢（**auth.acongm.com**）及共享包 `packages/auth-client`、`packages/config`。

采用业界常见的 **独立 auth 子域 SSO 中转** 模式：集中处理 GitHub OAuth，通过 `Domain=.acongm.com` 的 Supabase Session Cookie 在 portal / chat / API 间共享登录态。

## 快速开始

```bash
pnpm install
cp apps/auth/.env.example apps/auth/.env.local
pnpm dev
```

本地访问：http://localhost:3100/login

## 目录结构

```
apps/auth              # Next.js SSO 中转应用
packages/auth-client   # 浏览器/服务端 Supabase 客户端 + hooks
packages/config        # site.config.yaml 加载器
site.config.yaml       # 平台域名、限额、OAuth 配置
docs/oauth-setup.md    # Supabase / Vercel / 域名配置
```

## Issues

- Epic：[Platform v2 — auth](https://github.com/Acongm/auth/issues/16)
- 迁移记录：[docs/issues-migration.md](./docs/issues-migration.md)

## Vercel 部署

Root Directory 设为 `apps/auth`，详见 [docs/oauth-setup.md](./docs/oauth-setup.md)。

所需 Secrets（GitHub Actions）：

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 子应用接入

```ts
import { getOAuthLoginUrl } from "@acongm/config";
import { createBrowserClient, useSession } from "@acongm/auth-client";
```
