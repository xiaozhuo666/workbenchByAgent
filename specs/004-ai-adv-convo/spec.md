# Feature Specification: AI 会话进阶能力 (Advanced AI Conversation)

**Feature Branch**: `004-ai-adv-convo`  
**Created**: 2026-03-02  
**Status**: Draft  
**Input**: 实现 AI 会话的进阶能力，包含模型切换、历史会话管理及内容导出。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 历史会话管理 (Priority: P1)

作为工作台用户，我希望能够保存和查看之前的 AI 对话记录，以便随时找回之前的讨论内容或在不同设备上继续对话。

**Why this priority**: 历史记录是 AI 会话工具的核心价值之一，确保用户不会丢失之前的交互数据。

**Independent Test**: 用户发送消息后刷新页面，侧边栏会出现该对话的标题，点击后能恢复完整的对话内容。

**Acceptance Scenarios**:

1. **Given** 用户已登录并打开会话模块，**When** 开启一个新会话并发送消息，**Then** 系统自动在侧边栏生成一个新的会话条目（带自动生成的标题）。
2. **Given** 侧边栏有多个历史会话，**When** 用户点击其中一个，**Then** 消息列表立即切换为该会话的所有消息。
3. **Given** 某个不再需要的会话，**When** 用户点击删除按钮并确认，**Then** 该会话从列表和数据库中移除。
4. **Given** 访客用户，**When** 使用会话功能，**Then** 对话记录仅在当前浏览器会话中临时保存，刷新或重新打开后消失。

---

### User Story 2 - AI 模型切换 (Priority: P2)

作为进阶用户，我希望能够根据任务的复杂度选择不同的 AI 模型（如高性能的 qwen-max 或快速的 qwen-turbo），以平衡回复质量和响应速度。

**Why this priority**: 提供灵活性，满足不同场景（简单问答 vs 复杂逻辑推理）的需求。

**Independent Test**: 在设置或会话界面切换模型为 `qwen-max`，后续的所有 AI 回复应显式标识或确认来自该模型。

**Acceptance Scenarios**:

1. **Given** 正在进行的会话，**When** 在下拉菜单中选择 `qwen-plus` 切换到 `qwen-max`，**Then** 下一条发送的消息将由 `qwen-max` 处理。
2. **Given** 会话过程中切换了模型，**When** 继续对话，**Then** 之前的对话上下文应当完整传递给新模型，确保对话连贯性。

---

### User Story 3 - 会话内容导出 (Priority: P2)

作为办公用户，我希望将 AI 生成的有用信息导出为本地文件，以便将其用于文档编写或通过其他方式分享。

**Why this priority**: 增强工具的生产力属性，方便用户将 AI 成果转化为持久文档。

**Independent Test**: 点击 AI 回复框下方的“导出”按钮，浏览器下载一个包含该回复内容的 `.md` 文件。

**Acceptance Scenarios**:

1. **Given** AI 已完成一条长回复，**When** 点击回复框中的“导出 Markdown”图标，**Then** 系统提示下载，文件名包含时间戳和内容摘要。
2. **Given** 导出的文件，**When** 使用 Markdown 编辑器打开，**Then** 内容格式（如标题、列表、代码块）应保持正确。

---

### Edge Cases

- **切换模型时的上下文**: 如果模型 A 和模型 B 的 Token 限制不同，切换时如何处理超长上下文？（假设由后端 SDK 自动处理或截断）。
- **网络中断**: 导出时若网络连接断开，应确保客户端有本地备份或能重试。
- **并发删除**: 当用户在两个标签页同时操作同一个会话时，删除操作的同步处理。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统必须在 MySQL 中新增 `ai_sessions` 表，存储会话元数据（ID, 用户ID, 标题, 选定模型, 创建时间）。
- **FR-002**: 系统必须在 MySQL 中新增 `ai_messages` 表，存储具体消息（ID, 会话ID, 角色[user/assistant], 内容, 时间戳）。
- **FR-003**: 系统必须在会话界面提供模型选择器（下拉列表），包含：`qwen-plus`, `qwen-max`, `qwen-turbo`。
- **FR-004**: 系统必须在侧边栏展示当前用户的历史会话列表，支持按时间排序。
- **FR-005**: 系统必须支持会话标题的自动生成（基于第一条消息内容）或手动编辑。
- **FR-006**: 系统必须在每个 AI 回复块提供“导出”按钮，点击后生成并下载 Markdown 文件。
- **FR-007**: 导出文件名格式建议为：`AI_Export_[TIMESTAMP]_[SUMMARY].md`。
- **FR-008**: 访客模式下的会话数据必须通过前端 `localStorage` 或后端临时 session 隔离，不写入正式的 MySQL 历史表。

### Key Entities *(include if feature involves data)*

- **AI Session (会话)**: 代表一组逻辑相关的对话。包含 `id`, `user_id`, `title`, `current_model`, `created_at`。
- **AI Message (消息)**: 会话中的单条发言。包含 `id`, `session_id`, `role` (user/assistant), `content`, `created_at`。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户刷新页面后恢复历史会话的成功率达到 100%。
- **SC-002**: 模型切换后的首条回复响应时间与直接在该模型下开启会话的响应时间一致。
- **SC-003**: 导出的 Markdown 文件在主流编辑器（如 VS Code, Typora）中渲染无误。
- **SC-004**: 会话列表加载时间在 100 条记录内小于 500ms。
