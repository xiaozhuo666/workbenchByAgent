# Data Model - 登录注册与会话管理 MVP

## 1. Entity: User

### Purpose

表示可登录系统的账号主体。

### Fields

- `id` (bigint, PK, auto increment)
- `username` (varchar(32), unique, not null)
- `email` (varchar(128), unique, nullable)
- `password_hash` (varchar(255), not null)
- `status` (tinyint, not null, default 1)  // 1=active, 0=disabled
- `created_at` (datetime, not null)
- `updated_at` (datetime, not null)

### Constraints

- `username` 全局唯一。
- `email` 若提供则必须唯一。
- `password_hash` 必须为 bcrypt 结果，不可为空。

### Validation Rules (application layer)

- 用户名：3-32 位，允许字母、数字、下划线。
- 密码：至少 8 位，包含大小写字母与数字。
- email：可选，若输入需符合 email 格式。

## 2. Entity: Session

### Purpose

表示一次 JWT 登录会话，实现会话追踪、过期控制和登出失效。

### Fields

- `id` (bigint, PK, auto increment)
- `user_id` (bigint, FK -> users.id, not null)
- `jti` (varchar(64), unique, not null)  // JWT ID
- `token_expires_at` (datetime, not null)
- `revoked_at` (datetime, nullable)
- `ip` (varchar(45), nullable)
- `user_agent` (varchar(255), nullable)
- `created_at` (datetime, not null)

### Constraints

- `jti` 全局唯一。
- `user_id` 必须关联已存在用户。
- 登出时记录 `revoked_at`，作为会话失效标记。

### Indexes

- `idx_sessions_user_id` (`user_id`)
- `idx_sessions_token_expires_at` (`token_expires_at`)
- `uk_sessions_jti` (`jti`)

## 3. Relationships

- User (1) -> (N) Session
- 用户可以同时存在多个会话（MVP 允许多设备并发登录）

## 4. State Transitions

### Session lifecycle

1. `ACTIVE`: 登录成功后创建，`revoked_at` 为空且当前时间小于 `token_expires_at`。
2. `EXPIRED`: 当前时间超过 `token_expires_at`。
3. `REVOKED`: 用户登出，`revoked_at` 被写入。

接口鉴权时必须同时满足：
- JWT 签名有效且未过期
- `sessions.jti` 存在且不处于 `REVOKED`

## 5. Suggested DDL (draft)

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(32) NOT NULL,
  email VARCHAR(128) NULL,
  password_hash VARCHAR(255) NOT NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_username (username),
  UNIQUE KEY uk_users_email (email)
);

CREATE TABLE sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  jti VARCHAR(64) NOT NULL,
  token_expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  ip VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_sessions_jti (jti),
  KEY idx_sessions_user_id (user_id),
  KEY idx_sessions_token_expires_at (token_expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
);
```
