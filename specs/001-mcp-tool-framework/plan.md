# Implementation Plan: MCP Tool Adapter 基础落地（含最小开关页）

**Branch**: `001-mcp-tool-framework` | **Date**: 2026-03-04 | **Spec**: `specs/001-mcp-tool-framework/spec.md`  
**Input**: Feature specification from `specs/001-mcp-tool-framework/spec.md`

## Summary

在不影响现有登录、待办、日程与 AI 对话核心功能的前提下，完成 MCP Tool Adapter 基础框架落地，并纳入一个最小化管理页面用于手动启停不同 MCP。方案分 Phase A/B/C：A 完成注册中心/执行器/调用循环；B 完成日志观测、超时重试、白名单与只读约束；C 完成最小开关页、灰度发布、回归测试与回滚演练。对外聊天接口保持兼容，工具失败自动降级。

## Technical Context

**Language/Version**: Node.js 20 LTS、JavaScript (CommonJS)、React 19  
**Primary Dependencies**: Express 5、openai (DashScope)、mysql2、jsonwebtoken、dotenv、antd、less  
**Storage**: MySQL 8.x（会话消息 + 工具调用日志 + 工具开关状态）  
**Testing**: Jest + Supertest（后端）；React Testing Library（前端关键页面）  
**Target Platform**: Linux Docker 部署（本地开发 Windows）  
**Project Type**: Web application (`backend` + `frontend`)  
**Performance Goals**: MCP 场景主聊天请求成功率 >= 95%，工具开关操作 3 秒内生效  
**Constraints**: 不破坏现有 API 行为；不改前端核心交互；只允许查询类工具；失败必须降级；支持灰度开关  
**Scale/Scope**: 首期 1~2 个只读工具 + 最小开关页（列表 + 开关按钮）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Gate

- **原则 I 后端与前端技术栈**: PASS  
  - 保持 Node.js 后端 + React 前端。
- **原则 II 前端样式与组件库**: PASS  
  - 新增开关页采用 Less + antd。
- **原则 III 图表与可视化**: PASS  
  - 本期无图表需求。
- **原则 IV 数据持久化**: PASS  
  - 继续使用 MySQL 承载开关状态与日志数据。
- **协作约束（不影响原有功能）**: PASS  
  - 通过灰度开关和回归测试保护旧能力。

### Post-Phase 1 Re-check

- `research.md`、`data-model.md`、`contracts/*`、`quickstart.md` 均与宪章一致。  
- 最小开关页不替换核心前端流程，仅新增运维入口。  
- 结论：**PASS**。

## Project Structure

### Documentation (this feature)

```text
specs/001-mcp-tool-framework/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── chat-mcp-contract.yaml
│   ├── tool-adapter-contract.md
│   └── mcp-toggle-contract.yaml
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── app.js
│   ├── config/
│   ├── modules/
│   │   └── ai/
│   │       ├── ai.routes.js
│   │       ├── ai.controller.js
│   │       ├── ai.service.js
│   │       ├── ai.repository.js
│   │       └── mcp/
│   └── db/migrations/
└── tests/

frontend/
├── src/
│   ├── pages/
│   ├── components/
│   ├── router/
│   ├── services/
│   └── api/
└── tests/
```

**Structure Decision**: 基于现有前后端目录做增量扩展。后端新增 `mcp` 子模块与管理接口；前端新增最小开关页与轻量路由入口，不修改现有首页核心交互。

## Phase Plan (A/B/C)

### Phase A：工具注册中心 + 执行器 + 调用循环

#### A1. 工具注册中心
- **目标与产出物**: 建立可扩展 Registry，支持注册、查询、启停状态读取、白名单校验。
- **涉及文件/模块**: `backend/src/modules/ai/mcp/toolRegistry.js`、`backend/src/config/mcp.js`
- **风险点与规避措施**: 配置错误导致工具误启；采用默认关闭+显式白名单。
- **完成定义（DoD）**:
  - 可按工具名获取元数据与启停状态；
  - 非白名单工具无法进入执行器；
  - 不影响旧聊天路径。
- **验证方式**: Registry 单元测试 + chat 集成兼容测试。

#### A2. 工具执行器
- **目标与产出物**: 统一入参校验、执行、结果封装、错误标准化。
- **涉及文件/模块**: `backend/src/modules/ai/mcp/toolExecutor.js`、`backend/src/modules/ai/mcp/adapters/*`
- **风险点与规避措施**: 适配器输出不一致；采用统一 envelope。
- **完成定义（DoD）**:
  - 成功/失败返回结构一致；
  - 不抛出未捕获异常到 controller。
- **验证方式**: 执行器单元测试（成功/参数错/异常）。

#### A3. 聊天工具循环
- **目标与产出物**: 完成“模型决策 -> 工具调用 -> 回灌 -> 回复”循环。
- **涉及文件/模块**: `backend/src/modules/ai/ai.service.js`、`backend/src/modules/ai/mcp/chatOrchestrator.js`
- **风险点与规避措施**: 死循环与长尾响应；设置最大轮次与每轮预算。
- **完成定义（DoD）**:
  - 工具场景可收敛；
  - 无工具场景保持现有行为；
  - 达上限可安全退出。
- **验证方式**: 集成测试（成功收敛/无工具/轮次上限）。

### Phase B：日志与观测、超时重试、白名单校验

