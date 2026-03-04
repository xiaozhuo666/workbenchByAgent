# Data Model - MCP Tool Adapter

## 1. ToolDefinition

**说明**: 系统内可调用工具的注册定义，用于白名单与路由决策。  

### 字段
- `toolName` (string, unique): 工具唯一标识。
- `displayName` (string): 工具展示名。
- `description` (string): 工具能力说明。
- `enabled` (boolean): 是否启用。
- `capabilityType` (enum: `read` | `write`): 能力类型，本期仅允许 `read`。
- `riskLevel` (enum: `low` | `medium` | `high`): 风险等级。
- `timeoutMs` (number): 工具级超时配置。
- `maxRetries` (number): 工具级重试上限。

### 校验规则
- `toolName` 必填且唯一。
- `capabilityType=write` 的工具在本期必须被拒绝执行。
- `enabled=false` 的工具不得进入执行器。

## 2. ToolExecutionRecord

**说明**: 单次工具调用明细，用于审计、故障定位与性能分析。  

### 字段
- `id` (string/number): 调用记录主键。
- `conversationId` (string): 会话标识。
- `messageId` (string, optional): 本轮关联消息标识。
- `roundIndex` (number): 循环轮次。
- `toolName` (string): 被调用工具名。
- `argsSummary` (string/json): 参数摘要（脱敏、截断）。
- `status` (enum: `success` | `failed` | `timeout` | `rejected`): 调用状态。
- `errorCode` (string, optional): 错误码。
- `errorMessage` (string, optional): 错误摘要。
- `startedAt` (datetime): 开始时间。
- `finishedAt` (datetime): 结束时间。
- `durationMs` (number): 耗时。

### 校验规则
- `conversationId`、`toolName`、`status`、`durationMs` 必填。
- `status in (failed, timeout, rejected)` 时必须有错误摘要。
- 记录失败不得影响主聊天响应。

## 3. ConversationToolTrace

**说明**: 会话级工具调用汇总，用于灰度指标和回归比较。  

### 字段
- `conversationId` (string): 会话标识。
- `totalCalls` (number): 总调用次数。
- `successCalls` (number): 成功调用次数。
- `failedCalls` (number): 失败调用次数。
- `fallbackTriggered` (boolean): 是否触发降级。
- `finalResponseType` (enum: `tool_enhanced` | `model_only`): 最终回复类型。

### 状态迁移
1. 会话开始：`totalCalls=0`，`fallbackTriggered=false`。
2. 每轮调用：按状态累加 `successCalls/failedCalls`。
3. 任一失败导致降级时：`fallbackTriggered=true`，最终类型为 `model_only`。
4. 正常完成且工具有效：最终类型为 `tool_enhanced`。

## 4. ConfigSnapshot（运行时配置快照）

**说明**: 每次请求执行时使用的关键策略快照，用于复盘。  

### 字段
- `mcpEnabled` (boolean)
- `maxRounds` (number)
- `toolTimeoutMs` (number)
- `maxRetries` (number)
- `whitelistVersion` (string)

### 校验规则
- `mcpEnabled=false` 时不得进入工具调用循环。
- `maxRounds` 必须大于等于 1。

## 5. ToolToggleState

**说明**: 记录每个 MCP 工具当前启停状态，供管理页面展示和后端执行判定。  

### 字段
- `toolName` (string, unique): 工具唯一标识。
- `enabled` (boolean): 当前是否启用。
- `updatedBy` (string/number): 最后修改人标识。
- `updatedAt` (datetime): 最后修改时间。
- `reason` (string, optional): 开关调整原因简述。

### 校验规则
- `toolName` 必须存在于 `ToolDefinition`。
- 非管理员不得更新 `enabled`。
- 切换后必须在一个刷新周期内对执行器生效。

## 6. McpToggleAuditRecord

**说明**: 管理页面开关操作审计记录，便于追踪误操作与回滚。  

### 字段
- `id` (string/number): 审计记录主键。
- `toolName` (string): 目标工具。
- `beforeEnabled` (boolean): 操作前状态。
- `afterEnabled` (boolean): 操作后状态。
- `operatorId` (string/number): 操作者标识。
- `createdAt` (datetime): 操作时间。

### 校验规则
- 每次状态变更必须写入审计记录。
- `beforeEnabled` 与 `afterEnabled` 不能相同。
