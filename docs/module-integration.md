# Auth 模块接入指南

> **唯一源仓库**：`Acongm/auth`  
> **消费方**：`chat`、`portal`（以及未来 dochub 等）— 只接入，不在消费方仓内改 `auth-client` 源码。

## 模块边界

| 层 | 包 / 路由 | 职责 |
|----|-----------|------|
| 前端 SDK | `@acongm/auth-client` | Supabase session、OAuth 跳转、User BFF 客户端、账号 UI |
| 后端 API | `node-vercel-starter` `/api/auth/*`、`/api/user/*` | 鉴权 principal、profile/settings、`userInfo` 契约 |

消费方 **不实现** 登录协议；只通过 `@acongm/auth-client` 调 BFF。

## 安装（消费方 monorepo）

当前阶段通过 **同步脚本** 把 canonical 包复制到消费方 `packages/auth-client`（待 P5-06 私有 npm 发布后改为 semver 依赖）。

```bash
# 在 auth 仓执行
./scripts/sync-auth-client-to-consumers.sh
```

校验漂移（CI / 本地）：

```bash
./scripts/check-auth-client-drift.sh
```

## 推荐接入方式

### 1. 顶栏 / 侧栏账号态（只读 + 用户菜单）

```tsx
import { AuthAccountButton } from '@acongm/auth-client';

<AuthAccountButton variant="nav" menu />
```

登录后菜单含：**账号**、**设置**（`auth.acongm.com/account#settings`）、**退出**。
侧栏可传 `menuFooter` 嵌入本地 theme 切换。

### 2. Chat / Portal 嵌入面（需匿名 Supabase 身份）

```tsx
import { useSession } from '@acongm/auth-client';

const { session, loading } = useSession({ ensureAnonymous: true });
```

或交给 `AuthAccountButton`：

```tsx
<AuthAccountButton variant="sidebar" ensureAnonymous />
```

### 3. 账号页 / Settings（读写 profile）

```tsx
import { getUserMe, updateUserProfile, updateUserSettings } from '@acongm/auth-client';
```

BFF 默认同源 `/api/user`；独立部署时在消费方 Next 路由代理到 `api.acongm.com`。

## 后端契约（API 仓）

| 端点 | 用途 |
|------|------|
| `GET /api/user/info` | UI 展示用 `userInfo`（推荐） |
| `GET /api/user/me` | 完整账号快照 |
| `GET /api/user/profile` | `{ profile, userInfo }` |
| `PATCH /api/user/profile` | 更新 profile，返回 refreshed `userInfo` |
| `GET/PATCH /api/user/settings` | language / theme |

详见 `node-vercel-starter/docs/user-chat-ui-contract-testing.md`。

## 变更流程

1. 在 **auth 仓** 修改 `packages/auth-client`
2. `pnpm typecheck && pnpm build`（auth 仓）
3. `./scripts/sync-auth-client-to-consumers.sh`
4. 在 chat / portal 跑 `pnpm types:check`
5. 分别提交各仓（或同一 PR 多仓，按团队流程）

**禁止** 在 portal/chat 直接改 `packages/auth-client` 后不同步回 auth。
