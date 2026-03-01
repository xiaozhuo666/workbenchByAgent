# Quickstart - 登录注册与会话管理 MVP

## 1. 前置准备

- 安装 Node.js 20 LTS、MySQL 8.x。
- 在本地创建数据库（例如 `ai_workbench`）。
- 准备后端与前端环境变量文件：
  - `backend/.env`
  - `frontend/.env`

## 2. 环境变量示例

### backend/.env

```env
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=ai_workbench
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=replace_with_strong_secret
JWT_EXPIRES_IN=2h
BCRYPT_SALT_ROUNDS=10
QQ_MAIL_USER=your_qq_mail
QQ_MAIL_AUTH_CODE=your_qq_mail_auth_code
```

### frontend/.env

```env
REACT_APP_API_BASE_URL=http://localhost:4000/api
```

> 注意：`QQ_MAIL_AUTH_CODE` 仅允许环境变量注入，不得写入代码或文档明文。

## 3. 数据库初始化

1. 执行 `specs/001-auth-login-register/data-model.md` 中 DDL 草案。
2. 确认 `users`、`sessions` 表创建成功，唯一索引可用。

## 4. 后端实现顺序（先行）

1. 建立 Express 应用与中间件（json、cors、error handler）。
2. 完成 `POST /auth/register`。
3. 完成 `POST /auth/login`（签发 JWT 并创建 session）。
4. 完成 `POST /auth/logout`（撤销 session）。
5. 完成 `GET /auth/me`（用于刷新恢复登录态）。
6. 补齐错误码与统一响应结构。

## 5. 前端接入顺序

1. 完成统一认证页（登录/注册同页切换，antd + CSS）及基础校验。
2. 对接 `authApi`，处理成功与失败提示。
3. 建立 `authStore` 管理 token 与用户信息。
4. 接入 `ProtectedRoute`，实现未登录拦截。
5. 增加登出入口并清理本地登录态。

### UI 视觉规范（新增）

- 认证入口统一为 `GET /auth`，通过 `mode=login|register` 在同一卡片内切换登录/注册。
- 登录与注册共享双栏布局（品牌信息区 + 表单区），移动端自动折叠为单栏。
- 布局风格参考云控制台登录页：左侧科技视觉区、右侧固定宽度认证窗（约 360px 表单区）。
- 使用渐变背景、品牌说明卡片、统一的按钮与表单圆角样式，保持视觉一致性。
- 错误提示采用“顶部 Alert + 字段级错误”双通道反馈，降低用户重试成本。

### 路由说明（实现态）

- 主认证入口：`/auth`
- 兼容重定向：`/login -> /auth?mode=login`，`/register -> /auth?mode=register`

## 6. 联调检查

**User Story 1**
- 注册成功后可立即登录。
- 重复用户名注册被拒绝且提示明确。
- 错误密码登录失败并返回标准错误码。

**User Story 2（登录态保持与退出）**
- 刷新后调用 `GET /api/auth/me`，登录态可恢复（前端启动时 `restoreSession()` 已接入）。
- 登出后原 token 不可继续访问受保护接口；前端清除本地存储并跳转至认证页。

### 错误码与前端提示映射

- `AUTH_INVALID_CREDENTIALS` -> 账号或密码错误
- `AUTH_USERNAME_EXISTS` -> 用户名已存在
- `AUTH_EMAIL_EXISTS` -> 邮箱已被注册
- `AUTH_INVALID_EMAIL` -> 邮箱格式不正确或未填写
- `AUTH_PASSWORD_WEAK` -> 密码强度不足
- `AUTH_TOKEN_MISSING` / `AUTH_TOKEN_INVALID` / `AUTH_TOKEN_EXPIRED` / `AUTH_SESSION_INVALID` -> 请重新登录
- `SYS_INTERNAL_ERROR` -> 系统繁忙，请稍后重试

## 7. 最小测试集合

- `register_success`
- `register_duplicate_username`
- `login_invalid_password`
- `me_restore_after_refresh`
- `logout_token_revoked`

## 8. 范围边界确认

本阶段不实现：
- 忘记密码、邮箱验证、第三方登录
- 多租户与复杂权限系统
- 邮件/日程/会话业务功能
