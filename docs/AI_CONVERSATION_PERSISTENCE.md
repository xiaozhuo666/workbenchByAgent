# AI 对话历史持久化存储

## 概述

本功能实现了 AI 对话历史的持久化存储，允许用户与 AI 助手进行长期对话，并随时查看或恢复之前的对话记录。

## 架构设计

### 数据库设计

#### ai_conversations 表

```sql
CREATE TABLE ai_conversations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  conversation_id VARCHAR(64) NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  content LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ai_conversations_user_id (user_id),
  KEY idx_ai_conversations_conversation_id (conversation_id),
  KEY idx_ai_conversations_created_at (created_at),
  CONSTRAINT fk_ai_conversations_user FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**字段说明：**
- `user_id`: 用户ID，用于数据隔离
- `conversation_id`: 对话ID（UUID），关联同一个对话的所有消息
- `role`: 消息角色（user/assistant）
- `content`: 消息内容，支持大文本
- `created_at`: 消息创建时间

**索引策略：**
- 用户ID索引：快速查询用户的所有对话
- 对话ID索引：快速查询单个对话的所有消息
- 时间索引：支持按时间排序和范围查询

## API 端点

### 1. 发送消息并保存对话

**请求：**
```http
POST /api/ai/chat
Content-Type: application/json

{
  "text": "如何高效管理时间？",
  "conversationId": "uuid-string", // 可选，首次为null，后续使用返回的ID
  "conversationHistory": [] // 会话历史，用于上下文
}
```

**响应：**
```json
{
  "code": "OK",
  "data": {
    "reply": "AI的回复内容...",
    "conversationId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### 2. 获取对话历史

**请求：**
```http
GET /api/ai/conversations/:conversationId?limit=20
Authorization: Bearer <token>
```

**响应：**
```json
{
  "code": "OK",
  "data": [
    {
      "role": "user",
      "content": "你好",
      "created_at": "2026-03-01T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "你好！有什么我可以帮你的吗？",
      "created_at": "2026-03-01T10:00:05Z"
    }
  ]
}
```

### 3. 列出所有对话

**请求：**
```http
GET /api/ai/conversations?limit=10&offset=0
Authorization: Bearer <token>
```

**响应：**
```json
{
  "code": "OK",
  "data": [
    {
      "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
      "last_message_at": "2026-03-01T10:05:00Z"
    },
    {
      "conversation_id": "550e8400-e29b-41d4-a716-446655440001",
      "last_message_at": "2026-03-01T09:30:00Z"
    }
  ]
}
```

### 4. 删除对话

**请求：**
```http
DELETE /api/ai/conversations/:conversationId
Authorization: Bearer <token>
```

**响应：**
```json
{
  "code": "OK",
  "data": {
    "message": "对话已删除"
  }
}
```

## 前端集成

### aiStore 服务

```javascript
// 发送消息（自动管理对话ID）
const result = await aiStore.chat(text, conversationId, conversationHistory);
// result = { reply: "...", conversationId: "uuid" }

// 获取对话历史
const history = await aiStore.getConversationHistory(conversationId, limit);

// 列出所有对话
const conversations = await aiStore.listConversations(limit, offset);

// 删除对话
await aiStore.deleteConversation(conversationId);
```

### AISidebar 组件

- 维护 `conversationId` 状态
- 每次自由对话自动创建或使用现有对话ID
- 提供"清除"按钮清空当前对话
- 保存的消息自动关联到对话ID

## 工作流程

### 新建对话流程

1. 用户输入问题
2. 前端未指定 `conversationId`（null）
3. 后端自动生成 UUID
4. 用户消息和AI回复都保存到数据库
5. 返回 `conversationId` 给前端
6. 前端保存 `conversationId` 以供后续使用

### 继续对话流程

1. 用户输入新问题
2. 前端发送已有的 `conversationId`
3. 新消息保存到同一对话
4. 对话历史自动包含之前的消息

### 加载历史流程

1. 用户点击历史对话
2. 前端调用 `getConversationHistory(conversationId)`
3. 加载所有历史消息
4. 填充消息列表和 `conversationId`
5. 用户可继续对话

## 性能优化

### 查询优化

- 分页查询：避免一次加载过多数据
- 时间范围查询：支持查询特定时间段的对话
- 复合索引：加快多条件查询

### 存储优化

- LONGTEXT：支持长消息内容
- 时间戳：自动记录消息时间
- 用户隔离：数据库级别的隐私保护

## 安全考虑

### 数据隔离

- 所有查询都基于 `user_id` 过滤
- 用户只能访问自己的对话记录
- 删除操作验证所有权

### 输入验证

- 对 `conversationId` 格式进行验证
- 对消息内容进行长度限制
- SQL注入防护（使用参数化查询）

## 使用场景

### 场景1：长期对话

用户可以在多个会话中继续与AI对话，保持上下文连贯性。

```javascript
// 第一天
const result1 = await aiStore.chat("什么是OKR？", null);
const cid = result1.conversationId;

// 第二天
const result2 = await aiStore.chat("OKR和KPI有什么区别？", cid);
// AI可以基于前一天的对话提供更好的回答
```

### 场景2：对话管理

用户可以管理多个不同主题的对话。

```javascript
// 工作相关对话
const workConversation = await aiStore.chat("如何管理项目？", null);

// 学习相关对话
const studyConversation = await aiStore.chat("如何学习新技能？", null);

// 列出所有对话
const all = await aiStore.listConversations();
```

### 场景3：对话恢复

用户可以查看和恢复之前的对话。

```javascript
// 列出最近的对话
const recent = await aiStore.listConversations(10, 0);

// 加载特定对话
const history = await aiStore.getConversationHistory(conversationId);

// 继续对话
const result = await aiStore.chat(newQuestion, conversationId);
```

## 未来扩展

1. **对话标签** - 为对话添加标签便于分类
2. **对话搜索** - 按内容搜索历史对话
3. **批量导出** - 支持导出对话记录
4. **自动摘要** - AI自动生成对话摘要
5. **分享对话** - 允许分享特定对话给其他用户

## 故障排查

### 问题：对话ID丢失

**症状：** 刷新页面后无法继续对话

**原因：** 前端未持久化 `conversationId`

**解决方案：**
```javascript
// 在 localStorage 或状态管理中保存 conversationId
localStorage.setItem('currentConversationId', conversationId);

// 页面加载时恢复
const savedId = localStorage.getItem('currentConversationId');
```

### 问题：对话未保存

**症状：** 消息未出现在数据库

**原因：** 后端保存失败，但前端未捕获错误

**解决方案：**
- 检查数据库连接
- 查看后端日志中的错误信息
- 验证 `user_id` 有效性

## 总结

这个功能提供了完整的对话历史持久化解决方案，具有以下优势：

✅ **用户体验** - 无缝的多会话对话
✅ **数据安全** - 用户级别的数据隔离
✅ **性能优化** - 高效的查询和索引
✅ **易于扩展** - 设计支持未来功能增加
✅ **隐私保护** - 用户可随时删除对话记录
