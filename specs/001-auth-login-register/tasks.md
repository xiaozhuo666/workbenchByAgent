# Tasks: 登录注册与会话管理 MVP

**Input**: Design documents from `/specs/001-auth-login-register/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/auth.openapi.yaml`, `quickstart.md`

**Tests**: 本功能已明确最小测试集合，任务中包含后端集成/契约测试与前端关键流程测试。  
**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- 所有任务均包含明确文件路径

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`, `backend/tests/`, `frontend/tests/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 项目初始化与基础开发环境准备

- [ ] T001 Create backend project skeleton and npm scripts in `backend/package.json`
- [ ] T002 Create frontend project skeleton and npm scripts in `frontend/package.json`
- [ ] T003 [P] Add backend environment template in `backend/.env.example`
- [ ] T004 [P] Add frontend environment template in `frontend/.env.example`
- [ ] T005 [P] Initialize backend app entry and health route in `backend/src/app.js`
- [ ] T006 [P] Initialize frontend app shell and router entry in `frontend/src/router/index.jsx`
- [ ] T007 [P] Add shared auth error code constants in `backend/src/utils/errorCodes.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 所有用户故事的阻塞基础能力（数据库、鉴权中间件、统一错误处理）

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Create MySQL migration script for `users` and `sessions` tables in `backend/scripts/migrate.sql`
- [ ] T009 Implement database connection pool and config loader in `backend/src/db/index.js`
- [ ] T010 [P] Implement bcrypt/hash and JWT helper utilities in `backend/src/utils/crypto.js`
- [ ] T011 [P] Implement JWT auth middleware with session/jti verification in `backend/src/middleware/auth.js`
- [ ] T012 [P] Implement request validation helpers for auth payloads in `backend/src/modules/auth/auth.validator.js`
- [ ] T013 Implement unified API error middleware and response envelope in `backend/src/middleware/errorHandler.js`
- [ ] T014 Configure CORS, JSON parser, and middleware wiring in `backend/src/app.js`
- [ ] T015 Create auth data access base methods in `backend/src/modules/auth/auth.repository.js`
- [ ] T016 Wire auth route mount and API prefix in `backend/src/app.js`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 账号注册与登录 (Priority: P1) 🎯 MVP

**Goal**: 用户可完成注册与登录，并进入工作台首页

**Independent Test**: 新用户注册成功后可立即登录，服务端返回 token，前端跳转受保护首页

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T017 [P] [US1] Add contract test for `POST /api/auth/register` in `backend/tests/contract/auth.register.contract.test.js`
- [ ] T018 [P] [US1] Add contract test for `POST /api/auth/login` in `backend/tests/contract/auth.login.contract.test.js`
- [ ] T019 [P] [US1] Add integration test for duplicate username in `backend/tests/integration/auth.register-duplicate.test.js`
- [ ] T020 [P] [US1] Add frontend test for login/register form validation in `frontend/tests/auth/auth.forms.test.jsx`

### Implementation for User Story 1

- [ ] T021 [US1] Implement register repository operations (`findByUsername`, `createUser`) in `backend/src/modules/auth/auth.repository.js`
- [ ] T022 [US1] Implement login repository operations (`findByAccount`) in `backend/src/modules/auth/auth.repository.js`
- [ ] T023 [US1] Implement register business flow (validate, hash, persist) in `backend/src/modules/auth/auth.service.js`
- [ ] T024 [US1] Implement login business flow (credential check, sign JWT, create session) in `backend/src/modules/auth/auth.service.js`
- [ ] T025 [US1] Implement register/login controllers and response mapping in `backend/src/modules/auth/auth.controller.js`
- [ ] T026 [US1] Implement register/login routes in `backend/src/modules/auth/auth.routes.js`
- [ ] T027 [US1] Implement auth API client (`register`, `login`) in `frontend/src/api/authApi.js`
- [ ] T028 [US1] Implement auth state store for token and user in `frontend/src/services/authStore.js`
- [ ] T029 [US1] Build register page with antd + less form in `frontend/src/pages/RegisterPage/index.jsx`
- [ ] T030 [US1] Build register page styles in `frontend/src/pages/RegisterPage/index.less`
- [ ] T031 [US1] Build login page with antd + less form in `frontend/src/pages/LoginPage/index.jsx`
- [ ] T032 [US1] Build login page styles and error states in `frontend/src/pages/LoginPage/index.less`
- [ ] T033 [US1] Add login-success navigation to protected home route in `frontend/src/router/index.jsx`

**Checkpoint**: User Story 1 should be fully functional and independently testable

---

## Phase 4: User Story 2 - 登录态保持与退出 (Priority: P1)

**Goal**: 刷新后可恢复登录态；登出后会话失效并返回登录页

**Independent Test**: 登录后刷新页面保持登录；登出后旧 token 无法访问 `/api/auth/me`

### Tests for User Story 2 ⚠️

- [ ] T034 [P] [US2] Add contract test for `GET /api/auth/me` in `backend/tests/contract/auth.me.contract.test.js`
- [ ] T035 [P] [US2] Add contract test for `POST /api/auth/logout` in `backend/tests/contract/auth.logout.contract.test.js`
- [ ] T036 [P] [US2] Add integration test for token revocation after logout in `backend/tests/integration/auth.logout-revoke.test.js`
- [ ] T037 [P] [US2] Add frontend test for route guard and restore flow in `frontend/tests/auth/auth.guard-restore.test.jsx`

### Implementation for User Story 2

- [ ] T038 [US2] Implement `getCurrentUser` and `logout` session logic in `backend/src/modules/auth/auth.service.js`
- [ ] T039 [US2] Implement `/me` and `/logout` controllers in `backend/src/modules/auth/auth.controller.js`
- [ ] T040 [US2] Add `/me` and `/logout` routes with auth middleware in `backend/src/modules/auth/auth.routes.js`
- [ ] T041 [US2] Extend auth API client (`me`, `logout`) in `frontend/src/api/authApi.js`
- [ ] T042 [US2] Implement token restore/bootstrap logic on app load in `frontend/src/services/authStore.js`
- [ ] T043 [US2] Implement protected route guard in `frontend/src/router/ProtectedRoute.jsx`
- [ ] T044 [US2] Wire protected route and unauthorized redirect handling in `frontend/src/router/index.jsx`
- [ ] T045 [US2] Implement logout action and UI entry in `frontend/src/components/AuthLogoutButton.jsx`
- [ ] T046 [US2] Add global 401/403 interceptor and auto-clear auth state in `frontend/src/api/httpClient.js`

**Checkpoint**: User Story 1 and User Story 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 联调收口、安全加固、文档同步与验收走查

- [ ] T047 [P] Add request id and sensitive-field log masking in `backend/src/middleware/requestContext.js`
- [ ] T048 [P] Document API error code mapping and UI messages in `specs/001-auth-login-register/quickstart.md`
- [ ] T049 Run end-to-end MVP checklist validation in `specs/001-auth-login-register/checklists/mvp-validation.md`
- [ ] T050 Run quickstart verification and update execution notes in `specs/001-auth-login-register/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 无依赖，可立即开始
- **Phase 2 (Foundational)**: 依赖 Phase 1 完成；阻塞所有用户故事
- **Phase 3 (US1)**: 依赖 Phase 2；形成 MVP 最小可用闭环
- **Phase 4 (US2)**: 依赖 Phase 3 的登录能力；补齐保持登录与登出失效
- **Phase 5 (Polish)**: 依赖 US1 + US2 完成

