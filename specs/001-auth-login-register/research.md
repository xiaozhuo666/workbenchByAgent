# Phase 0 Research - 登录注册与会话管理 MVP

## Decision 1: 鉴权机制采用 JWT + 服务端会话状态表

- **Decision**: 使用 JWT 作为 access token，并在 `sessions` 表保存 `jti` 与状态实现可撤销会话。
- **Rationale**: 满足“鉴权方案固定 JWT”约束，同时支持登出后立即失效和会话过期治理。
- **Alternatives considered**:
  - 纯无状态 JWT：实现简单，但无法立即吊销已签发 token。
  - 传统服务端 Session：不符合用户明确固定 JWT 的要求。

## Decision 2: token 生命周期与刷新策略

- **Decision**: access token 默认 2 小时过期；MVP 不引入 refresh token，过期后重新登录。
- **Rationale**: 首期范围聚焦登录注册主链路，降低复杂度并满足“刷新保持登录”在有效期内可用。
- **Alternatives considered**:
  - 加入 refresh token：体验更好，但增加存储、安全与接口复杂度。
  - 超长有效期 token：安全风险较高，不推荐。

## Decision 3: 前端 token 存储与路由守卫

- **Decision**: MVP 使用前端受控存储持有 token，并以 `ProtectedRoute` + `/api/auth/me` 完成登录态恢复。
- **Rationale**: 快速落地，便于与现有 React 路由结构集成。
- **Alternatives considered**:
  - HttpOnly Cookie：更安全，但需同步处理 CSRF 与跨域 cookie 策略，适合下一阶段强化。
  - 仅内存存储：刷新后丢失登录态，不满足当前目标。

## Decision 4: 注册与登录的输入校验基线

- **Decision**: 用户名 3-32 位、字母数字下划线；密码至少 8 位且含大小写字母与数字；email 可选但需合法格式。
- **Rationale**: 覆盖“密码强度校验”和基础安全要求，保证实现可测试且约束明确。
- **Alternatives considered**:
  - 仅长度校验：安全性不足。
  - 过严复杂规则（特殊字符强制等）：影响可用性，MVP 暂不强制。

## Decision 5: 错误码与错误响应规范

- **Decision**: 统一业务错误码（`AUTH_*`）+ 用户可读 `message` + `requestId`。
- **Rationale**: 前后端联调稳定，可直接映射到前端提示并利于排障。
- **Alternatives considered**:
  - 仅 HTTP 状态码：业务语义不够细粒度。
  - 返回底层异常信息：有信息泄露风险。

## Decision 6: QQ 邮箱后续集成兼容性

- **Decision**: 本期只预留 `QQ_MAIL_USER`、`QQ_MAIL_AUTH_CODE` 环境变量，不接入 SMTP/IMAP 业务流程。
- **Rationale**: 满足架构前瞻与安全要求（授权码不入库、不写明文），同时不超出认证 MVP 范围。
- **Alternatives considered**:
  - 本期直接实现邮箱收发：超出当前范围边界并增加不必要风险。

## Decision 7: CORS 与部署联调策略

- **Decision**: 后端按环境配置允许来源（开发环境允许 `http://localhost:3000`），禁止通配生产来源。
- **Rationale**: 降低联调阻塞并控制跨域安全风险。
- **Alternatives considered**:
  - 全量开放 `*`：联调方便但不安全。
