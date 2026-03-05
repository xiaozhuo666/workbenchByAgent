# Tasks: AI 票务工作台接力体验

**Input**: Design documents from `specs/001-ai-ticket-workbench/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: 未在 spec 中强制 TDD，本任务清单以实现闭环为主，测试验证放在收尾阶段执行。  
**Organization**: 任务按用户故事分组，确保每个故事可独立实现与验证。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件、无前置依赖冲突）
- **[Story]**: 用户故事标签（`[US1]`、`[US2]`、`[US3]`）
- 每条任务都包含明确文件路径

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 建立票务工作台功能的基础目录与访问入口

- [X] T001 创建票务功能目录与占位文件在 `backend/src/modules/ai/ticket/`、`frontend/src/pages/TicketsPage/`、`frontend/src/components/AI/TripDraftCard/`、`frontend/src/api/ticketApi.js`
- [X] T002 [P] 新增票务页路由入口 `/tickets` 于 `frontend/src/router/index.jsx`
- [X] T003 [P] 新增票务 API 客户端方法（草稿、查询、推荐）于 `frontend/src/api/ticketApi.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 完成所有用户故事共享的底座能力（草稿、路由、仓储、错误码）

**⚠️ CRITICAL**: 本阶段完成前，不进入任何用户故事实现

- [X] T004 新增行程草稿与票务日志迁移脚本于 `backend/src/db/migrations/007-ticket-workbench.sql`
- [X] T005 [P] 实现票务仓储（草稿 CRUD、日志写入）于 `backend/src/modules/ai/ticket/ticket.repository.js`
- [X] T006 [P] 实现票务服务基础方法（草稿状态校验、过期判定）于 `backend/src/modules/ai/ticket/ticket.service.js`
- [X] T007 [P] 新增票务控制器骨架（createDraft/getDraft/search/recommend）于 `backend/src/modules/ai/ticket/ticket.controller.js`
- [X] T008 新增票务路由并挂载鉴权中间件于 `backend/src/modules/ai/ticket/ticket.routes.js`
- [X] T009 将票务路由接入应用入口于 `backend/src/app.js`
- [X] T010 在 `backend/src/modules/ai/ai.routes.js` 补充票务相关路由聚合入口或转发配置
- [X] T011 统一票务错误码与降级响应结构于 `backend/src/modules/ai/ticket/ticket.errors.js`

**Checkpoint**: Foundation ready - 用户故事可开始实现

---

## Phase 3: User Story 1 - 聊天到票务的连续接力 (Priority: P1) 🎯 MVP

**Goal**: 用户在聊天中获得结构化行程卡，并通过 `draftId` 跳转票务页自动填充与自动查询  
**Independent Test**: 输入“帮我查明天上海到北京高铁”后，可从聊天一键进入票务页并自动得到首批结果

### Implementation for User Story 1

- [X] T012 [P] [US1] 在 `backend/src/modules/ai/ticket/ticket.controller.js` 实现 `POST /api/ticket-drafts`（创建草稿）
- [X] T013 [P] [US1] 在 `backend/src/modules/ai/ticket/ticket.controller.js` 实现 `GET /api/ticket-drafts/:draftId`（获取草稿）
- [X] T014 [US1] 在 `backend/src/modules/ai/ticket/ticket.service.js` 实现草稿状态流转（collecting/ready/expired）
- [X] T015 [US1] 在 `backend/src/modules/ai/ai.service.js` 增加查票意图识别并生成草稿调用
- [X] T016 [US1] 在 `backend/src/modules/ai/ai.controller.js` 扩展聊天响应结构，支持返回行程卡载荷（含 draftId）
- [X] T017 [P] [US1] 实现聊天行程卡组件 UI 与操作按钮于 `frontend/src/components/AI/TripDraftCard/index.jsx`
- [ ] T018 [US1] 在 `frontend/src/pages/HomePage/index.jsx` 接入行程卡渲染与“查看结果/继续细化”交互
- [X] T019 [P] [US1] 实现票务页基础表单与自动加载逻辑于 `frontend/src/pages/TicketsPage/index.jsx`
- [X] T020 [P] [US1] 实现票务页样式（布局、AI 来源标签、空态/错误态）于 `frontend/src/pages/TicketsPage/index.less`
- [X] T021 [US1] 在 `backend/src/modules/ai/ticket/ticket.controller.js` 实现 `POST /api/tickets/search` 首次查询接口
- [X] T022 [US1] 在 `frontend/src/pages/TicketsPage/index.jsx` 完成 `draftId` 解析、自动填充、自动触发查询
- [X] T023 [US1] 在 `frontend/src/router/index.jsx` 增加票务页保护路由并保持现有路由兼容