### User Story Dependencies

- **US1**: 无业务前置故事依赖（仅依赖 Foundational）
- **US2**: 依赖 US1 已具备登录能力与 token 发放

### Within Each User Story

- Tests MUST 先写并失败，再进入实现
- Repository/Service -> Controller -> Route -> Frontend Integration 顺序执行
- 每个故事完成后先做独立验收，再进入下一故事

### Parallel Opportunities

- Phase 1 中 T003/T004/T005/T006/T007 可并行
- Phase 2 中 T010/T011/T012 可并行
- US1 中 T017/T018/T019/T020 可并行，T029/T030 与 T031/T032 可并行
- US2 中 T034/T035/T036/T037 可并行，T043 与 T046 可并行

---

## Parallel Example: User Story 1

```bash
Task: "T017 [US1] backend/tests/contract/auth.register.contract.test.js"
Task: "T018 [US1] backend/tests/contract/auth.login.contract.test.js"
Task: "T020 [US1] frontend/tests/auth/auth.forms.test.jsx"
```

## Parallel Example: User Story 2

```bash
Task: "T034 [US2] backend/tests/contract/auth.me.contract.test.js"
Task: "T035 [US2] backend/tests/contract/auth.logout.contract.test.js"
Task: "T037 [US2] frontend/tests/auth/auth.guard-restore.test.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1 + Phase 2
2. 完成 US1（Phase 3）
3. 执行 US1 独立验收：注册、重复用户名、登录成功
4. 若通过即可演示 MVP

### Incremental Delivery

1. 先交付 US1（注册/登录）
2. 再交付 US2（登录态恢复/登出失效）
3. 最后做 Phase 5 收口与文档更新

### Parallel Team Strategy

1. 开发者 A：后端认证主链路（T021-T026, T038-T040）
2. 开发者 B：前端页面与路由守卫（T027-T033, T041-T046）
3. 开发者 C：测试与契约（T017-T020, T034-T037, T049）

---

## Notes

- 每条任务均满足格式：`- [ ] Txxx [P?] [US?] 描述 + 文件路径`
- 建议 MVP 范围：**仅 US1（Phase 3）**
- 完成 US1 后即可进入 `/speckit.implement` 分阶段开发
