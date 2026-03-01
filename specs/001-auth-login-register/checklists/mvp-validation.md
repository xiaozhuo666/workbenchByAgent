# MVP Validation Checklist

**User Story 1 - 账号注册与登录**: ✅ 已实现并验收  
**User Story 2 - 登录态保持与退出**: ✅ 已实现并验收（2026-03-01 代码走查确认）

- [x] 注册接口已定义并实现（`POST /api/auth/register`）
- [x] 登录接口已定义并实现（`POST /api/auth/login`）
- [x] 获取当前用户接口已定义并实现（`GET /api/auth/me`）
- [x] 登出接口已定义并实现（`POST /api/auth/logout`）
- [x] 前端存在统一认证页（登录/注册切换，`/auth`）
- [x] 前端存在未登录拦截路由守卫（`ProtectedRoute` → `/auth?mode=login`）
- [x] 应用启动时调用 `restoreSession()` 拉取 `/me` 恢复登录态
- [x] 登出按钮调用 `/api/auth/logout` 并清理本地 token/用户信息
- [x] 会话在服务端 `sessions` 中可追踪与撤销（`revokeSessionByJti`）
- [x] 401/403 响应时前端自动清除登录态（`httpClient` 拦截器）
- [x] quickstart 已包含最小测试集合
