# Tasks: MCP Tool Adapter 基础落地（含最小开关页）

**Input**: Design documents from `/specs/001-mcp-tool-framework/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: 规格明确要求单元测试、集成测试、回归测试，包含对应测试任务。  
**Organization**: 任务按用户故事（US1-US4）分组，支持独立实现与独立验证。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件、无未完成依赖）
- **[Story]**: 所属用户故事（US1/US2/US3/US4）
- 每条任务均包含明确文件路径

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 建立 MCP 与开关页所需基础目录、配置与测试骨架

- [X] T001 创建 MCP 模块目录于 `backend/src/modules/ai/mcp/`
- [X] T002 [P] 新增 MCP 配置读取模块于 `backend/src/config/mcp.js`
- [X] T003 [P] 创建后端测试目录骨架于 `backend/tests/unit/ai/`、`backend/tests/integration/ai/`、`backend/tests/contract/ai/`
- [X] T004 [P] 创建前端页面与 API 目录骨架于 `frontend/src/pages/McpTogglePage/`、`frontend/src/api/mcpApi.js`
- [X] T005 [P] 在环境样例新增 MCP 变量于 `.env.docker.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 完成所有用户故事共享的阻塞能力

**⚠️ CRITICAL**: 本阶段完成前，不进入用户故事实现

- [X] T006 实现工具常量与能力枚举于 `backend/src/modules/ai/mcp/tool.constants.js`
- [X] T007 [P] 实现白名单解析与判定工具于 `backend/src/modules/ai/mcp/whitelist.js`
- [X] T008 [P] 实现 MCP 错误映射工具于 `backend/src/modules/ai/mcp/tool.errors.js`
- [X] T009 实现工具注册中心骨架于 `backend/src/modules/ai/mcp/toolRegistry.js`
- [X] T010 实现工具执行器骨架于 `backend/src/modules/ai/mcp/toolExecutor.js`
- [X] T011 [P] 实现聊天编排器骨架于 `backend/src/modules/ai/mcp/chatOrchestrator.js`
- [X] T012 实现开关状态仓储骨架于 `backend/src/modules/ai/mcp/toggle.repository.js`
- [X] T013 在 AI 服务接入 MCP 分流入口于 `backend/src/modules/ai/ai.service.js`
- [X] T014 在 AI 控制器保留 chat 响应兼容分支于 `backend/src/modules/ai/ai.controller.js`

**Checkpoint**: Foundation 完成，允许进入用户故事

---

## Phase 3: User Story 1 - 聊天中安全调用工具 (Priority: P1) 🎯 MVP

**Goal**: 命中白名单工具时完成调用闭环，且对外接口保持兼容。  
**Independent Test**: MCP 开启时命中只读工具可返回增强答案；关闭时与历史行为一致。

### Tests for User Story 1

- [X] T015 [P] [US1] 新增 chat 兼容契约测试于 `backend/tests/contract/ai/chat.mcp.contract.test.js`
- [X] T016 [P] [US1] 新增注册中心单元测试于 `backend/tests/unit/ai/toolRegistry.test.js`
- [X] T017 [P] [US1] 新增执行器成功路径单元测试于 `backend/tests/unit/ai/toolExecutor.success.test.js`
- [X] T018 [P] [US1] 新增编排循环收敛单元测试于 `backend/tests/unit/ai/chatOrchestrator.loop.test.js`
- [X] T019 [P] [US1] 新增工具成功集成测试于 `backend/tests/integration/ai/chat.tool-success.test.js`

### Implementation for User Story 1

- [X] T020 [P] [US1] 实现注册中心增删查启停逻辑于 `backend/src/modules/ai/mcp/toolRegistry.js`
- [X] T021 [P] [US1] 实现只读示例工具适配器于 `backend/src/modules/ai/mcp/adapters/mockQueryTool.js`
- [X] T022 [US1] 挂载默认工具清单于 `backend/src/modules/ai/mcp/defaultTools.js`
- [X] T023 [US1] 实现执行器参数标准化与结果封装于 `backend/src/modules/ai/mcp/toolExecutor.js`
- [X] T024 [US1] 实现编排器回灌流程于 `backend/src/modules/ai/mcp/chatOrchestrator.js`
- [X] T025 [US1] 在 AI 服务接入编排调用于 `backend/src/modules/ai/ai.service.js`
- [X] T026 [US1] 在 AI 控制器保证流式/非流式兼容于 `backend/src/modules/ai/ai.controller.js`

