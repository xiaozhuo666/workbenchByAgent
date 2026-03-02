# Implementation Plan: AI 会话进阶能力 (Advanced AI Conversation)

**Branch**: `004-ai-adv-convo` | **Date**: 2026-03-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/004-ai-adv-convo/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

本功能旨在提升智能工作台的 AI 会话体验，通过引入模型切换（qwen-max, qwen-plus, qwen-turbo）、基于 MySQL 的历史会话管理以及对话内容的 Markdown 导出。技术上将采用 SSE (Server-Sent Events) 优化回复感知，并在数据库层实现会话与消息的分离存储。

## Technical Context

**Language/Version**: Node.js 20 LTS, JavaScript (ES6+), React 19
**Primary Dependencies**: Express, antd, Less, openai (DashScope SDK), mysql2, jsonwebtoken, cors, dotenv
**Storage**: MySQL (Tables: `ai_conversations`, `ai_messages`)
**Testing**: npm test
**Target Platform**: Web (Chrome, Edge, Firefox)
**Project Type**: Web Application (Monorepo-style: backend/ & frontend/)
**Performance Goals**: AI 响应感知时间 < 2s (通过 SSE), 历史记录加载 < 500ms
**Constraints**: 必须符合 Constitution 原则（Node.js, React, Less, antd, MySQL）
**Scale/Scope**: 支持单用户多会话，每个会话消息上限 100+

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **后端与前端技术栈**: 后端 Node.js + 前端 React。 (符合原则 I)
- **前端样式与组件库**: 使用 Less + antd。 (符合原则 II)
- **图表与可视化**: 本功能暂不涉及图表，若后续涉及将使用 ECharts。 (符合原则 III)
- **数据持久化**: 使用 MySQL。 (符合原则 IV)

## Project Structure

### Documentation (this feature)

```text
specs/004-ai-adv-convo/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── ai-api.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── db/              # Database connection
│   └── modules/
│       └── ai/          # AI module (Routes, Controller, Service, Repository)
│           ├── ai.routes.js
│           ├── ai.controller.js
│           ├── ai.service.js
│           └── ai.repository.js
└── tests/

frontend/
├── src/
│   ├── components/      # UI components (ModelSelector, Sidebar)
│   ├── pages/           # Chat page
│   └── services/        # API services (aiService.js)
└── tests/
```

**Structure Decision**: 采用 Web Application 结构（backend + frontend），复用现有的模块化设计。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

