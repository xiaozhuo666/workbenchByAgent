<!--
  Sync Impact Report
  Version change: (none) → 1.0.0
  Modified principles: N/A (initial creation)
  Added sections: Core Principles (4), 技术栈与约束, 开发与协作, Governance
  Removed sections: N/A
  Templates: plan-template.md ✅ (Constitution Check aligns); spec-template.md ✅; tasks-template.md ✅; commands ✅ no updates required
  Follow-up TODOs: None
-->

# 智能工作台 Constitution

## Core Principles

### I. 后端与前端技术栈

后端接口全部使用 Node.js 开发；前端使用 React 开发；前端通过 HTTP/API 调用后端接口。不得使用其他后端语言或前端框架实现本项目的核心接口与界面。

**理由**：统一技术栈便于全栈协作、部署与维护，并保证前后端契约清晰。

### II. 前端样式与组件库

前端组件全部使用 Less 编写样式，并使用 Ant Design (antd) 作为 UI 组件库。新页面与组件 MUST 使用 Less + antd，不得引入其他全局 UI 库替代 antd。

**理由**：Less + antd 保证视觉与交互一致性，并利于主题与响应式统一管理。

### III. 图表与可视化

所有图表类组件全部使用 ECharts 开发。数据可视化、统计图、仪表盘等 MUST 基于 ECharts 实现，不得使用其他图表库作为主要实现。

**理由**：统一使用 ECharts 便于能力复用、主题统一与性能调优。

### IV. 数据持久化

数据库使用 MySQL。业务数据的持久化、查询与事务 MUST 基于 MySQL 实现；不得将 MySQL 替换为其他关系型或 NoSQL 数据库作为主存储。

**理由**：单一主库降低运维与迁移复杂度，便于备份、恢复与一致性约束。

## 技术栈与约束

- **后端**：Node.js；推荐使用 Express/Koa 等常见框架，API 设计需符合 REST 或项目约定。
- **前端**：React；样式 Less，组件库 antd；图表 ECharts。
- **数据库**：MySQL；需有迁移/版本管理方案（如脚本或迁移工具）。
- **合规**：所有新功能与 PR 必须符合上述四条核心原则；例外须在宪章修订后生效。

## 开发与协作

- 需求与规格以 `docs/` 及 `specs/` 下文档为准；实现计划与任务须引用宪章原则做合规检查。
- 代码评审须验证是否符合本宪章（技术栈、数据库、图表与前端栈）；违反原则的变更不得合并。
- 复杂度与例外（如引入新库、新存储）须在计划或设计中说明理由，并优先考虑在宪章内通过修订纳入。
- 不能在新增功能的时候影响到其原有的功能，如果需要修改，必须询问用户是否需要修改。

## Governance

- 本宪章优先于项目内其他约定；与其冲突的实践须以宪章为准或通过修订宪章解决。
- **修订流程**：修改原则或新增条款须更新本文档、递增版本号、更新「Last Amended」日期，并在 Sync Impact Report 中记录变更；重大原则变更建议在文档或 PR 中说明理由与影响范围。
- **版本与合规**：版本号采用语义化（MAJOR.MINOR.PATCH）；MAJOR 表示不兼容的原则删除或重定义，MINOR 表示新增原则或章节，PATCH 表示措辞与澄清。所有 PR/评审须确认与宪章一致；合规检查点见 plan 模板中的「Constitution Check」。

**Version**: 1.0.0 | **Ratified**: 2025-03-01 | **Last Amended**: 2025-03-01
