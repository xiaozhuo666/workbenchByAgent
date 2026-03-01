# Tasks: 日程与待办管理 + AI 辅助待办

**Input**: Design documents from `/specs/002-schedule-todo-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: This task list includes tests for both backend APIs and frontend components using Jest and React Testing Library.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create backend module directories for todo, schedule, and ai in `backend/src/modules/`
- [X] T002 [P] Create frontend directories for HomePage, Todo, and Schedule in `frontend/src/pages/` and `frontend/src/components/`
- [X] T003 [P] Configure `DASHSCOPE_API_KEY` in `backend/.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Add MySQL migration for `todos`, `schedules`, and `ai_command_logs` tables in `backend/scripts/migrate.sql`
- [X] T005 [P] Setup backend auth verification for new modules in `backend/src/middleware/auth.js`
- [X] T006 [P] Initialize `openai` client with DashScope config in `backend/src/modules/ai/ai.service.js`
- [X] T007 Implement base layouts for HomePage with DingTalk-style sidebar in `frontend/src/pages/HomePage/index.jsx`
- [X] T008 [P] Define shared CSS variables for the new UI theme in `frontend/src/pages/HomePage/index.css`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 基础日程与待办管理 (Priority: P1) 🎯 MVP

**Goal**: 用户可以在首页管理基本的待办和日程，数据持久化到 MySQL。

**Independent Test**: 用户能手动创建、标记完成并刷新页面看到正确状态。

### Tests for User Story 1 ⚠️

- [X] T009 [P] [US1] Integration tests for Todo CRUD in `backend/tests/integration/todo.test.js`
- [X] T010 [P] [US1] Integration tests for Schedule CRUD in `backend/tests/integration/schedule.test.js`
- [X] T011 [US1] Frontend unit tests for TodoList component in `frontend/src/components/TodoList/TodoList.test.jsx`

### Implementation for User Story 1

- [X] T012 [P] [US1] Implement Todo repository and service in `backend/src/modules/todo/`
- [X] T013 [P] [US1] Implement Schedule repository and service in `backend/src/modules/schedule/`
- [X] T014 [US1] Create Todo controller and routes in `backend/src/modules/todo/`
- [X] T015 [US1] Create Schedule controller and routes in `backend/src/modules/schedule/`
- [X] T016 [P] [US1] Implement `todoApi` and `scheduleApi` in `frontend/src/api/`
- [X] T017 [US1] Build TodoList component with antd in `frontend/src/components/TodoList/index.jsx`
- [X] T018 [US1] Build ScheduleList with Mini-Calendar view in `frontend/src/components/ScheduleList/index.jsx`
- [X] T019 [US1] Integrate Todo and Schedule views into `HomePage` router in `frontend/src/pages/HomePage/`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - AI 辅助待办草稿生成 (Priority: P2)

**Goal**: 通过自然语言输入生成待办草稿。

**Independent Test**: 输入文字，侧边栏显示解析出的任务数组。

### Tests for User Story 2 ⚠️

- [X] T020 [P] [US2] Contract test for `/ai/generate-todos` in `backend/tests/contract/ai.test.js`
- [X] T021 [US2] Mock AI response test for draft parsing in `frontend/src/services/aiStore.test.js`

### Implementation for User Story 2

- [X] T022 [US2] Implement AI service logic for todo parsing in `backend/src/modules/ai/ai.service.js`
- [X] T023 [US2] Create AI controller and routes for generation in `backend/src/modules/ai/`
- [X] T024 [US2] Build `AISidebar` component with chat interaction in `frontend/src/components/AISidebar/index.jsx`
- [X] T025 [US2] Implement draft preview and "Save to Todo" logic in `frontend/src/services/aiStore.js`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - AI 指令批量执行 (Priority: P2)

**Goal**: 通过指令批量更新任务状态。

**Independent Test**: 指令“完成所有测试任务”触发预览弹窗，确认后更新成功。

### Tests for User Story 3 ⚠️

- [X] T026 [P] [US3] Integration test for batch update via AI in `backend/tests/integration/ai.command.test.js`

### Implementation for User Story 3

- [X] T027 [US3] Implement AI command parsing for state updates in `backend/src/modules/ai/ai.service.js`
- [X] T028 [US3] Implement batch update logic in `backend/src/modules/todo/todo.service.js`
- [X] T029 [US3] Build confirmation modal for AI actions in `frontend/src/components/AIConfirmationModal/index.jsx`
- [X] T030 [US3] Integrate command execution flow in `frontend/src/components/AISidebar/index.jsx`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T031 [P] Update `quickstart.md` with final verification steps
- [X] T032 [P] Implement empty states and loading skeletons for lists in `frontend/src/components/Common/`
- [X] T033 Performance optimization for list rendering (memoization) in `frontend/src/pages/HomePage/`
- [X] T034 [P] Final end-to-end validation using `mvp-validation.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - Start after Phase 2
- **User Story 2 (P2)**: Depends on US1 (for "Save to Todo" persistence)
- **User Story 3 (P3)**: Depends on US1 (for data to update)

### Parallel Opportunities

- Phase 1 & 2 tasks marked [P] can run in parallel
- Once Phase 2 is complete, US1 can be developed while the AI logic (US2/US3) is prototyped in the backend
- All tests marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Backend Implementation
Task: "Implement Todo repository and service in backend/src/modules/todo/"
Task: "Implement Schedule repository and service in backend/src/modules/schedule/"

# Frontend UI
Task: "Build TodoList component with antd in frontend/src/components/TodoList/index.jsx"
Task: "Build ScheduleList with Mini-Calendar view in frontend/src/components/ScheduleList/index.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Verify manual Todo/Schedule management works
5. Move to AI features

---

## Notes

- Verify DashScope API connectivity early in Phase 2 (T006)
- Ensure all list views handle the `user_id` filter for security
- Use `antd.App` for easier message and notification handling
