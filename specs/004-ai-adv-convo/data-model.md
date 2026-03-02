# Data Model: AI 会话进阶能力

## Entities

### `ai_conversations` (会话表)
存储用户发起的每一段独立对话的元数据。

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | `VARCHAR(36)` | UUID | PRIMARY KEY |
| `user_id` | `INT` | 用户 ID | FOREIGN KEY (users.id) |
| `title` | `VARCHAR(255)`| 对话标题（如：今天的天气）| NOT NULL |
| `model` | `VARCHAR(50)` | 使用的模型 (qwen-plus, etc.) | NOT NULL |
| `created_at` | `DATETIME`| 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | `DATETIME`| 最后更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE |

### `ai_messages` (消息表)
存储每个会话的具体对话历史。

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | `INT` | 消息 ID | PRIMARY KEY, AUTO_INCREMENT |
| `conversation_id` | `VARCHAR(36)` | 会话 ID | FOREIGN KEY (ai_conversations.id) |
| `role` | `ENUM` | 角色: 'user', 'assistant', 'system' | NOT NULL |
| `content` | `TEXT` | 消息原文 | NOT NULL |
| `created_at` | `DATETIME` | 发送时间 | DEFAULT CURRENT_TIMESTAMP |

## Relationships
- `users (1) -> (N) ai_conversations`
- `ai_conversations (1) -> (N) ai_messages`

## State Transitions
- **Create Session**: 发送第一条消息时自动创建 `ai_conversations` 条目。
- **Append Message**: 每次对话时向 `ai_messages` 插入。
- **Delete Session**: 级联删除 `ai_conversations` 及其对应的 `ai_messages`。
