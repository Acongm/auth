# Auth 仓库 Issue 状态

> 跨仓统一跟踪见：`Acongm/node-vercel-starter` → [`docs/platform-issue-status.md`](https://github.com/Acongm/node-vercel-starter/blob/main/docs/platform-issue-status.md)

## 本仓 Issues

| # | 标题 | 状态 | 说明 |
|---|------|------|------|
| **52** | getUserInfo 驱动登录态展示 | **已关闭 ✅** | 2026-08-19 completed |
| **51** | Auth Client 收口 | **已关闭 ✅** | 2026-08-19 completed |
| **28** | Account Profile 消费者 | OPEN（smoke → #37） | Account 页已 auth-client 化 + settings |
| **50** | Auth 产品完善 | OPEN | 依赖 #37 live proof |
| **48** | Anonymous Identity Upgrade | OPEN | OAuth link 代码在 #47，live E2E 待证 |
| **47** | （PR 已合） | — | merged `cac0449` |

## 下一步（auth 仓）

1. **#37** mock / live / 生产 cookie browser — ✅ `pnpm test:e2e` / `test:e2e:live` / `test:e2e:prod`
2. **#48** — Manual Linking 已开启；剩真人 OAuth 同 uid live E2E
