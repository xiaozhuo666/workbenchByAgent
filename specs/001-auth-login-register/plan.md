# Implementation Plan: 登录注册与会话管理 MVP

**Branch**: `001-auth-login-register` | **Date**: 2026-03-01 | **Spec**: `C:/Users/HP/Desktop/note/AI/ai_project/specs/001-auth-login-register/spec.md`
**Input**: Feature specification from `/specs/001-auth-login-register/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

本计划落地登录/注册 MVP，仅包含注册、登录、登录态保持、登出与未登录拦截。
技术方案固定为前后端分离：后端 Node.js + Express 提供认证 API，前端 React + Ant
Design 消费 API，MySQL 存储用户与会话。鉴权采用 JWT，前端通过受控存储与路由守卫完成
刷新保持登录和未登录拦截。

## Implementation Update (2026-03-01)

- 认证入口已合并为统一页面：`/auth`（`mode=login|register` 切换）。
- 兼容旧入口：`/login -> /auth?mode=login`，`/register -> /auth?mode=register`。
- 前端认证页实现路径：`frontend/src/pages/AuthPage/index.jsx` + `frontend/src/pages/AuthPage/index.css`。
- `ProtectedRoute` 未登录重定向目标已更新为 `/auth?mode=login`。

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: JavaScript (Node.js 20 LTS), SQL (MySQL 8.x), TypeScript 可选（后续迭代）  
**Primary Dependencies**: Express, mysql2, bcrypt, jsonwebtoken, cors, dotenv, React, React Router, antd  
**Storage**: MySQL（`users`、`sessions`）  
**Testing**: 后端 Jest + Supertest；前端 React Testing Library；接口联调使用 Postman/HTTP 客户端  
**Target Platform**: Web（现代桌面浏览器）+ Node.js API 服务  
**Project Type**: Web application（frontend + backend）  
**Performance Goals**: 登录/注册接口 p95 < 500ms（本地开发环境）；首屏鉴权恢复 < 2s  
**Constraints**: 前端仅调用后端 API；鉴权固定 JWT；敏感凭据仅环境变量注入；不实现密码找回/第三方登录  
**Scale/Scope**: 单用户体系 MVP，覆盖认证主流程与 5 条核心验收场景

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Gate 1 - 后端与前端技术栈**: 使用 Node.js + Express 后端、React 前端，并由前端调用后端 API，**PASS**。
- **Gate 2 - 前端样式与组件库**: 页面与组件统一 Less + antd，**PASS**。
- **Gate 3 - 图表与可视化**: 本期不涉及图表功能，不违反 ECharts 原则，**PASS**。
- **Gate 4 - 数据持久化**: 用户与会话主存储为 MySQL，**PASS**。
- **补充约束核验**: JWT 鉴权固定；QQ 邮箱授权码仅环境变量注入（为后续邮件模块预留），**PASS**。

## Project Structure

### Documentation (this feature)

```text
specs/001-auth-login-register/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
backend/
├── src/
│   ├── config/
│   ├── db/
│   ├── middleware/
│   ├── modules/
│   │   └── auth/
│   │       ├── auth.controller.js
│   │       ├── auth.service.js
│   │       ├── auth.repository.js
│   │       ├── auth.validator.js
│   │       └── auth.routes.js
│   ├── utils/
│   └── app.js
├── scripts/
│   └── migrate.sql
└── tests/
    ├── contract/
    └── integration/

frontend/
├── src/
│   ├── api/
│   │   └── authApi.js
│   ├── components/
│   ├── pages/
│   │   └── AuthPage/
│   ├── router/
│   │   ├── ProtectedRoute.jsx
│   │   └── index.jsx
│   └── services/
│       └── authStore.js
└── tests/
    └── auth/
```

**Structure Decision**: 采用 Web application 双端结构（`backend/` + `frontend/`），认证能力先在
`backend/src/modules/auth` 闭环实现，再由 `frontend/src/pages` 与 `frontend/src/router` 接入。

## Environment Variables

### Backend (`backend/.env`)

- `PORT`: API 端口（默认 4000）
- `DB_HOST`: MySQL 地址
- `DB_PORT`: MySQL 端口（默认 3306）
- `DB_NAME`: 数据库名
- `DB_USER`: 数据库用户
- `DB_PASSWORD`: 数据库密码
- `JWT_SECRET`: JWT 签名密钥（必须高强度）
- `JWT_EXPIRES_IN`: access token 过期时间（建议 `2h`）
- `BCRYPT_SALT_ROUNDS`: bcrypt 轮数（建议 `10` 或以上）
- `QQ_MAIL_USER`: QQ 邮箱账号（后续邮件模块使用）
- `QQ_MAIL_AUTH_CODE`: QQ 邮箱授权码（严禁写入代码/文档明文）

### Frontend (`frontend/.env`)

- `REACT_APP_API_BASE_URL`: 后端 API 基地址（如 `http://localhost:4000/api`）

## Complexity Tracking

> 当前无违反宪章项，无需豁免说明。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Phase 0 - Research Output

研究结论详见 `research.md`，本期所有关键决策已收敛，无 `NEEDS CLARIFICATION` 未决项。

## Phase 1 - Design Output

