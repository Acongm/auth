# Auth 仓库 Issue 状态

> 跨仓统一跟踪见：`Acongm/node-vercel-starter` → [`docs/platform-issue-status.md`](https://github.com/Acongm/node-vercel-starter/blob/main/docs/platform-issue-status.md)

## 本仓 Issues

| # | 标题 | 状态 | 说明 |
|---|------|------|------|
| **52** | getUserInfo 驱动登录态展示 | **应关闭 ✅** | main `210b0d8`；chat/portal 已同步 |
| **28** | Account Profile 消费者 | OPEN（smoke → #37） | Account 页已 auth-client 化 + settings |
| **51** | Auth Client 收口 | **P0 OPEN** | 消除 chat/portal vendored fork |
| **50** | Auth 产品完善 | OPEN | 依赖 #51 |
| **48** | Anonymous Identity Upgrade | OPEN | OAuth link 代码在 #47，live E2E 待证 |
| **47** | （PR 已合） | — | merged `cac0449` |

## 下一步（auth 仓）

1. **#51** — auth-client 唯一源：`ensureAnonymousSession` + `useSession({ ensureAnonymous })` 已入 auth main；`scripts/check-auth-client-drift.sh` 校验 chat/portal
2. 配合 **chat#40** — session bootstrap 不阻塞 shell
3. **#37** — Account browser smoke
