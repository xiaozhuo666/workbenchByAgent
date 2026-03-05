# Implementation Plan: AI 票务工作台接力体验

**Branch**: `001-ai-ticket-workbench` | **Date**: 2026-03-05 | **Spec**: `specs/001-ai-ticket-workbench/spec.md`  
**Input**: Feature specification from `specs/001-ai-ticket-workbench/spec.md`

## Summary

本特性通过“AI 行程卡 + 票务工作台”双轨模式，打通聊天到票务页的任务接力流程。核心实现是引入可复用的行程草稿对象，用户在聊天中触发查票意图后，进入票务页自动填充并自动查询；在结果层增加直达/中转视图及 AI 三方案推荐（最快/最便宜/最舒适），并保证草稿失效、上游异常时可恢复且不阻断基础查票能力。

## Technical Context

**Language/Version**: Node.js 20 LTS、JavaScript (CommonJS)、React 19  
**Primary Dependencies**: Express 5、mysql2、jsonwebtoken、openai(DashScope)、antd、less、react-router-dom  
**Storage**: MySQL 8.x（新增行程草稿与票务查询日志）  
**Testing**: Jest + Supertest（后端）；React Testing Library（前端页面与交互）  
**Target Platform**: Linux Docker 部署（本地开发 Windows）  
**Project Type**: Web application（`backend` + `frontend`）  
**Performance Goals**: 票务页首屏自动查询成功率 >= 95%；用户进入页面后 3 秒内得到首批结果或明确降级提示  
**Constraints**: 不影响现有聊天与首页功能；保持现有鉴权机制；MVP 不支持自动写操作；失败必须可恢复  
**Scale/Scope**: 首期覆盖单程查票流程、直达和中转优选展示、三类推荐卡解释

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Gate

- **原则 I 后端与前端技术栈**: PASS  
  - 继续采用 Node.js 后端 + React 前端。
- **原则 II 前端样式与组件库**: PASS  
  - 票务工作台与新增组件使用 Less + antd。
- **原则 III 图表与可视化**: PASS  
  - 本特性不引入图表模块，无违反项。
- **原则 IV 数据持久化**: PASS  
  - 行程草稿与相关业务数据均落 MySQL。
- **协作约束（不影响原有功能）**: PASS  
  - 采用新增路由与增量接口，不替换现有核心流程。

### Post-Phase 1 Re-check

- `research.md` 中技术决策均在宪章允许范围内。  
- `data-model.md`、`contracts/*`、`quickstart.md` 均未引入新前端框架、新数据库或替代组件库。  
- 结论：**PASS**。

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-ticket-workbench/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ticket-workbench-api.yaml
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── app.js
│   ├── db/migrations/
│   ├── modules/
│   │   └── ai/
│   │       ├── ai.routes.js
│   │       ├── ai.controller.js
│   │       ├── ai.service.js
│   │       ├── ai.repository.js
│   │       └── mcp/
│   └── middleware/
└── tests/

frontend/
├── src/
│   ├── pages/
│   │   ├── HomePage/
│   │   └── TicketsPage/            # 新增
│   ├── components/
│   │   └── AI/TripDraftCard/       # 新增
│   ├── api/
│   │   └── ticketApi.js            # 新增
│   └── router/
└── tests/
```

**Structure Decision**: 采用现有前后端目录做增量扩展。后端在 `ai` 模块内新增票务草稿与查询接口；前端新增 `TicketsPage` 与行程卡组件，通过路由接入，不改动现有页面基础职责。

## Phase 0：Outline & Research

### 研究任务与结论

1. 任务接力参数传递模式（`draftId` vs 长 query）  
   - 结论：使用唯一 `draftId` 接力，页面按 ID 拉取草稿详情。  
2. 草稿生命周期策略（有效期、失效恢复）  
   - 结论：默认有效期 + 过期提示 + 一键重查，避免静默失败。  
3. 推荐结果与筛选联动策略  
   - 结论：推荐卡必须映射可见筛选条件，确保“可解释且可执行”。  
4. 票务查询异常降级策略  
   - 结论：查询与推荐分层降级，推荐失败不阻断基础结果浏览。

> 详细调研见 `research.md`。当前无未解决的 NEEDS CLARIFICATION。

## Phase 1：Design & Contracts

### 1) 数据模型设计

- 输出：`data-model.md`
- 覆盖实体：行程草稿、票务查询条件、车次结果、AI 推荐方案、查询会话日志。

### 2) 接口契约定义

- 输出：`contracts/ticket-workbench-api.yaml`
- 覆盖接口：
  - 创建行程草稿
  - 获取行程草稿
  - 基于草稿查询票务
  - 生成 AI 三方案推荐

### 3) 联调与演示入口

- 输出：`quickstart.md`
- 包含：最小验证路径、异常路径验证、回归检查点。

### 4) Agent 上下文更新

- 执行脚本：`.specify/scripts/powershell/update-agent-context.ps1 -AgentType cursor-agent`
- 目的：同步本特性技术上下文，便于后续 `/speckit.tasks` 生成任务清单。

## Phase 2：Planning Stop

`/speckit.plan` 在本阶段停止，后续由 `/speckit.tasks` 进行任务拆解与排期。

## Complexity Tracking

当前无宪章违规项，无需豁免。
