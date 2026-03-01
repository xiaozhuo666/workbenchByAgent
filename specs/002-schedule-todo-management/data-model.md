# Data Model: 日程与待办管理

## Entities

### 1. Todo (待办事项)
- **Table Name**: `todos`
- **Fields**:
    - `id`: BIGINT, PK, AUTO_INCREMENT
    - `user_id`: BIGINT, FK (users.id), INDEX
    - `title`: VARCHAR(255), NOT NULL
    - `description`: TEXT, NULL
    - `status`: ENUM('pending', 'completed'), DEFAULT 'pending'
    - `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
    - `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Validation**: 标题不能为空且长度不超过 255 字符。

### 2. Schedule (日程)
- **Table Name**: `schedules`
- **Fields**:
    - `id`: BIGINT, PK, AUTO_INCREMENT
    - `user_id`: BIGINT, FK (users.id), INDEX
    - `title`: VARCHAR(255), NOT NULL
    - `description`: TEXT, NULL
    - `start_time`: DATETIME, NOT NULL, INDEX
    - `end_time`: DATETIME, NULL
    - `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- **Validation**: `start_time` 必须有效；开始时间不能晚于结束时间（若有）。

### 3. AI_Command_Log (AI 指令日志)
- **Table Name**: `ai_command_logs`
- **Fields**:
    - `id`: BIGINT, PK, AUTO_INCREMENT
    - `user_id`: BIGINT, FK (users.id)
    - `raw_text`: TEXT, NOT NULL (用户原始输入)
    - `parsed_json`: JSON, NULL (AI 解析结果)
    - `command_type`: ENUM('generate_todo', 'batch_update'), NOT NULL
    - `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP

## Relationships
- `User` (1) --- (N) `Todo`
- `User` (1) --- (N) `Schedule`
- `User` (1) --- (N) `AI_Command_Log`