**Checkpoint**: US1 完成后，MVP 主链路可独立演示

---

## Phase 4: User Story 2 - 票务工作台高效决策 (Priority: P2)

**Goal**: 在票务页完成直达/中转视图切换、筛选、排序与重查  
**Independent Test**: 不依赖推荐面板，用户也能完成结果比对和候选方案选择

### Implementation for User Story 2

- [X] T024 [P] [US2] 在 `backend/src/modules/ai/ticket/ticket.service.js` 实现直达/中转结果统一映射
- [X] T025 [US2] 在 `backend/src/modules/ai/ticket/ticket.service.js` 实现排序逻辑（最早出发/最短耗时/最低价格）
- [X] T026 [US2] 在 `backend/src/modules/ai/ticket/ticket.service.js` 实现筛选逻辑（席别可售、时段、车次类型）
- [X] T027 [US2] 在 `backend/src/modules/ai/ticket/ticket.controller.js` 扩展查询接口支持覆盖项（sortBy/filters）
- [X] T028 [P] [US2] 在 `frontend/src/pages/TicketsPage/index.jsx` 实现直达/中转 Tab 与结果列表渲染
- [X] T029 [P] [US2] 在 `frontend/src/pages/TicketsPage/index.jsx` 实现筛选、排序、重查交互状态管理
- [X] T030 [US2] 在 `frontend/src/pages/TicketsPage/index.less` 补充结果列表、固定头与响应式细节样式
- [X] T031 [US2] 在 `backend/src/modules/ai/ticket/ticket.repository.js` 增加查询日志落库（success/partial/timeout/error）

**Checkpoint**: US2 完成后，票务工作台核心查询决策能力可独立使用

---

## Phase 5: User Story 3 - AI 三方案推荐解释 (Priority: P3)

**Goal**: 提供最快/最便宜/最舒适三类推荐，且推荐可解释、可一键套用  
**Independent Test**: 推荐失败不影响基础结果；推荐成功时可将建议转成可见筛选条件

### Implementation for User Story 3

- [X] T032 [P] [US3] 在 `backend/src/modules/ai/ticket/ticket.controller.js` 实现 `POST /api/tickets/recommendations`
- [X] T033 [US3] 在 `backend/src/modules/ai/ticket/ticket.service.js` 实现三类推荐策略与理由生成
- [X] T034 [US3] 在 `backend/src/modules/ai/ticket/ticket.service.js` 实现推荐失败降级（返回空推荐 + 可恢复提示）
- [X] T035 [P] [US3] 在 `frontend/src/pages/TicketsPage/index.jsx` 实现 AI 推荐面板与三类推荐卡渲染
- [X] T036 [P] [US3] 在 `frontend/src/pages/TicketsPage/index.jsx` 实现“一键应用推荐”为筛选条件并触发重查
- [X] T037 [US3] 在 `frontend/src/pages/TicketsPage/index.less` 增加推荐面板桌面侧栏与移动端抽屉样式

**Checkpoint**: US3 完成后，AI 决策层体验闭环完成

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 补齐契约一致性、回归验证、文档同步和上线前检查

