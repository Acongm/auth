# Auth 部署清单（API 已就绪后）

API 已在 `api.acongm.com` 运行且 `supabaseJwtConfigured: true` 时，按本清单部署 **auth 仓**。

## 当前状态

| 项 | 状态 |
| --- | --- |
| API `api.acongm.com` | 已部署 |
| Auth `auth.acongm.com` | **待部署**（本仓 Next.js 应用） |
| Supabase 项目 | `ejprvntpxlyydkzsjqnv`（nest） |

Supabase Project URL：

```
https://ejprvntpxlyydkzsjqnv.supabase.co
```

---

## 第一步：Vercel 创建 Auth 项目（推荐 Git 集成）

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New → Project**
2. 导入 GitHub 仓库 **`Acongm/auth`**
3. 配置：

| 设置项 | 值 |
|--------|-----|
| Root Directory | `apps/auth` |
| Framework | Next.js |
| Install Command | `cd ../.. && pnpm install` |
| Build Command | 留空（使用 `apps/auth/vercel.json`） |

4. **先不要点 Deploy**，先加环境变量（第二步）

---

## 第二步：Vercel 环境变量

在 Vercel Project → **Settings → Environment Variables** 添加（Production）：

```env
NEXT_PUBLIC_SUPABASE_URL=https://ejprvntpxlyydkzsjqnv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<从 Supabase Dashboard → Settings → API 复制 anon key>
NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.acongm.com
```

> anon key 在 Supabase：**Project Settings → API → Project API keys → anon public**
>
> 生产环境**不要**设置 `NEXT_PUBLIC_AUTH_LOCAL=1`。添加或修改变量后请 **Redeploy**，否则可能出现 `MIDDLEWARE_INVOCATION_FAILED`（500）。

然后点击 **Deploy**。

---

## 第三步：绑定域名 auth.acongm.com

1. Vercel Project → **Settings → Domains**
2. 添加：`auth.acongm.com`
3. DNS 添加 CNAME：

```
auth  →  cname.vercel-dns.com
```

> 若 `auth.acongm.com` 当前指向 API 或其他服务，需先改掉 DNS，再指向 auth 的 Vercel 项目。

---

## 第四步：Supabase Auth URL 配置

Supabase Dashboard → **Authentication → URL Configuration**：

| 字段 | 值 |
|------|-----|
| Site URL | `https://auth.acongm.com` |
| Redirect URLs | 见下方 |

```
https://auth.acongm.com/callback
https://www.acongm.com/*
https://chat.acongm.com/*
http://localhost:3100/callback
```

**Authentication → Providers → GitHub**：启用并填入 GitHub OAuth App。

GitHub OAuth App 的 **Authorization callback URL** 填：

```
https://ejprvntpxlyydkzsjqnv.supabase.co/auth/v1/callback
```

---

## 第五步：验收

部署完成后依次检查：

```bash
# 1. auth 健康检查（应返回 service: auth）
curl https://auth.acongm.com/api/health

# 2. 登录页可打开
open https://auth.acongm.com/login

# 3. API 仍可验 JWT（API 仓无需改动）
curl https://api.acongm.com/api/auth/mode
```

浏览器完整流程：

1. 打开 `https://auth.acongm.com/login?return_to=https://www.acongm.com`
2. GitHub 登录成功
3. 跳回 `www.acongm.com`
4. 开发者工具 → Application → Cookies → 存在 `Domain=.acongm.com` 的 Supabase cookie

---

## 与 API 的关系（再强调）

```
portal/chat  →  跳 auth.acongm.com/login  →  Supabase 登录
                    ↓
              拿到 access_token
                    ↓
              调 api.acongm.com/api/auth/me
              调 api.acongm.com/api/auth/oauth/claim（可选）
```

**auth 仓不管业务逻辑**；**api 仓不管登录页**。两边共用同一个 Supabase 项目即可。

---

## 可选：GitHub Actions 手动部署

若要用 Actions 而非 Vercel Git 集成，在 `Acongm/auth` 仓库 Secrets 配置：

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

然后在 Actions 里手动运行 **Deploy Auth to Vercel**。

日常 push 只跑 **CI**（build + typecheck），不强制要求 Vercel Secrets。
