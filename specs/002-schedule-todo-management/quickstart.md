# Quickstart: 日程与待办管理 + AI 辅助待办

## 1. 环境准备
1. 安装后端依赖：`cd backend && npm install`
2. 配置环境变量：确保 `backend/.env` 包含以下新增项：
```env
# DashScope (OpenAI Compatible)
DASHSCOPE_API_KEY=your_api_key_here
```

## 2. 数据库迁移
执行 `backend/scripts/migrate.sql` 中的 DDL 语句，创建 `todos`, `schedules`, `ai_command_logs` 表。

## 3. 运行项目
1. 启动后端：`cd backend && npm run start`
2. 启动前端：`cd frontend && npm run start`
3. 访问 `http://localhost:3000/auth?mode=login` 登录。

## 4. 关键功能验证路径

### 待办事项 (US1)
1. 点击侧边栏“待办事项”。
2. 输入标题点击“添加”，验证列表即时更新。
3. 勾选任务，验证状态持久化。

### 日程管理 (US1)
1. 点击侧边栏“日程管理”。
2. 在左侧迷你日历选择日期。
3. 点击“新建日程”，填写时间后保存，验证列表展示。

### AI 辅助 (US2 & US3)
1. 点击侧边栏“AI 助手”图标（魔法棒样式）。
2. 输入：“帮我安排明天下午两点开会，三点写文档”。
3. 在对话框中点击“保存到待办”，验证任务已进入列表。
4. 输入：“把刚才的会议任务标记完成”，验证预览弹窗并确认执行。

## 5. 错误处理验证
- 断开网络或关闭后端，输入 AI 指令，验证提示“AI 助手开小差了”。
- 故意输入无法解析的乱码，验证 AI 返回“无法理解您的指令”。
