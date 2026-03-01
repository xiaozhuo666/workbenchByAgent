# Implementation Plan: 日程与待办管理 + AI 辅助待办

**Branch**: `002-schedule-todo-management` | **Date**: 2026-03-01 | **Spec**: `specs/002-schedule-todo-management/spec.md`
**Input**: Feature specification from `/specs/002-schedule-todo-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

本功能旨在实现智能工作台的首页核心能力：日程与待办管理，并集成阿里云百炼（DashScope qwen-plus）提供 AI 辅助能力。技术路径采用 Node.js + Express 后端处理业务逻辑与 AI 转发，React + antd 前端构建模仿钉钉侧边栏的双栏布局，MySQL 存储业务数据。

## Technical Context

**Language/Version**: Node.js 20 LTS, JavaScript (ES6+), React 19
**Primary Dependencies**: Express, antd, Less, openai (DashScope), mysql2, jsonwebtoken, cors, dotenv
**Storage**: MySQL (Tables: `todos`, `schedules`, `ai_command_logs`)
**Testing**: Jest + Supertest (Backend), React Testing Library (Frontend)
**Target Platform**: Modern Web Browsers (Chrome, Edge, Safari)
**Project Type**: Web Application (Full-stack)
**Performance Goals**: AI Parsing < 3s, AI Execution Preview < 2s, Smooth rendering for 100+ items
**Constraints**: JWT Auth, No direct DB/AI Key exposure on frontend, Sidebar layout consistent with DingTalk
**Scale/Scope**: Personal workspace MVP, focus on Todo/Schedule + AI Command processing

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Backend & Frontend Tech Stack**: Node.js + React + HTTP API. **PASS**
- **Styles & UI Library**: Less + Ant Design. **PASS**
- **Charts & Visualization**: Charts (if any) will use ECharts. (None planned for this MVP). **PASS**
- **Data Persistence**: MySQL as the primary store. **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/002-schedule-todo-management/
├── plan.md              # This file
├── research.md          # AI integration & UI layout research
├── data-model.md        # Database schema for todos/schedules
├── quickstart.md        # Configuration & Verification steps
├── contracts/           # Todo, Schedule & AI OpenAPI specs
└── tasks.md             # Generated tasks
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── middleware/      # auth.js
│   ├── modules/
│   │   ├── todo/        # Controller, Service, Repository, Routes
│   │   ├── schedule/    # Controller, Service, Repository, Routes
│   │   └── ai/          # Controller, Service (DashScope wrapper)
│   └── app.js
├── scripts/
│   └── migrate.sql      # New table definitions
└── tests/

frontend/
├── src/
│   ├── components/      # Sidebar, AISidebar, TodoList, ScheduleList
│   ├── pages/
│   │   ├── AuthPage/    # Existing
│   │   └── HomePage/    # New Layout with Sidebar and Sub-pages
│   ├── router/          # AppRouter updates
│   └── services/        # todoStore, scheduleStore, aiStore
└── tests/
```

**Structure Decision**: 采用前后端分离的模块化结构。前端 `HomePage` 作为主容器，通过 `antd.Layout` 实现钉钉风格侧边栏，内部嵌套 `Todo`、`Schedule` 和占位的 `Session` 子页面。

## Complexity Tracking

> No violations found.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
