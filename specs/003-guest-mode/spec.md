# Feature Specification: 访客模式支持

**Feature Branch**: `003-guest-mode`  
**Created**: 2026-03-02  
**Status**: Approved (Development Completed)  
**Input**: User description: "为智能工作台助手实现访客无需登录即可使用日程与待办功能的能力，访客进入工作台时自动获取临时令牌，可直接使用所有功能。"

## Clarifications

### Session 2026-03-02

- Q: 访客是否需要登录才能使用功能？ → A: 否，访客直接访问 `/guest` 路由即可自动获取临时令牌，无需任何额外操作。
- Q: 访客数据是否与登录用户隔离？ → A: 是，访客数据使用特殊的 user_id=-1 标识，与登录用户完全隔离。
- Q: 访客令牌的有效期是多长？ → A: 与登录用户相同（通常 24 小时或根据环境变量配置）。
- Q: 访客刷新页面后数据是否仍存在？ → A: 是，访客数据存储在 MySQL 中（user_id=-1），刷新页面不会丢失。
- Q: 访客可以进行哪些操作？ → A: 创建、查看、完成、删除待办和日程，与登录用户功能相同。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 访客无需登录直接使用工作台 (Priority: P1)

作为一个访客用户，我可以不通过注册或登录，直接访问工作台的日程和待办功能，进行任务管理。

**Why this priority**: 这是吸引新用户尝试应用的关键功能，降低了使用门槛，提升用户转化率。

**Independent Test**: 访客直接访问 `/guest` 路由，页面自动初始化，无需输入任何凭据，可立即创建和管理待办事项。

**Acceptance Scenarios**:

1. **Given** 访客访问 `/guest` 路由，**When** 页面加载，**Then** 系统自动调用 `POST /api/auth/guest-token` 获取临时令牌，并将其存储到 localStorage。
2. **Given** 访客令牌已成功获取，**When** 访客访问待办或日程页面，**Then** 所有 API 请求都自动携带令牌，无需额外操作。
3. **Given** 访客在待办页面，**When** 创建新待办，**Then** 数据正确保存到 MySQL（user_id=-1），且列表立即更新。
4. **Given** 访客已创建若干待办，**When** 刷新页面，**Then** 所有待办数据仍然存在，无丢失或错误。

---

### User Story 2 - 访客数据完全隔离 (Priority: P1)

作为应用运维人员，我需要确保访客数据与登录用户数据完全隔离，避免数据混淆或冲突。

**Why this priority**: 这是系统稳定性和数据安全的必要保障。

**Independent Test**: 同时用访客和登录用户账号操作，验证他们看到的数据和操作结果完全不同。

**Acceptance Scenarios**:

1. **Given** 访客创建了 3 个待办，**When** 登录用户创建同名待办，**Then** 两个待办分别存储在各自的 user_id 下，互不影响。
2. **Given** 访客和登录用户分别访问日程页面，**When** 查询特定日期的日程，**Then** 各自只能看到属于自己的数据。
3. **Given** 访客删除了一个待办，**When** 登录用户查看列表，**Then** 该待办在登录用户列表中仍然存在。

---

### Edge Cases

- 访客令牌获取失败：系统显示友好的错误提示，并允许用户重试。
- 访客令牌过期：用户访问受保护资源时自动重新获取新令牌，用户无感知。
- 访客浏览器清除 localStorage：下次访问 `/guest` 时重新获取令牌，原有数据（在 MySQL 中）仍可恢复。
- 多标签页同时访问：各标签页独立维护令牌，互不干扰。
- 访客网络异常：API 请求失败时给出重试提示，数据不丢失。

---

## Implementation Details *(mandatory)*

### Backend Changes

#### 1. New API Endpoint: `POST /api/auth/guest-token`

**Request**:
```http
POST /api/auth/guest-token
Content-Type: application/json
```

**Response (200 OK)**:
```json
{
  "code": "OK",
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": -1,
      "username": "访客",
      "email": null,
      "isGuest": true
    }
  }
}
```

**Response (500 Error)**:
```json
{
  "code": "INTERNAL_ERROR",
  "message": "服务器内部错误，请稍后重试"
}
```

#### 2. Guest Token Payload Structure

访客 JWT token 的 payload 包含以下字段：
```json
{
  "sub": "-1",
  "isGuest": true,
  "jti": "unique-session-id",
  "iat": 1234567890,
  "exp": 1234654290
}
```

#### 3. Session Storage

访客令牌也会在 `sessions` 表中存储一条记录：
- `user_id`: NULL（访客无关联用户）
- `jti`: 令牌的唯一标识
- `token_expires_at`: 令牌过期时间
- `revoked_at`: NULL（默认未撤销）

#### 4. Database Query Impact

现有的查询语句已支持 `user_id = -1`：
```sql
SELECT * FROM todos WHERE user_id = -1
SELECT * FROM schedules WHERE user_id = -1
```

### Frontend Changes

#### 1. HomePage Component Updates

访客进入时自动获取令牌：
```jsx
useEffect(() => {
  if (isGuest && guestLoading) {
    (async () => {
      try {
        const { data } = await httpClient.post("/auth/guest-token");
        if (data && data.token) {
          window.localStorage.setItem("auth_token", data.token);
          setGuestLoading(false);
        }
      } catch (error) {
        console.error("获取访客令牌失败:", error);
        setGuestLoading(false);
      }
    })();
  }
}, [isGuest, guestLoading]);
```

#### 2. Router Configuration

添加访客路由支持：
```jsx
<Route path="/guest" element={<HomePage isGuest={true} />} />
```

#### 3. Token Management

前端 `httpClient` 拦截器已支持自动在所有请求中添加 Authorization header。

### Data Model Impact

现有的 `todos` 和 `schedules` 表已支持 `user_id = NULL` 或 `user_id = -1` 的查询：
- 访客数据：`user_id = -1`
- 登录用户数据：`user_id > 0`

---

## Testing Checklist

- [ ] 访客访问 `/guest` 路由，系统自动获取令牌
- [ ] 访客成功获取令牌后，能创建待办事项
- [ ] 访客创建的待办在数据库中 `user_id = -1`
- [ ] 访客和登录用户的待办完全隔离
- [ ] 访客令牌过期后，用户可自动重新获取
- [ ] 访客刷新页面后，原有数据仍存在
- [ ] 访客删除待办后，登录用户的待办不受影响
- [ ] 多访客同时访问，各自的数据独立

---

## Deployment Notes

1. 确保后端 `POST /api/auth/guest-token` 接口已部署。
2. 确保前端路由已添加 `/guest` 路由。
3. 令牌有效期应与环境变量 `JWT_EXPIRES_IN` 保持一致。
4. 定期清理过期的访客会话数据（可选）。

---

## Success Criteria

- SC-01: 访客直接访问 `/guest`，页面自动初始化，无需任何额外步骤。
- SC-02: 访客可成功创建、查看、完成、删除待办和日程。
- SC-03: 访客数据与登录用户数据完全隔离，无交叉污染。
- SC-04: 访客刷新页面后，数据仍然存在且正确。
- SC-05: 访客令牌获取失败时，系统给出友好的错误提示和重试选项。
