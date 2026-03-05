# Data Model - AI 票务工作台接力体验

## 1) 行程草稿（TripDraft）

### 说明
由聊天意图解析生成的结构化任务载体，用于聊天与票务页之间的任务接力。

### 关键字段
- `draftId`：草稿唯一标识
- `userId`：所属用户
- `source`：来源（默认 ai_assistant）
- `fromCity` / `fromStationCode`
- `toCity` / `toStationCode`
- `travelDate`：出发日期
- `trainTypes`：车次偏好（如 G、D）
- `departureTimeRange`：出发时段偏好
- `seatTypes`：席别偏好
- `strategy`：偏好策略（fastest/cheapest/comfortable）
- `status`：`collecting` / `ready` / `expired`
- `expiresAt`：过期时间
- `createdAt` / `updatedAt`

### 校验规则
- `draftId` 必须唯一且可追踪；
- `travelDate` 不得早于当前日期；
- `from` 与 `to` 不得相同；
- `status=ready` 时必须包含完整核心查询条件（出发、到达、日期）。

### 状态流转
- `collecting -> ready`：关键信息补齐后
- `ready -> expired`：到达过期时间
- `expired -> collecting`：用户触发重新生成或补全

---

## 2) 查询条件快照（TicketSearchProfile）

### 说明
用户在票务工作台当前使用的可编辑查询条件，支持手动调整与推荐套用。

### 关键字段
- `profileId`
- `draftId`
- `sortBy`：最早出发/最短耗时/最低价格
- `filters`：席别可售、时段、车次类型等
- `lastSearchedAt`

### 关系
- 一个 `TripDraft` 可对应多个 `TicketSearchProfile` 快照（每次重查可更新）。

---

## 3) 车次方案（TicketOption）

### 说明
票务查询结果中的可选方案，包含直达或中转信息。

### 关键字段
- `optionId`
- `draftId`
- `tripType`：`direct` / `transfer`
- `trainNo`（中转可为组合）
- `departAt` / `arriveAt`
- `durationMinutes`
- `priceMin` / `priceMax`
- `seatAvailability`：席别余票摘要
- `transferCount`
- `transferWaitMinutes`
- `riskLevel`：换乘风险等级
- `dataTimestamp`

### 校验规则
- `durationMinutes`、价格字段需为非负数；
- `tripType=transfer` 时必须提供换乘相关字段。

---

## 4) AI 推荐方案（TicketRecommendation）

### 说明
AI 对当前结果集归纳出的三类决策建议。

### 关键字段
- `recommendationId`
- `draftId`
- `type`：`fastest` / `cheapest` / `comfortable`
- `optionId`：命中的车次方案
- `reasons`：推荐理由列表（至少 2 条）
- `confidence`：置信度分档
- `appliedFilters`：可一键套用的筛选条件
- `generatedAt`

### 校验规则
- 每个 `draftId` 至少可返回 0~3 条推荐；
- 推荐存在时，每条必须包含可读理由和可执行筛选映射。

---

## 5) 查询日志（TicketQueryLog）

### 说明
记录用户在票务页的查询与异常信息，用于稳定性观测与问题追踪。

### 关键字段
- `logId`
- `draftId`
- `userId`
- `queryStatus`：success/partial/timeout/error
- `resultCount`
- `durationMs`
- `errorCode`
- `createdAt`

### 关系
- `TripDraft (1) -> (N) TicketQueryLog`
- 用于计算成功率、超时率、草稿转化率等指标。
