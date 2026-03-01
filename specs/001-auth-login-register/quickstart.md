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

1. 完成登录页、注册页（antd + less）及基础校验。
2. 对接 `authApi`，处理成功与失败提示。
3. 建立 `authStore` 管理 token 与用户信息。
4. 接入 `ProtectedRoute`，实现未登录拦截。
5. 增加登出入口并清理本地登录态。

## 6. 联调检查

- 注册成功后可立即登录。
- 重复用户名注册被拒绝且提示明确。
- 错误密码登录失败并返回标准错误码。
- 刷新后调用 `/auth/me`，登录态可恢复。
- 登出后原 token 不可继续访问受保护接口。

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
