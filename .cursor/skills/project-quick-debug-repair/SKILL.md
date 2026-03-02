---
name: project-quick-debug-repair
description: 快速诊断和修复 ai_project 中的问题。根据用户报告的问题类型（首页样式、接口请求、数据展示），精确定位相关文件和代码，避免全项目扫描，快速生成修复方案。当用户报告具体问题时自动触发。
---

# 项目快速诊断与修复 Skill

## 核心目标

**快速定位和修复问题，同时避免引入新问题**

通过预建的项目地图和诊断规则，快速从问题描述定位到文件，然后结合 incremental-code-editing skill 修复。

---

## 项目概览

**项目名称**：ai_project（全栈应用）

**技术栈**：
- 前端：React 19 + Ant Design + Less/CSS
- 后端：Node.js 20 + Express + MySQL
- API 通信：Axios + REST

---

## 前端项目结构

```
frontend/src/
├── pages/                          # 页面级组件
│   ├── HomePage/                   # 首页（主要功能）
│   │   ├── index.jsx               # 首页主组件
│   │   └── index.css               # 首页样式
│   ├── AuthPage/                   # 认证页面（统一认证入口）
│   │   ├── index.jsx
│   │   └── index.css
│   ├── LoginPage/                  # 登录页（AuthPage 内）
│   │   ├── index.jsx
│   │   └── index.less
│   └── RegisterPage/               # 注册页（AuthPage 内）
│       ├── index.jsx
│       └── index.less
├── components/                     # 可复用组件
│   ├── AISidebar/                  # AI 对话框
│   │   └── index.jsx               # 包含消息展示、输入框、例句
│   ├── TodoList/                   # 待办列表
│   │   └── index.jsx               # 包含复选框、删除、状态切换
│   ├── ScheduleList/               # 日程列表
│   │   └── index.jsx               # 包含日期选择、日程展示
│   ├── AIConfirmationModal/        # AI 操作确认弹窗
│   │   └── index.jsx
│   ├── AuthLogoutButton/           # 登出按钮
│   │   └── index.jsx
│   └── Common/                     # 通用组件
│       ├── EmptyState.jsx          # 空状态
│       └── LoadingState.jsx        # 加载状态
├── api/                            # API 调用层
│   ├── httpClient.js               # Axios 配置（拦截器、认证）
│   ├── authApi.js                  # 认证 API
│   ├── todoApi.js                  # 待办 API
│   ├── scheduleApi.js              # 日程 API
│   └── aiApi.js                    # AI API（如果有的话）
├── services/                       # 业务逻辑层
│   ├── authStore.js                # 认证状态管理
│   ├── aiStore.js                  # AI 状态管理
│   └── ...                         # 其他业务服务
├── router/                         # 路由配置
│   ├── index.jsx                   # 路由定义（根路由、访客路由）
│   └── ProtectedRoute.jsx          # 权限保护路由
├── assets/                         # 静态资源
├── __tests__/                      # 测试文件
└── index.js                        # 应用入口
```

---

## 问题诊断规则

### 问题类型 1️⃣：首页样式不对

**症状**：
- 布局错位、位置不对
- 颜色不对、字体太大/太小
- 按钮/输入框样式不符合设计
- 响应式布局不工作
- 组件间距不对

**可能的原因**：
1. **首页 CSS 错误** - 样式规则冲突或缺失
2. **Ant Design 组件配置** - 组件 props 错误
3. **全局样式冲突** - index.css 中的样式影响
4. **Less 变量** - 主题变量改变
5. **子组件样式** - AISidebar、TodoList 等子组件的样式问题

**快速定位**：
```
首页文件：frontend/src/pages/HomePage/index.jsx + index.css
检查列表：
1. HomePage/index.css 中的样式规则
2. Layout/Sider/Content 的样式属性
3. 各子组件的样式（AISidebar、TodoList、ScheduleList）
4. index.css 全局样式冲突
5. Ant Design 组件的 style/className props
```

**修复步骤**：
```
1. 打开 HomePage/index.jsx，确认 JSX 结构
2. 打开 HomePage/index.css，检查样式规则
3. 定位具体的样式问题
4. 使用 incremental-code-editing 修改样式
```

---

### 问题类型 2️⃣：接口请求不通

**症状**：
- 网络请求失败（404、500、CORS 错误）
- 请求卡住（无响应）
- 请求方法错误（GET/POST）
- 认证失败（401、403）
- 请求头缺失

**可能的原因**：
1. **API 地址错误** - baseURL 或端点路径
2. **认证失败** - token 过期、未发送
3. **请求方法错误** - GET/POST/PATCH 配置
4. **CORS 问题** - 跨域请求被阻止
5. **后端异常** - 后端服务未启动或有 bug

