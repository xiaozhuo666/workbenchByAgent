# Research: 日程与待办管理 + AI 辅助待办

## Decisions

### 1. AI 接入方案 (DashScope OpenAI 兼容模式)
- **Decision**: 使用 `openai` 官方 SDK，配置 `baseURL` 为 DashScope 地址，使用 `DASHSCOPE_API_KEY` 进行认证。
- **Rationale**: 兼容 OpenAI 协议可以降低学习成本，方便后续切换模型。`qwen-plus` 提供了良好的自然语言解析能力。
- **Alternatives considered**: 
    - 使用阿里云原生 DashScope SDK: 功能更丰富但协议不通用。
    - 使用 LangChain: 过于厚重，当前场景直接调用 SDK 效率更高。

### 2. UI 布局方案 (模仿钉钉侧边栏)
- **Decision**: 使用 `antd` 的 `Layout.Sider` 组件实现侧边栏，菜单项包含图标与文字。首页加载时默认选中“会话中心”。
- **Rationale**: 钉钉风格侧边栏在 B 端办公场景中用户接受度高，交互稳定。
- **Alternatives considered**: 
    - 顶部导航栏: 空间利用率低，不方便扩展多个功能模块。

### 3. AI 待办解析与确认机制
- **Decision**: 采用“解析 -> 预览确认 -> 写入”的三步走逻辑。AI 返回 JSON 结构的草稿列表，前端展示在对话侧边栏，用户点击“保存”才持久化到数据库。
- **Rationale**: 保证 AI 解析结果的可控性，防止误读导致的数据污染。
- **Alternatives considered**: 
    - 直接入库: 风险较高，AI 可能会漏掉或错读时间信息。

### 4. 日程管理视图
- **Decision**: 采用“迷你日历 (Calendar) + 任务列表”的组合视图。
- **Rationale**: 用户反馈 C 选项（迷你日历 + 侧边列表）最符合今日概览的定位，方便快速切换日期。

## Best Practices

### AI 提示词工程 (Prompt Engineering)
- 系统提示词（System Role）应明确要求模型返回 JSON 数组格式，包含 `title`, `description`, `start_time` 等字段。
- 示例：`你是一个智能助理，请将用户输入的这段话转化为 JSON 数组格式的任务列表...`

### 数据安全与隔离
- 所有后端接口均需通过 `auth` 中间件验证 JWT。
- SQL 查询必须包含 `user_id = ?` 条件，严防越权。
