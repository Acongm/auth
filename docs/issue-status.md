# Auth 仓库 Issue 状态

> 跨仓统一跟踪见：`Acongm/node-vercel-starter` → [`docs/platform-issue-status.md`](https://github.com/Acongm/node-vercel-starter/blob/main/docs/platform-issue-status.md)

## 本仓 Issues

| # | 标题 | 状态 | 说明 |
|---|------|------|------|
| **52** | getUserInfo 驱动登录态展示 | **应关闭 ✅** | main `210b0d8`；chat/portal 已同步 |
| **51** | Auth Client 收口 | **源码完成 ✅** | status machine + scoped signOut；drift check 绿 |
| **28** | Account Profile 消费者 | **mock smoke ✅** | Account 页已 auth-client 化；`e2e/quality-gate-smoke.spec.ts` 覆盖登录/资料/偏好 |
| **50** | Auth 产品完善 | OPEN | 依赖 #37 live proof |
| **48** | Anonymous Identity Upgrade | OPEN | OAuth link 代码在 #47，live E2E 待证 |
| **47** | （PR 已合） | — | merged `cac0449` |

## 下一步（auth 仓）

1. **#37** — Account mock browser smoke — ✅ `e2e/quality-gate-smoke.spec.ts`（登录 chrome / 访客态 / 资料+偏好保存）
2. **#37** live JWT browser — ✅ `pnpm test:e2e:live`（真实邮箱登录 + Account 身份/settings）
3. **#37** — 生产 cookie / OAuth browser — 仍待 `*.acongm.com`
4. **#48** — 匿名 → OAuth 同 uid live E2E（需 Manual Linking）