- 数据模型：`data-model.md`
- 接口契约：`contracts/auth.openapi.yaml`
- 联调与验收步骤：`quickstart.md`

## API Design (MVP Scope)

### 1) 注册

- `POST /api/auth/register`
- 请求体：`{ "username": "alice", "email": "alice@example.com", "password": "StrongP@ss1" }`
- 成功：`201`，返回用户基本信息与 token（或仅用户信息，按前后端约定）

### 2) 登录

- `POST /api/auth/login`
- 请求体：`{ "account": "alice", "password": "StrongP@ss1" }`
- 成功：`200`，返回 token 与用户信息

### 3) 登出

- `POST /api/auth/logout`
- Header：`Authorization: Bearer <token>`
- 成功：`200`，当前 token 对应会话置为失效

### 4) 获取当前用户（登录态恢复）

- `GET /api/auth/me`
- Header：`Authorization: Bearer <token>`
- 成功：`200`，返回当前用户信息（不含敏感字段）

### Error Code & Message 规范

- `AUTH_INVALID_CREDENTIALS`：账号或密码错误
- `AUTH_USERNAME_EXISTS`：用户名已存在
- `AUTH_PASSWORD_WEAK`：密码强度不足
- `AUTH_TOKEN_MISSING`：缺少 token
- `AUTH_TOKEN_EXPIRED`：token 已过期
- `AUTH_TOKEN_INVALID`：token 非法
- `AUTH_SESSION_INVALID`：会话无效或已登出
- `SYS_INTERNAL_ERROR`：后端内部错误
- 统一响应结构：`{ "code": "AUTH_XXX", "message": "用户可读信息", "requestId": "..." }`

## Authentication Strategy

- 使用 JWT access token（不做 Session/JWT 二选一）。
- token 建议存放在前端内存 + 刷新前从安全持久层恢复（MVP 可先 localStorage，后续可迁移 HttpOnly Cookie）。
- 每次登录签发 token，并在 `sessions` 表记录 `jti`、过期时间、状态。
- 刷新页面时调用 `/api/auth/me` 进行登录态恢复。
- 路由守卫 `ProtectedRoute`：无 token 或校验失败时重定向到认证入口页（登录模式）。
- 登出时调用 `/api/auth/logout`，服务端将会话置失效，前端清理 token 与用户态。

## Security Requirements

- 密码仅存 bcrypt 哈希，不存明文。
- 输入校验：账号格式、密码强度、email 合法性、字段长度上限。
- 日志脱敏：不记录密码、token、授权码、数据库密码等敏感信息。
- 最小权限：数据库账户仅授予必要 DML 权限；生产环境禁止调试回显。

## Frontend Flow

- 认证页（登录模式）：表单校验 -> 调用登录 API -> 成功后存 token + 拉取 `/me` -> 跳转工作台。
- 认证页（注册模式）：表单校验（用户名唯一格式、密码强度、二次确认）-> 调用注册 API -> 成功后自动登录并跳转工作台。
- 全局拦截：401/403 时清理本地登录态并跳转认证入口页，展示统一错误提示。
- 登出流程：点击登出 -> 调用登出 API -> 清理前端状态 -> 回到认证入口页。

## Test Plan (Minimum Set)

- 注册成功：新用户可创建并可登录。
- 重复用户名：注册被拒绝并返回 `AUTH_USERNAME_EXISTS`。
- 登录失败：错误密码返回 `AUTH_INVALID_CREDENTIALS`。
- 登录态恢复：刷新页面后 `/me` 成功，用户保持登录。
- 登出失效：登出后旧 token 访问 `/me` 返回 `AUTH_SESSION_INVALID` 或 `AUTH_TOKEN_INVALID`。

## Task Breakdown

### P0 后端先行（阻塞）

1. 建库建表脚本：`users`、`sessions`，加唯一索引与查询索引。
2. 实现认证模块：注册、登录、登出、`/me`。
3. JWT 中间件与错误处理中间件。
4. 单元/集成测试覆盖 5 条最小测试集。

### P1 前端接入

1. 登录页、注册页（antd + less）与表单校验。
2. `authApi` 与 `authStore`（token + 用户态）。
3. 路由守卫与未登录拦截。
4. 登出按钮与状态清理。

### P2 联调

1. 对齐错误码与文案映射。
2. CORS、请求头、超时与重试策略验证。
3. 刷新保持登录与 token 过期回退验证。

### P3 测试与验收

1. 执行最小测试集合并修复缺陷。
2. 按 5 条验收场景走查并记录结果。
3. 更新文档与回归检查。

## Risks & Mitigations

- **JWT 提前失效与会话不一致**：通过 `sessions` 表状态 + `jti` 双校验控制登出立即生效。
- **跨域问题影响联调**：后端白名单 CORS，前端统一 API Base URL。
- **token 存储安全性**：MVP 使用受控存储并限制生命周期，后续升级 HttpOnly Cookie。
- **QQ 邮箱后续集成兼容性**：预留环境变量，不在本期耦合邮件发送逻辑，避免阻塞认证主线。

## Constitution Check (Post-Design Re-check)

- 设计完成后再次核验：Node.js + React + antd + MySQL 均保持一致，**PASS**。
- 本期无宪章冲突项，无需复杂度豁免，**PASS**。