- [X] T038 [P] 对齐接口实现与契约文档于 `specs/001-ai-ticket-workbench/contracts/ticket-workbench-api.yaml`
- [X] T039 在 `frontend/src/pages/HomePage/index.jsx` 与 `frontend/src/pages/TicketsPage/index.jsx` 补充异常提示文案统一性
- [X] T040 [P] 在 `backend/src/modules/ai/ticket/ticket.service.js` 优化超时与部分结果提示语义
- [ ] T041 按 `specs/001-ai-ticket-workbench/quickstart.md` 执行端到端验证并记录结果于 `specs/001-ai-ticket-workbench/quickstart.md`
- [X] T042 同步实现状态与后续范围说明到 `docs/命令提示词-智能工作台.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 无依赖，可立即开始
- **Phase 2 (Foundational)**: 依赖 Phase 1，且阻塞所有用户故事
- **Phase 3 (US1)**: 依赖 Phase 2，作为 MVP 首发
- **Phase 4 (US2)**: 依赖 Phase 2，可在 US1 后或并行推进（建议 US1 后）
- **Phase 5 (US3)**: 依赖 Phase 2，建议在 US2 稳定后接入
- **Phase 6 (Polish)**: 依赖已选用户故事完成

### User Story Dependencies

- **US1 (P1)**: 仅依赖 Foundational；不依赖 US2/US3
- **US2 (P2)**: 依赖 Foundational；可独立于 US3 完成
- **US3 (P3)**: 依赖 Foundational + 查询结果接口；不阻塞 US1/US2 主流程

### Dependency Graph

- `US1 -> MVP 可上线`
- `US2 -> 增强票务决策能力`
- `US3 -> 增强 AI 决策解释层`

---

## Parallel Opportunities

- Phase 1 中 `T002` 与 `T003` 可并行
- Phase 2 中 `T005`、`T006`、`T007` 可并行
- US1 中 `T012` 与 `T013`、`T017` 与 `T019/T020` 可并行
- US2 中 `T024`、`T028`、`T029` 可并行
- US3 中 `T032`、`T035`、`T036` 可并行

---

## Parallel Example: User Story 1

```bash
Task: "T012 [US1] 实现创建草稿接口 in backend/src/modules/ai/ticket/ticket.controller.js"
Task: "T013 [US1] 实现获取草稿接口 in backend/src/modules/ai/ticket/ticket.controller.js"
Task: "T017 [US1] 实现行程卡组件 in frontend/src/components/AI/TripDraftCard/index.jsx"
Task: "T020 [US1] 实现票务页样式 in frontend/src/pages/TicketsPage/index.less"
```

## Parallel Example: User Story 2

```bash
Task: "T024 [US2] 实现结果映射 in backend/src/modules/ai/ticket/ticket.service.js"
Task: "T028 [US2] 实现直达/中转列表渲染 in frontend/src/pages/TicketsPage/index.jsx"
Task: "T030 [US2] 完善列表样式 in frontend/src/pages/TicketsPage/index.less"
```

## Parallel Example: User Story 3

```bash
Task: "T032 [US3] 实现推荐接口 in backend/src/modules/ai/ticket/ticket.controller.js"
Task: "T035 [US3] 实现推荐面板渲染 in frontend/src/pages/TicketsPage/index.jsx"
Task: "T037 [US3] 实现推荐面板样式 in frontend/src/pages/TicketsPage/index.less"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1 和 Phase 2
2. 完成 Phase 3（US1）
3. 按 `quickstart.md` 只验证 US1 主链路
4. 通过后可先小范围演示

### Incremental Delivery

1. US1 交付“聊天接力 + 自动查询”
2. US2 交付“工作台筛选排序 + 直达中转”
3. US3 交付“AI 三方案推荐 + 一键套用”
4. 每步可独立验收，不回退前一阶段能力

### Parallel Team Strategy

1. 全员先完成 Phase 1/2
2. 分工建议：
   - 开发 A：后端草稿与查询接口（US1/US2）
   - 开发 B：票务页 UI 与状态管理（US1/US2）
   - 开发 C：推荐策略与推荐面板（US3）

---

## Notes

- 所有任务已采用统一 checklist 格式：`- [ ] Txxx [P?] [US?] 描述 + 文件路径`
- `[P]` 仅用于可并行任务
- 用户故事任务均包含 `[USx]` 标签，便于追踪和分配
- 建议每完成一个 Checkpoint 即进行一次可演示验证