**Checkpoint**: US1 独立可演示

---

## Phase 4: User Story 2 - 工具失败自动降级 (Priority: P2)

**Goal**: 工具超时/异常时自动降级为纯模型回复，保证接口可用。  
**Independent Test**: 注入超时和异常后，`/api/ai/chat` 仍返回可读回复且不泄露内部错误。

### Tests for User Story 2

- [X] T027 [P] [US2] 新增超时重试单元测试于 `backend/tests/unit/ai/toolExecutor.retry-timeout.test.js`
- [X] T028 [P] [US2] 新增降级触发单元测试于 `backend/tests/unit/ai/chatOrchestrator.fallback.test.js`
- [X] T029 [P] [US2] 新增超时集成测试于 `backend/tests/integration/ai/chat.tool-timeout.test.js`
- [X] T030 [P] [US2] 新增异常集成测试于 `backend/tests/integration/ai/chat.tool-error.test.js`

### Implementation for User Story 2

- [X] T031 [US2] 在执行器实现超时与重试策略于 `backend/src/modules/ai/mcp/toolExecutor.js`
- [X] T032 [US2] 在编排器实现统一降级分支于 `backend/src/modules/ai/mcp/chatOrchestrator.js`
- [X] T033 [US2] 在 AI 服务实现失败回退模型路径于 `backend/src/modules/ai/ai.service.js`
- [X] T034 [US2] 在白名单层拒绝 write 能力工具于 `backend/src/modules/ai/mcp/whitelist.js`

**Checkpoint**: US2 独立可验证

---

## Phase 5: User Story 3 - 运营可观测与可审计 (Priority: P3)

**Goal**: 建立调用日志与会话追踪，支持成功率/失败率/耗时分析。  
**Independent Test**: 成功与失败调用均能落库并按会话检索关键字段。

### Tests for User Story 3

- [X] T035 [P] [US3] 新增日志仓储单元测试于 `backend/tests/unit/ai/ai.repository.tool-log.test.js`
- [X] T036 [P] [US3] 新增日志链路集成测试于 `backend/tests/integration/ai/chat.tool-logging.test.js`
- [X] T037 [P] [US3] 新增日志字段契约测试于 `backend/tests/contract/ai/tool-log.contract.test.js`

### Implementation for User Story 3

- [X] T038 [US3] 新增日志迁移脚本于 `backend/src/db/migrations/005-mcp-tool-logs.sql`
- [X] T039 [US3] 新增开关状态迁移脚本于 `backend/src/db/migrations/006-mcp-tool-toggles.sql`
- [X] T040 [US3] 更新初始化 SQL 以含开关表于 `backend/scripts/migrate.sql`
- [X] T041 [US3] 在仓储层实现日志写入与查询于 `backend/src/modules/ai/ai.repository.js`
- [X] T042 [US3] 在编排器写入调用明细与会话汇总于 `backend/src/modules/ai/mcp/chatOrchestrator.js`
- [X] T043 [US3] 在服务层增加指标采样点于 `backend/src/modules/ai/ai.service.js`

**Checkpoint**: US3 独立可验证

---

## Phase 6: User Story 4 - 手动控制 MCP 开关 (Priority: P3)

**Goal**: 提供最小管理页面，可手动启停单个 MCP 并在短时间内生效。  
**Independent Test**: 页面关闭某工具后其不再被调用，重新开启后恢复调用。

### Tests for User Story 4

- [X] T044 [P] [US4] 新增开关接口契约测试于 `backend/tests/contract/ai/mcp-toggle.contract.test.js`
- [X] T045 [P] [US4] 新增开关仓储单元测试于 `backend/tests/unit/ai/toggle.repository.test.js`
- [X] T046 [P] [US4] 新增开关接口集成测试于 `backend/tests/integration/ai/mcp-toggle.api.test.js`
- [X] T047 [P] [US4] 新增开关页渲染与交互测试于 `frontend/src/pages/McpTogglePage/index.test.jsx`