#### B1. 日志与观测
- **目标与产出物**: 记录工具调用明细与会话级汇总。
- **涉及文件/模块**: `backend/src/modules/ai/ai.repository.js`、`backend/src/db/migrations/005-mcp-tool-logs.sql`
- **风险点与规避措施**: 日志写入拖慢主链路；失败不阻断主流程。
- **完成定义（DoD）**:
  - 关键字段完整；
  - 失败可追踪至会话。
- **验证方式**: 成功/失败两类调用日志验证。

#### B2. 超时重试与降级
- **目标与产出物**: 超时、重试、统一降级分支。
- **涉及文件/模块**: `backend/src/modules/ai/mcp/toolExecutor.js`、`backend/src/modules/ai/mcp/chatOrchestrator.js`
- **风险点与规避措施**: 重试放大延迟；仅对可重试错误重试。
- **完成定义（DoD）**:
  - 超时和重试可配置；
  - 超限自动降级纯模型回答。
- **验证方式**: 超时/异常注入测试。

#### B3. 白名单与只读约束
- **目标与产出物**: 保证仅执行白名单且 capability=read 的工具。
- **涉及文件/模块**: `backend/src/modules/ai/mcp/whitelist.js`、`backend/src/modules/ai/mcp/toolRegistry.js`
- **风险点与规避措施**: 漏拦截高风险操作；启动阶段做配置校验。
- **完成定义（DoD）**:
  - 写操作工具被拒绝；
  - 拒绝事件被记录。
- **验证方式**: 安全分支集成测试。

### Phase C：最小开关页、灰度发布、回归测试、上线回滚

#### C1. 最小 MCP 开关页
- **目标与产出物**: 新增管理页面，展示工具列表并支持手动开关。
- **涉及文件/模块**: `frontend/src/pages/McpTogglePage/`、`frontend/src/router/index.jsx`、`frontend/src/api/mcpApi.js`
- **风险点与规避措施**: 影响现有导航；采用新增入口且默认不干扰主页面。
- **完成定义（DoD）**:
  - 可查看工具状态；
  - 可手动切换单个工具启停；
  - 切换后 3 秒内生效。
- **验证方式**: 前端页面测试 + 后端接口联调验证。

#### C2. 开关管理接口与灰度策略
- **目标与产出物**: 提供后端工具状态查询与更新接口，接入环境总开关。
- **涉及文件/模块**: `backend/src/modules/ai/ai.routes.js`、`backend/src/modules/ai/ai.controller.js`、`backend/src/modules/ai/ai.repository.js`
- **风险点与规避措施**: 未授权修改开关；接口复用现有鉴权并限制管理员角色。
- **完成定义（DoD）**:
  - `GET` 可返回工具状态列表；
  - `PATCH` 可更新指定工具启停；
  - `MCP_ENABLED=false` 时全局强制关闭。
- **验证方式**: API 鉴权/权限/数据一致性测试。

#### C3. 回归上线与回滚
- **目标与产出物**: 回归验证、监控阈值、回滚步骤。
- **涉及文件/模块**: `docker-compose.yml`、`.env.docker.example`、`specs/001-mcp-tool-framework/quickstart.md`
- **风险点与规避措施**: 线上异常扩散；通过开关快速回滚。
- **完成定义（DoD）**:
  - 核心回归通过；
  - 告警指标可观测；
  - 5 分钟内可回滚到纯模型路径。
- **验证方式**: 灰度演练 + 故障注入 + 回滚复测。

## Test Plan

### 单元测试
- Registry：注册、查询、启停、白名单判定。
- Executor：超时、重试、异常封装。
- Orchestrator：轮次控制、降级触发。
- 前端开关页：渲染、状态回填、切换交互。

### 集成测试
- `/api/ai/chat` 兼容性（开关关/开）。
- 工具成功链路、超时链路、异常链路。
- `GET/PATCH` MCP 开关接口与权限控制。

### 回归测试
- 登录鉴权、待办、日程、AI 对话（流式/非流式）。
- 新增开关页不影响原首页核心交互。

### 关键验收场景
1. 工具成功。  
2. 工具超时。  
3. 工具异常。  
4. 自动降级成功。  
5. 页面开关关闭后工具立即失效。  
6. 页面开关开启后工具恢复可调用。

## Deployment Plan (Docker)

### 环境变量清单
- `MCP_ENABLED`（默认 false）
- `MCP_TOOL_WHITELIST`
- `MCP_MAX_CALL_ROUNDS`
- `MCP_TOOL_TIMEOUT_MS`
- `MCP_TOOL_MAX_RETRIES`
- `MCP_RETRY_BACKOFF_MS`
- `MCP_TOGGLE_CACHE_TTL_MS`（可选）
- 既有 `DASHSCOPE_API_KEY`、`JWT_SECRET`、`DB_*`、`CORS_ORIGIN`

### 灰度开关策略
1. 默认总开关关闭发布。  
2. 预发启用并验证关键场景。  
3. 生产小流量启用。  
4. 指标稳定后扩大范围。  
5. 异常即关闭总开关或逐工具关闭。

### 监控与告警指标
- 工具调用成功率
- 工具调用失败率
- 工具平均耗时
- 降级触发率
- 开关操作成功率
- 主聊天接口错误率与 p95

## Complexity Tracking

当前无宪章违规项，无需豁免。
