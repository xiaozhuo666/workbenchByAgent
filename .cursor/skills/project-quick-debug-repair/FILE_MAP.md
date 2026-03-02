# 项目文件地图

快速查找你要找的文件。

---

## 按功能快速查找

### 首页相关

| 功能 | 文件 | 用途 |
|-----|------|------|
| 首页布局和结构 | `frontend/src/pages/HomePage/index.jsx` | 主要页面组件 |
| 首页样式 | `frontend/src/pages/HomePage/index.css` | 首页 CSS 样式 |
| 菜单配置 | HomePage/index.jsx (L39-52) | 左侧菜单定义 |
| AI 对话框集成 | HomePage/index.jsx (L104-120) | AISidebar 组件使用 |
| 待办列表集成 | HomePage/index.jsx (L98-102) | TodoList 组件使用 |
| 日程列表集成 | HomePage/index.jsx (L102-106) | ScheduleList 组件使用 |

### 待办事项相关

| 功能 | 文件 | 用途 |
|-----|------|------|
| 待办列表组件 | `frontend/src/components/TodoList/index.jsx` | 显示待办列表 |
| 待办数据获取 | `frontend/src/api/todoApi.js` | 待办 API 调用 |
| 待办状态更新 | TodoList/index.jsx + todoApi.js | 改变完成/删除状态 |

### 日程管理相关

| 功能 | 文件 | 用途 |
|-----|------|------|
| 日程列表组件 | `frontend/src/components/ScheduleList/index.jsx` | 显示日程列表 |
| 日程数据获取 | `frontend/src/api/scheduleApi.js` | 日程 API 调用 |
| 日期选择 | ScheduleList/index.jsx | dayjs 日期处理 |

### AI 对话相关

| 功能 | 文件 | 用途 |
|-----|------|------|
| AI 对话框组件 | `frontend/src/components/AISidebar/index.jsx` | 消息展示和输入 |
| AI 状态管理 | `frontend/src/services/aiStore.js` | AI 对话状态 |
| AI 数据处理 | aiStore.js | 消息、对话ID 管理 |
| AI 确认弹窗 | `frontend/src/components/AIConfirmationModal/index.jsx` | 确认批量操作 |

### 认证相关

| 功能 | 文件 | 用途 |
|-----|------|------|
| 认证页面 | `frontend/src/pages/AuthPage/index.jsx` | 统一认证入口 |
| 登录页 | `frontend/src/pages/LoginPage/index.jsx` | 登录表单 |
| 注册页 | `frontend/src/pages/RegisterPage/index.jsx` | 注册表单 |
| 认证 API | `frontend/src/api/authApi.js` | 登录/注册/登出 |
| 认证状态 | `frontend/src/services/authStore.js` | 用户信息、token 管理 |
| 登出按钮 | `frontend/src/components/AuthLogoutButton.jsx` | 登出按钮组件 |

### 路由相关

| 功能 | 文件 | 用途 |
|-----|------|------|
| 路由定义 | `frontend/src/router/index.jsx` | 所有路由配置 |
| 权限保护 | `frontend/src/router/ProtectedRoute.jsx` | 需要认证的路由 |
| 访客路由 | router/index.jsx (Guest route) | `/guest` 路由 |

### API 相关

| 功能 | 文件 | 用途 |
|-----|------|------|
| HTTP 客户端 | `frontend/src/api/httpClient.js` | Axios 配置、拦截器 |
| baseURL 配置 | httpClient.js (L3) | API 基地址 |
| 认证拦截器 | httpClient.js (L7-13) | 请求 header 添加 token |
| 认证错误处理 | httpClient.js (L15-25) | 401/403 处理 |
| 待办 API | `frontend/src/api/todoApi.js` | 待办数据接口 |
| 日程 API | `frontend/src/api/scheduleApi.js` | 日程数据接口 |
| 认证 API | `frontend/src/api/authApi.js` | 登录/注册接口 |

### 组件库和通用组件

| 功能 | 文件 | 用途 |
|-----|------|------|
| 空状态 | `frontend/src/components/Common/EmptyState.jsx` | 数据为空时显示 |
| 加载状态 | `frontend/src/components/Common/LoadingState.jsx` | 加载中显示 |
| 确认弹窗 | `frontend/src/components/AIConfirmationModal/index.jsx` | AI 操作确认 |

---

## 按问题快速查找

### 首页样式问题

```
问题：首页布局、颜色、大小不对

涉及文件（优先级）：
1. 首页主文件
   → frontend/src/pages/HomePage/index.jsx

2. 首页样式文件
   → frontend/src/pages/HomePage/index.css

3. 子组件样式（如果是子组件样式问题）
   → frontend/src/components/AISidebar/index.jsx (width/position)
   → frontend/src/components/TodoList/index.jsx (样式)
   → frontend/src/components/ScheduleList/index.jsx (样式)

4. 全局样式（如果有冲突）
   → frontend/src/index.css

快速查找方式：
Grep: "style=" 或 "className=" 或 "width:" 找样式相关
```

### 待办列表问题

```
问题：待办加载不了、显示不对、无法操作

涉及文件（按诊断顺序）：
1. 查看列表组件
   → frontend/src/components/TodoList/index.jsx

2. 查看数据获取
   → frontend/src/api/todoApi.js

3. 查看 HTTP 配置
   → frontend/src/api/httpClient.js

4. 查看认证（如果是 401）
   → frontend/src/services/authStore.js

快速查找方式：
TodoList: 找 useState, useEffect, map 处理数据
API: 找 httpClient.get/post/patch 调用
```