**快速定位**：
```
检查文件（优先级）：
1. frontend/src/api/httpClient.js - baseURL 配置、拦截器
2. frontend/src/api/todoApi.js / scheduleApi.js / authApi.js - 具体 API 调用
3. frontend/src/services/authStore.js - 认证逻辑
4. 浏览器 DevTools → Network 标签 - 查看具体请求详情
```

**修复步骤**：
```
1. 打开浏览器 DevTools → Network 标签
2. 找到失败的请求，查看：
   - URL 是否正确？
   - Method 是否正确？
   - Headers 中是否有 Authorization？
   - 响应状态和错误信息
3. 根据错误定位具体文件
4. 使用 incremental-code-editing 修复
```

**常见场景**：
```
❌ 错误 1：API 地址错误
   症状：404 Not Found
   位置：frontend/src/api/*.js 中的 httpClient.get/post 调用
   
❌ 错误 2：认证 token 缺失
   症状：401 Unauthorized
   位置：frontend/src/api/httpClient.js 中的请求拦截器
   或 frontend/src/services/authStore.js

❌ 错误 3：请求方法错误
   症状：405 Method Not Allowed
   位置：检查 API 调用是 GET 还是 POST
   
❌ 错误 4：CORS 被阻止
   症状：CORS policy 错误
   位置：后端 CORS 配置（与前端无关）
```

---

### 问题类型 3️⃣：数据没展示

**症状**：
- 列表为空，应该有数据
- 数据加载但不显示
- 数据显示错位或重叠
- 加载状态一直卡住
- 数据更新不及时

**可能的原因**：
1. **数据请求失败** - 接口调用出错（见问题类型 2）
2. **数据格式不匹配** - 后端返回的字段与前端期望不符
3. **状态管理问题** - setState 没有触发重渲染
4. **依赖数组缺失** - useEffect 没有正确设置依赖
5. **条件渲染错误** - 数据存在但条件判断错误
6. **子组件 props 问题** - 传入的 props 格式不对

**快速定位**：
```
检查文件（按优先级）：
1. 涉及数据的组件文件（TodoList、ScheduleList、AISidebar）
   - 检查 useState 初值
   - 检查 useEffect 依赖数组是否完整
   
2. API 调用文件（todoApi.js、scheduleApi.js）
   - 检查响应数据格式
   
3. 状态管理（services/authStore.js、aiStore.js）
   - 检查状态更新逻辑
   
4. 浏览器 DevTools → Console 标签
   - 查看 JavaScript 错误
   - 查看 API 响应数据结构
```

**修复步骤**：
```
步骤 1：打开浏览器 DevTools → Network 标签
       查看数据请求是否成功（200 状态码）
       
步骤 2：打开 Console 标签
       查看是否有 JavaScript 错误
       
步骤 3：检查 API 响应数据格式
       期望的数据结构是什么？
       实际返回的数据结构是什么？
       
步骤 4：定位数据展示的组件文件
       如 TodoList/index.jsx 的 render 部分
       
步骤 5：检查：
       - useState 初值是否正确？
       - useEffect 依赖数组是否完整？
       - 数据传入子组件的 props 是否正确？
       - 条件渲染的判断条件是否正确？
```

**常见场景**：
```
❌ 场景 1：useEffect 依赖不完整
   症状：第一次加载时数据显示，但改变条件后不更新
   位置：组件的 useEffect hook
   修复：添加完整的依赖数组

❌ 场景 2：API 响应字段改变
   症状：数据加载但没有显示
   位置：组件 render 部分，item.xxx 字段获取错误
   修复：检查 API 响应结构，调整字段访问路径

❌ 场景 3：父组件 props 传递错误
   症状：子组件收到的数据为空或undefined
   位置：父组件传入的 props
   修复：确保传入的数据结构和字段名正确

❌ 场景 4：setState 异步更新
   症状：数据更新但页面没有重新渲染
   位置：状态更新逻辑
   修复：确保使用 setState 而不是直接修改对象
```

---

## 核心工作流

### 工作流概览

```
用户报告问题
    ↓
【项目 Skill】快速诊断问题类型和可能原因
    ↓
【项目 Skill】精确定位相关文件（不读整个项目）
    ↓
【incremental-code-editing】读取具体文件的目标部分
    ↓
分析代码，找到问题
    ↓
【incremental-code-editing】生成 StrReplace 修复指令
    ↓
用户应用修复
```

### 不同问题的处理流程

#### 首页样式问题
```
用户说：首页的右侧对话框宽度不对

我会说：
【快速诊断】
1. 问题位置：AISidebar 组件的宽度设置
2. 可能文件：
   - frontend/src/components/AISidebar/index.jsx (组件)
   - frontend/src/pages/HomePage/index.jsx (样式类名)
   - frontend/src/pages/HomePage/index.css (样式规则)

3. 检查清单：
   - AISidebar 的 width 属性
   - Sider 的样式
   - index.css 的类名匹配

然后：
1. 读取 AISidebar/index.jsx 的布局代码（20-30 行）
2. 读取 HomePage/index.css 中的相关样式（10-15 行）
3. 生成修改指令
```

