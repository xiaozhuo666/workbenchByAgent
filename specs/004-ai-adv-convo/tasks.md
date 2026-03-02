# Tasks: AI 会话进阶能力 (004-ai-adv-convo)

**Input**: Design documents from `specs/004-ai-adv-convo/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the specification, implementation will focus on functional delivery.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 验证后端环境变量 `DASHSCOPE_API_KEY` 已在 `backend/.env` 中正确配置
- [ ] T002 [P] 验证前端 API 基础路径配置是否支持新的 AI 接口调用

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 创建数据库迁移脚本以定义 `ai_conversations` 和 `ai_messages` 表 `backend/src/db/migrations/004-ai-adv-convo.sql`
- [ ] T004 执行迁移脚本更新 MySQL 数据库结构
- [ ] T005 [P] 更新 AI 存储库实现基础的增删改查方法（适配新表结构） `backend/src/modules/ai/ai.repository.js`
- [ ] T006 [P] 扩展 AI 服务类以支持模型参数传递及消息持久化逻辑 `backend/src/modules/ai/ai.service.js`
- [ ] T007 更新 AI 控制器以处理会话管理相关的 REST 请求 `backend/src/modules/ai/ai.controller.js`
- [ ] T008 [P] 注册新的 AI 路由接口（列表、详情、删除） `backend/src/modules/ai/ai.routes.js`

**Checkpoint**: Foundation ready - backend structure supports multi-session and message persistence.

---

## Phase 3: User Story 1 - 历史会话管理 (Priority: P1) 🎯 MVP

**Goal**: 用户可以查看、切换和删除之前的 AI 对话记录。

**Independent Test**: 发送消息后刷新页面，侧边栏应显示该会话，点击后能恢复完整对话历史。

### Implementation for User Story 1

- [ ] T009 [US1] 实现后端获取会话列表接口 `GET /api/ai/conversations` 在 `backend/src/modules/ai/ai.controller.js`
- [ ] T010 [US1] 实现后端获取会话消息详情接口 `GET /api/ai/conversations/:id` 在 `backend/src/modules/ai/ai.controller.js`
- [ ] T011 [US1] 实现后端删除会话接口 `DELETE /api/ai/conversations/:id` 在 `backend/src/modules/ai/ai.controller.js`
- [ ] T012 [P] [US1] 在前端 API 层增加会话管理相关方法 `frontend/src/services/aiService.js`
- [ ] T013 [US1] 开发前端侧边栏会话列表组件（支持选中态和删除操作） `frontend/src/components/AI/ConversationList.jsx`
- [ ] T014 [US1] 在会话主页面集成侧边栏，实现切换会话时自动加载历史消息 `frontend/src/pages/Chat/index.jsx`
- [ ] T015 [US1] 实现后端自动生成会话标题的逻辑（基于首条消息） `backend/src/modules/ai/ai.service.js`

**Checkpoint**: User Story 1 is fully functional. Users can persist and manage multiple AI conversations.

---

## Phase 4: User Story 2 - AI 模型切换 (Priority: P2)

**Goal**: 用户可以手动选择不同的阿里云百炼模型进行对话。

**Independent Test**: 在界面选择 `qwen-max` 后，发送消息得到的回复应记录在数据库中且由该模型生成。

### Implementation for User Story 2

- [ ] T016 [US2] 更新后端 `chat` 接口以接收 `model` 参数并保存到会话记录 `backend/src/modules/ai/ai.controller.js`
- [ ] T017 [P] [US2] 开发前端模型选择器组件（下拉菜单） `frontend/src/components/AI/ModelSelector.jsx`
- [ ] T018 [US2] 在会话页面集成模型选择器，并将用户偏好持久化至 `localStorage` `frontend/src/pages/Chat/index.jsx`
- [ ] T019 [US2] 确保发送消息时从状态或持久化存储中读取当前 `model` 并传递给后端 `frontend/src/pages/Chat/index.jsx`

**Checkpoint**: User Story 2 is complete. Users have control over which model processes their requests.

---

## Phase 5: User Story 3 - 会话内容导出 (Priority: P2)

**Goal**: 用户可以将 AI 的回复内容导出为 Markdown 文件。

**Independent Test**: 点击回复框下的“导出”按钮，浏览器应弹出下载提示并保存 `.md` 文件。

### Implementation for User Story 3

- [ ] T020 [US3] 在 AI 回复的消息气泡组件中增加“导出 Markdown”图标按钮 `frontend/src/components/AI/MessageItem.jsx`
- [ ] T021 [US3] 实现通用的 Markdown 导出工具函数（Blob 处理） `frontend/src/utils/exportUtils.js`

**Checkpoint**: User Story 3 is complete. Productivity feature for content export is ready.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T022 [P] 为侧边栏列表增加加载状态（Skeleton 屏或 Loading 动画） `frontend/src/components/AI/ConversationList.jsx`
- [ ] T023 优化 SSE 流式显示逻辑，确保历史消息加载与实时回复不冲突 `frontend/src/pages/Chat/index.jsx`
- [ ] T024 [P] 更新 `README.md` 或项目内文档，说明新功能的使用及配置
- [ ] T025 运行 `specs/004-ai-adv-convo/quickstart.md` 验证所有验收场景

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup. **BLOCKS** all user stories because it modifies DB schema.
- **User Stories (Phase 3-5)**: All depend on Foundational completion.
    - US1 (P1) is the MVP and should be prioritized.
    - US2 and US3 are independent of each other but both depend on US1's basic chat structure.
- **Polish (Phase 6)**: Final stage.

### Parallel Opportunities

- T005 (Repository) and T006 (Service) can be worked on in parallel once DB schema is finalized.
- T012 (API service) can start as soon as backend interfaces are defined.
- T017 (Model Selector UI) can be developed independently.
- T021 (Export Util) is a pure utility and can be written anytime.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1 & 2 (环境与数据库基础)。
2. 集中精力实现 Phase 3 (历史会话管理)。
3. **验证**: 确保对话可以保存、列出、恢复和删除。

### Incremental Delivery

1. 完成 US1 后，交付具备“记忆”能力的智能助手。
2. 依次添加 US2 (模型切换) 和 US3 (内容导出) 提升进阶体验。