### AI 对话框问题

```
问题：对话框不显示、消息不展示、发送不了消息

涉及文件（按优先级）：
1. AI 组件
   → frontend/src/components/AISidebar/index.jsx

2. AI 状态管理
   → frontend/src/services/aiStore.js

3. 首页集成
   → frontend/src/pages/HomePage/index.jsx (showAISidebar)

快速查找方式：
AISidebar: 找 useState(messages), map render 消息
aiStore: 找 chat() 方法，conversationId 管理
```

### 接口请求问题

```
问题：请求失败、404、401、CORS 等

涉及文件（按诊断顺序）：
1. HTTP 客户端配置
   → frontend/src/api/httpClient.js

2. 具体 API 调用
   → frontend/src/api/*.js (authApi, todoApi, scheduleApi)

3. 认证状态
   → frontend/src/services/authStore.js

快速查找方式：
httpClient.js: 看 baseURL, 拦截器
*Api.js: 看 httpClient.get/post 调用的路径
```

### 数据展示问题

```
问题：数据不显示、显示为空、显示错误

涉及文件（按诊断顺序）：
1. 数据请求的组件
   → 对应的 jsx 组件文件

2. 数据处理和渲染
   → 组件中的 useEffect 和 render 部分

3. 数据来源 API
   → 对应的 api 文件

快速查找方式：
组件: 找 useState, useEffect, 条件渲染
API: 找返回数据的结构
```

### 登录/认证问题

```
问题：登录失败、token 丢失、未登录却能访问

涉及文件（按优先级）：
1. 认证页面
   → frontend/src/pages/AuthPage/index.jsx

2. 认证 API
   → frontend/src/api/authApi.js

3. 认证状态管理
   → frontend/src/services/authStore.js

4. HTTP 拦截器
   → frontend/src/api/httpClient.js

5. 路由保护
   → frontend/src/router/ProtectedRoute.jsx

快速查找方式：
authStore: 找 token 管理, login/logout 逻辑
httpClient: 找 Authorization header 设置
ProtectedRoute: 找权限检查逻辑
```

---

## 文件内容速览

### 关键行号参考

| 文件 | 关键内容 | 行号范围 |
|-----|--------|--------|
| HomePage/index.jsx | 菜单定义 | L39-52 |
| HomePage/index.jsx | useStates | L23-26 |
| HomePage/index.jsx | AI Sidebar 渲染 | L104-120 |
| httpClient.js | baseURL 配置 | L3 |
| httpClient.js | 认证拦截器 | L7-13 |
| httpClient.js | 错误处理 | L15-25 |
| AISidebar/index.jsx | 消息渲染 | 中间部分 |
| TodoList/index.jsx | 数据获取 | useEffect 部分 |
| ScheduleList/index.jsx | 日期处理 | 数据相关部分 |

---

## 快速复制路径

### 完整路径列表

```
# 首页
c:\Users\HP\Desktop\note\AI\ai_project\frontend\src\pages\HomePage\index.jsx
c:\Users\HP\Desktop\note\AI\ai_project\frontend\src\pages\HomePage\index.css

# 组件
c:\Users\HP\Desktop\note\AI\ai_project\frontend\src\components\AISidebar\index.jsx
c:\Users\HP\Desktop\note\AI\ai_project\frontend\src\components\TodoList\index.jsx
c:\Users\HP\Desktop\note\AI\ai_project\frontend\src\components\ScheduleList\index.jsx

# API
c:\Users\HP\Desktop\note\AI\ai_project\frontend\src\api\httpClient.js
c:\Users\HP\Desktop\note\AI\ai_project\frontend\src\api\todoApi.js
c:\Users\HP\Desktop\note\AI\ai_project\frontend\src\api\scheduleApi.js
c:\Users\HP\Desktop\note\AI\ai_project\frontend\src\api\authApi.js

# 业务逻辑
c:\Users\HP\Desktop\note\AI\ai_project\frontend\src\services\authStore.js
c:\Users\HP\Desktop\note\AI\ai_project\frontend\src\services\aiStore.js

# 路由
c:\Users\HP\Desktop\note\AI\ai_project\frontend\src\router\index.jsx
c:\Users\HP\Desktop\note\AI\ai_project\frontend\src\router\ProtectedRoute.jsx
```

---

## 使用技巧

### 快速查找文件内容

使用 Grep 快速搜索：

```
问题：找某个样式类
Grep: "\.classname" 或 "className=" 在 CSS 或 JSX 文件中

问题：找某个 API 调用
Grep: "todoApi\." 或 "httpClient\.get" 在对应的 API 文件中

问题：找某个组件的 props
Grep: "<AISidebar" 或 "<TodoList" 在 HomePage/index.jsx 中

问题：找某个 useState
Grep: "useState\(" 在组件文件中找所有 state
```

### 使用 incremental-code-editing 技巧

```
当你要修改某个文件时：
1. 先用这个地图定位文件
2. 告诉我文件路径
3. 告诉我你要修改什么（行号或功能描述）
4. 我会精确读取 20-50 行
5. 生成 StrReplace 修改指令
```

