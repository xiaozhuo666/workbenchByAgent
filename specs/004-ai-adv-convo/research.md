# Research: AI 会话进阶能力

## Decision: SSE (Server-Sent Events) for AI Streaming
- **Rationale**: 提升用户体验，实时查看 AI 生成过程。相比 WebSocket，SSE 在 HTTP 层面更轻量，且本项目已基于 HTTP 架构。
- **Alternatives considered**: 
    - WebSocket (过度设计)
    - 轮询 (性能差)

## Decision: 纯前端 Markdown 导出
- **Rationale**: 减少服务器负担和文件存储成本。对话内容已在前端展示，拼接字符串并生成 `Blob` 下载非常高效。
- **Alternatives considered**: 
    - 后端生成文件并下载 (增加了额外的网络传输和磁盘 I/O)

## Decision: 数据库表结构重构
- **Rationale**: 当前 `ai_conversations` 表实际上在存储 *消息*。为了支持多会话和元数据存储，必须拆分为 `ai_conversations` (存储会话概览) 和 `ai_messages` (存储具体对话记录)。
- **Migration Plan**: 需要将旧表数据迁移或清空（考虑到是开发初期，优先保证新结构设计）。

## Decision: 模型参数持久化
- **Rationale**: 用户在切换模型后，新开启的会话应默认沿用上一次的选择。存储在前端 `localStorage` 即可满足 P2 需求。
