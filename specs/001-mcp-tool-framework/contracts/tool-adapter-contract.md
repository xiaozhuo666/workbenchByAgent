# Tool Adapter Internal Contract

## 1. 目标

定义 MCP Tool Adapter 在后端内部的统一接口契约，确保后续接入 12306、麦当劳等工具时无需改动聊天对外 API。

## 2. Registry Contract

### registerTool(definition)
- **输入**: `ToolDefinition`
- **输出**: `void`
- **约束**:
  - `toolName` 唯一
  - 非 `read` 能力默认拒绝上线

### getTool(toolName)
- **输入**: `toolName: string`
- **输出**: `ToolDefinition | null`

### isAllowed(toolName)
- **输入**: `toolName: string`
- **输出**: `boolean`
- **约束**: 必须同时满足“已注册 + 已启用 + 白名单命中 + 只读能力”

## 3. Executor Contract

### execute(context)
- **输入**:
  - `conversationId: string`
  - `toolName: string`
  - `args: object`
  - `roundIndex: number`
  - `timeoutMs: number`
  - `maxRetries: number`
- **输出**:
  - `status: success | failed | timeout | rejected`
  - `result: object | null`
  - `error: { code: string, message: string } | null`
  - `durationMs: number`
- **约束**:
  - 不抛出未捕获异常到编排层
  - 所有失败都返回结构化错误对象

## 4. Orchestrator Contract

### runChatLoop(input)
- **输入**:
  - `userText: string`
  - `conversationHistory: Message[]`
  - `model: string`
  - `maxRounds: number`
- **输出**:
  - `finalReply: string`
  - `finalResponseType: tool_enhanced | model_only`
  - `fallbackTriggered: boolean`
  - `trace: ConversationToolTrace`
- **约束**:
  - 达到最大轮次必须终止
  - 任一步骤失败必须触发降级路径
  - 不改变 controller 对外响应结构

## 5. Logging Contract

### logToolExecution(record)
- **输入**: `ToolExecutionRecord`
- **输出**: `void`
- **约束**:
  - 日志失败不得阻塞主流程
  - 参数记录仅保留摘要，避免敏感信息泄露

## 6. Compatibility Rules

- 对外接口 `/api/ai/chat` 的请求参数与成功响应结构保持兼容。
- 流式与非流式路径均可使用相同降级策略。
- MCP 开关关闭时，系统行为必须与历史版本一致。

## 7. MCP Toggle Contract（管理开关）

### listToolToggles()
- **输入**: 无（鉴权上下文中读取用户身份）
- **输出**: `[{ toolName, displayName, enabled, riskLevel }]`
- **约束**:
  - 仅管理员角色可访问
  - 返回值包含全部已注册工具

### updateToolToggle(input)
- **输入**:
  - `toolName: string`
  - `enabled: boolean`
  - `reason?: string`
- **输出**:
  - `toolName: string`
  - `enabled: boolean`
  - `updatedAt: string`
- **约束**:
  - 非管理员请求必须拒绝
  - 工具不存在时必须返回可识别错误
  - 更新成功后在一个配置刷新周期内生效