### Implementation for User Story 4

- [X] T048 [US4] 在 AI 路由新增开关管理接口于 `backend/src/modules/ai/ai.routes.js`
- [X] T049 [US4] 在 AI 控制器实现列表与切换动作于 `backend/src/modules/ai/ai.controller.js`
- [X] T050 [US4] 在 MCP 仓储实现状态读写与审计于 `backend/src/modules/ai/mcp/toggle.repository.js`
- [X] T051 [US4] 在注册中心接入动态开关状态读取于 `backend/src/modules/ai/mcp/toolRegistry.js`
- [X] T052 [US4] 新增前端开关 API 封装于 `frontend/src/api/mcpApi.js`
- [X] T053 [US4] 新增最小开关页组件于 `frontend/src/pages/McpTogglePage/index.jsx`
- [X] T054 [US4] 新增开关页样式于 `frontend/src/pages/McpTogglePage/index.less`
- [X] T055 [US4] 在路由中挂载开关页入口于 `frontend/src/router/index.jsx`

**Checkpoint**: US4 独立可验证

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 灰度发布、回归验证、上线回滚与文档收敛

- [X] T056 [P] 补充 MCP 变量说明于 `.env.docker.example`
- [X] T057 [P] 在 Docker 编排注入 MCP 变量于 `docker-compose.yml`
- [X] T058 更新 quickstart 执行与回滚步骤于 `specs/001-mcp-tool-framework/quickstart.md`
- [X] T059 [P] 在后端脚本增加回归命令于 `backend/package.json`
- [ ] T060 执行并记录回归结果于 `specs/001-mcp-tool-framework/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 可立即开始
- **Phase 2 (Foundational)**: 依赖 Phase 1，阻塞全部用户故事
- **Phase 3 (US1)**: 依赖 Phase 2，MVP 主线
- **Phase 4 (US2)**: 依赖 US1（复用执行器/编排器）
- **Phase 5 (US3)**: 依赖 US1，可与 US2 部分并行
- **Phase 6 (US4)**: 依赖 US1 与 US3（需调用链与开关数据层）
- **Phase 7 (Polish)**: 依赖目标故事完成

### User Story Dependencies

- **US1 (P1)**: Foundation 完成后即可独立实施
- **US2 (P2)**: 依赖 US1 的执行器与编排链路
- **US3 (P3)**: 依赖 US1 调用链路
- **US4 (P3)**: 依赖 US1（调用生效验证）与 US3（开关状态持久化）

### Parallel Opportunities

- Phase 1: T002/T003/T004/T005 可并行
- Phase 2: T007/T008/T011 可并行
- US1 tests: T015-T019 可并行
- US2 tests: T027-T030 可并行
- US3 tests: T035-T037 可并行
- US4 tests: T044-T047 可并行
- Polish: T056/T057/T059 可并行

---

## Parallel Example: User Story 4

```bash
Task: "T044 [US4] 开关契约测试 in backend/tests/contract/ai/mcp-toggle.contract.test.js"
Task: "T045 [US4] 开关仓储单元测试 in backend/tests/unit/ai/toggle.repository.test.js"
Task: "T047 [US4] 开关页交互测试 in frontend/src/pages/McpTogglePage/index.test.jsx"

Task: "T052 [US4] 前端开关 API in frontend/src/api/mcpApi.js"
Task: "T053 [US4] 开关页实现 in frontend/src/pages/McpTogglePage/index.jsx"
```

---

## Implementation Strategy

### MVP First (仅 US1)

1. 完成 Phase 1 + Phase 2
2. 完成 Phase 3（US1）
3. 独立验证兼容性与可用性

### Incremental Delivery

1. 先交付 US1（调用闭环）
2. 再交付 US2（失败降级）
3. 再交付 US3（观测审计）
4. 再交付 US4（最小开关页）
5. 最后执行 Phase 7 上线与回滚演练

### Format Validation

- 所有任务采用 `- [ ] Txxx ...` 格式  
- 并行任务均标注 `[P]`  
- 用户故事任务均标注 `[US1]/[US2]/[US3]/[US4]`  
- 每条任务都包含明确文件路径，可直接执行