#### 接口请求问题
```
用户说：待办列表的请求一直在加载，没有返回

我会说：
【快速诊断】
1. 问题位置：待办列表的数据请求
2. 检查顺序：
   a) 浏览器 DevTools 看实际请求
   b) 检查 httpClient.js 的 baseURL
   c) 检查 todoApi.js 的请求配置
   d) 检查 TodoList 的 useEffect

3. 常见原因：
   - baseURL 不正确
   - API 端点路径错误
   - 认证 token 缺失
   - 后端服务未启动

然后：
1. 指导查看浏览器 Network 标签
2. 读取 httpClient.js 和 todoApi.js
3. 生成修复指令
```

#### 数据没展示问题
```
用户说：待办列表页面显示 Empty，但数据应该存在

我会说：
【快速诊断】
1. 问题位置：数据加载或渲染
2. 检查列表：
   a) API 请求是否成功（Network 标签）
   b) API 响应数据格式
   c) TodoList 的 useEffect 依赖
   d) 数据条件渲染逻辑

3. 最可能的原因：
   - 网络请求失败（见问题类型 2）
   - useEffect 依赖不完整
   - 数据格式不匹配

然后：
1. 读取 TodoList/index.jsx 的 useEffect 和 render 部分
2. 检查数据请求和处理逻辑
3. 生成修复指令
```

---

## 关键文件快速参考

### API 层文件

| 文件 | 用途 | 常见问题 |
|-----|------|--------|
| `api/httpClient.js` | 配置 Axios、设置 baseURL、认证 | baseURL 错误、token 丢失 |
| `api/authApi.js` | 认证相关 API | 登录/注册/登出 |
| `api/todoApi.js` | 待办相关 API | 获取列表、创建、更新、删除 |
| `api/scheduleApi.js` | 日程相关 API | 获取日程、创建、更新 |

### 页面/组件文件

| 文件 | 用途 | 常见问题 |
|-----|------|--------|
| `pages/HomePage/index.jsx` + `.css` | 首页布局和样式 | 布局错位、样式冲突 |
| `components/TodoList/index.jsx` | 待办列表 | 数据不显示、交互不工作 |
| `components/ScheduleList/index.jsx` | 日程列表 | 数据不显示、日期不对 |
| `components/AISidebar/index.jsx` | AI 对话框 | 消息不显示、输入不工作 |

### 业务逻辑文件

| 文件 | 用途 | 常见问题 |
|-----|------|--------|
| `services/authStore.js` | 认证状态管理 | token 过期、用户信息不对 |
| `services/aiStore.js` | AI 状态管理 | 消息不同步、对话状态错误 |

---

## 修复安全检查清单

在应用任何修复前，检查：

### ✅ 必检项

- [ ] **问题确认**：问题确实存在吗？我是否理解正确了问题？
- [ ] **原因分析**：我找到的原因是根本原因吗？还是只是表面症状？
- [ ] **修改范围**：这个修改会影响其他功能吗？
- [ ] **依赖检查**（React Hooks）：
  - [ ] useEffect 的依赖数组是否完整？
  - [ ] useState 初值是否正确？
  - [ ] useCallback 是否必要，依赖是否完整？
- [ ] **API 检查**（请求相关）：
  - [ ] API 端点是否正确？
  - [ ] 请求方法是否正确？
  - [ ] 请求头是否完整？
- [ ] **样式检查**（样式相关）：
  - [ ] CSS 选择器是否正确？
  - [ ] 是否会影响其他元素？
  - [ ] 响应式设计是否仍然生效？

### 🚫 禁止项

- ❌ 同时修改多个不相关的功能
- ❌ 删除看不懂的代码
- ❌ 改变不必要的部分
- ❌ 未经测试就提交

---

## 使用指南

### 当用户说...

#### "首页样式显示不对"
```
→ 定位：HomePage 相关文件
→ 文件：pages/HomePage/index.jsx + .css
→ 工具：incremental-code-editing（修改样式）
```

#### "待办列表加载不了"
```
→ 定位：TodoList 和 API 相关文件
→ 文件：components/TodoList/index.jsx + api/todoApi.js
→ 步骤：检查请求 → 检查 useEffect → 检查数据处理
→ 工具：incremental-code-editing（修改代码）
```

#### "登录后没有跳转到首页"
```
→ 定位：认证和路由相关文件
→ 文件：pages/AuthPage/index.jsx + router/index.jsx
→ 检查：登录后的导航逻辑
→ 工具：incremental-code-editing（修改路由逻辑）
```

---

## 预期效果

| 指标 | 目标 |
|------|------|
| 定位文件时间 | < 1 分钟 |
| 读取代码量 | 50-100 行（避免全项目） |
| token 消耗 | 减少 60-70% |
| 修复准确率 | 95%+ 不引入新问题 |

