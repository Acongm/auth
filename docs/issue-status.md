# Auth 仓库 Issue 状态

> 最后更新：2026-09-03  
> 跨仓统一跟踪：[`platform-issue-status.md`](https://github.com/Acongm/node-vercel-starter/blob/main/docs/platform-issue-status.md)

## 本仓 Issues（对照 `origin/main`）

| # | 标题 | 代码 | GitHub | 说明 |
|---|------|------|--------|------|
| **52** | getUserInfo 登录态 | ✅ | **CLOSED** 2026-08-19 | |
| **51** | Auth Client 收口 | ✅ | **CLOSED** 2026-08-19 | |
| **47** | 匿名 uid 保留（PR） | ✅ | **MERGED** | `linkIdentity` 实现 |
| **48** | Anonymous Identity Upgrade | 源码 + 合同 ✅ | OPEN | 真人 OAuth 同 uid 未证；`test.todo` 仍在 |
| **28** | Account Profile | `/account` + BFF + settings ✅ | OPEN | **本仓没有** `e2e/`；browser → `#37` |
| **29** | SSO URL 基线 | docs + `isAllowedReturnTo` ✅ | OPEN | 生产回跳回归未做 |
| **25** | 生产 GitHub OAuth | 客户端 + runbook ✅ | OPEN | Dashboard / 生产回跳 |
| **26** | 生产 Google OAuth | 客户端 + runbook ✅ | OPEN | 同上 |
| **27** | 生产 Email SMTP | UI + 匿名邮箱门闩 ✅ | OPEN | SMTP / confirm / recovery |
| **50** | Auth 产品完善 | session + account ✅ | OPEN | Security 页 / registry / browser |
| **16** | Auth v2 Epic | Stage 1 代码部分完成 | OPEN | 等 Stage 0 + `#37` |
| **42** | Account Center Epic | — | OPEN | Stage 6，不抢主线 |

## 纠正

- 旧文档写「`#37` Auth Playwright smoke ✅」——**错误**。auth `main` 没有 `e2e/quality-gate-smoke.spec.ts`，也没有 `test:e2e:live`。
- Manual Linking 已在生产打开（2026-08-19 `#37` 评论），**不能**据此关闭 `#48`。

## 下一步

1. `auth#48` 真人匿名 → GitHub/Google，证明 callback 后 `auth.uid()` 不变
2. 给 `#28` / `#50` 补 Auth Playwright，或并入 `#37` 生产 cookie 路径
3. `#25` / `#26` / `#27` 只做生产配置与回跳，不再改客户端主路径
