# Quickstart: AI 会话进阶能力

## Prerequisites
- Node.js 20+
- MySQL 8.x
- DashScope API Key (in `backend/.env`)

## Database Setup
1. 执行迁移脚本（即将生成）创建 `ai_conversations` 和 `ai_messages` 表。
2. 备份现有的 `ai_conversations` 表（由于其结构变更）。

## Running the Application
1. **Backend**: `cd backend && npm install && npm run dev`
2. **Frontend**: `cd frontend && npm install && npm run start`

## Testing the Flow
1. 登录工作台。
2. 打开 AI 会话模块。
3. 选择 `qwen-max` 模型。
4. 发送第一条消息，确认侧边栏出现了新会话标题。
5. 在回复中点击“导出为 Markdown”并确认浏览器触发下载。
6. 切换历史会话，确认消息列表正确恢复。

## Configuration
- `DASHSCOPE_API_KEY`: 阿里云百炼 API 密钥。
- `JWT_SECRET`: 登录令牌密钥。
