# 快速诊断指南

## 一句话诊断法

用户说什么 → 我立即回应什么

---

## 首页样式不对

### 用户说的可能是...

| 症状 | 快速诊断 | 文件 | 修复方向 |
|------|---------|------|--------|
| "左侧菜单太宽" | Sider 宽度设置 | HomePage/index.jsx + .css | 改 width 属性 |
| "右侧对话框溢出了" | AISidebar 宽度 | AISidebar/index.jsx | 改 width 或 right 值 |
| "按钮太大/太小" | 按钮的 size/style | HomePage/index.jsx | 改 size 或 style props |
| "颜色不对" | CSS 颜色值 | HomePage/index.css | 改 color/background-color |
| "布局错位了" | Layout 组件配置 | HomePage/index.jsx | 检查 Layout/Sider/Content 结构 |
| "字体太大/太小" | fontSize 设置 | HomePage/index.css | 改 font-size |
| "间距不对" | margin/padding | HomePage/index.css | 改间距值 |
| "响应式不工作" | 媒体查询或 Ant Design 响应式 | HomePage/index.css | 添加或修改 media query |

### 我的快速反应流程

```
用户：首页右侧的对话框太窄了

我说：我来帮你调整。
1. 文件：frontend/src/components/AISidebar/index.jsx
2. 修改：找到 Sider 或 width 的设置
3. 生成 StrReplace 修改指令

你：复制应用
```

---

## 接口请求不通

### 用户说的可能是...

| 症状 | 根本原因 | 快速检查 | 文件 |
|------|--------|---------|------|
| "一直转圈加载中" | 请求卡住或无响应 | Network 标签 → 是否有未完成的请求？ | api/httpClient.js |
| "404 Not Found" | API 端点错误 | Network 标签 → URL 是否正确？ | api/todoApi.js 等 |
| "401 Unauthorized" | 认证失败 | localStorage 中是否有 auth_token？ | api/httpClient.js |
| "CORS 错误" | 跨域问题 | 检查浏览器控制台 CORS 错误消息 | 后端配置（前端无法修复） |
| "500 Internal Server Error" | 后端问题 | 不是前端问题 | 后端代码 |

### 我的快速反应流程

```
用户：待办列表一直在加载

我说：让我帮你检查。
1. 请打开浏览器 DevTools → Network 标签
2. 刷新页面，找失败的请求
3. 告诉我：请求的 URL 是什么？状态码是多少？

用户：提供信息后

我：根据错误诊断
   - 如果是 404：检查 API 端点配置
   - 如果是 401：检查认证逻辑
   - 如果是无响应：检查 baseURL
```

### 最常见的原因快速排查

```
1️⃣ 首先检查后端是否启动
   症状：所有请求都卡住
   修复：启动后端服务

2️⃣ 检查 baseURL 是否正确
   文件：api/httpClient.js
   内容：const baseURL = "http://localhost:4000/api"
   
3️⃣ 检查 API 端点拼写
   文件：api/todoApi.js 等
   内容：httpClient.get("/todos") 或 .post("/todos")
   
4️⃣ 检查认证 token
   文件：api/httpClient.js 拦截器
   逻辑：是否正确获取和发送 token？
```

---

## 数据没展示

### 用户说的可能是...

| 症状 | 最可能的原因 | 快速排查 | 文件 |
|------|------------|--------|------|
| "列表显示 Empty" | 数据加载失败 | Network 标签 → 请求成功了吗？ | API 相关 |
| "数据加载中一直卡住" | useEffect 无限循环 | 浏览器卡顿或 DevTools 频繁日志 | 组件的 useEffect |
| "数据加载后仍显示 Empty" | 数据格式不匹配 | Console 看数据结构 | 组件的 render 部分 |
| "只显示一条数据" | 列表渲染错误 | 检查 map 函数 | 组件的 render 部分 |
| "日期显示不对" | 日期格式处理 | 查看实际数据和显示逻辑 | ScheduleList/index.jsx |

### 我的快速反应流程

```
用户：待办列表什么都不显示

我说：让我快速诊断。
1. 请检查：浏览器 Network 标签，/todos 请求成功了吗？

用户：说请求成功了

我：继续诊断：
2. 打开 Console 标签，看有无错误？
3. 看一下获取到的数据是什么样的（粘贴过来）

用户：提供数据后

我：分析数据格式
   - 对比组件期望的数据结构
   - 找出不匹配的字段
   - 生成修复指令
```

### 三层诊断法（优先级）

```
🔴 第 1 层：请求层面
   症状：Empty / Loading 不消失 / 错误提示
   检查：Network 标签 - 请求是否成功（200）？
   
🟡 第 2 层：数据处理层面
   症状：请求成功但数据显示不对
   检查：
   - API 响应数据格式
   - 组件的 setState 逻辑
   - useEffect 依赖是否完整？
   
🟢 第 3 层：渲染层面
   症状：数据存在但不显示
   检查：
   - render 中的条件判断
   - 列表的 key 属性
   - 子组件的 props 传递
```

---

## 一句话定位法

用户说 → 我快速定位

```
"首页的xxx样式不对"
→ 文件：pages/HomePage/index.jsx + .css

"待办列表加载不了"
→ 文件：components/TodoList/index.jsx + api/todoApi.js

"AI 对话框显示不了"
→ 文件：components/AISidebar/index.jsx

"登录后没跳转"
→ 文件：pages/AuthPage/index.jsx + router/index.jsx

"数据一直显示空"
→ 文件：对应的组件 + api 文件

"请求一直在加载"
→ 文件：api/httpClient.js + 对应的 api 文件

"样式布局错位了"
→ 文件：pages/HomePage/index.jsx + .css + 子组件样式
```

---

## 诊断决策树

```
用户报告问题
    ↓
┌─ 是样式问题吗？
│   ├─ YES → 文件：pages/HomePage/index.jsx + .css
│   │         工具：incremental-code-editing 修改样式
│   └─ NO ↓
├─ 是接口请求问题吗？
│   ├─ YES → 检查：Network 标签看请求状态
│   │         文件：api/httpClient.js + 对应的 api 文件
│   │         工具：incremental-code-editing 修改 API 配置
│   └─ NO ↓
├─ 是数据展示问题吗？
│   ├─ YES → 检查：请求是否成功 → 数据格式是否匹配 → 组件 useEffect
│   │         文件：组件文件 + api 文件
│   │         工具：incremental-code-editing 修改数据处理
│   └─ NO ↓
└─ 其他问题
    → 详细描述问题，我来具体分析
```

---

## 快速修复建议

### 修复前的三个问题

在我给出修复方案前，我会问你：

1. **你确认问题吗？**
   - 问题的具体表现是什么？
   - 它什么时候开始出现的？

2. **我理解对了吗？**
   - 我的诊断是对的吗？
   - 问题的根本原因是什么？

3. **会影响其他功能吗？**
   - 这个修改只影响这一个地方吗？
   - 会不会破坏其他功能？

### 修复后的三个检查

修复后，我会提醒你：

1. **功能是否恢复？**
   - 问题是否解决了？
   - 解决是否彻底？

2. **有无新问题？**
   - 其他功能还能用吗？
   - 控制台有无新错误？

3. **代码是否正确？**
   - 修改后的代码逻辑对吗？
   - 有无语法错误？

---

## 实际例子

### 例子 1：首页样式不对

**用户说**：
> 右侧的 AI 对话框太窄了，我看不清消息内容

**我的诊断**：
```
问题位置：AISidebar 组件的宽度
相关文件：
1. frontend/src/components/AISidebar/index.jsx
2. frontend/src/pages/HomePage/index.jsx (可能有样式)

我会做：
1. 读取 AISidebar 的 width 设置（10-20 行）
2. 检查 HomePage 是否有相关样式覆盖
3. 生成修改宽度的 StrReplace 指令
```

**修复建议**：
```
【文件】：frontend/src/components/AISidebar/index.jsx
【修改】：增加 width 值或改变 right 位置

old_string: """
const sidebarWidth = 400;
"""

new_string: """
const sidebarWidth = 500;  // 从 400 改为 500
"""
```

### 例子 2：待办列表加载不了

**用户说**：
> 待办列表页面一直显示 Loading，转了好久都没出现

**我的诊断**：
```
问题类型：接口请求不通 或 数据处理错误

快速检查：
1. 浏览器 Network 标签 → /todos 请求有没有返回？
   - 如果失败：检查 api/todoApi.js
   - 如果成功：检查数据处理逻辑

2. 浏览器 Console → 有无错误？
   - 如果有 useEffect 错误：检查依赖数组
   - 如果有数据错误：检查字段名

我会问：
- Network 中 /todos 请求的状态码是多少？
- Console 中有无错误信息？
- 你能把 API 响应数据粘贴过来吗？
```

**修复建议**（取决于实际情况）：
```
情况 1：请求 404
→ 检查 httpClient.js 的 baseURL
→ 检查 todoApi.js 的端点路径

情况 2：请求超时
→ 后端可能没启动
→ 或网络问题

情况 3：请求成功但 Loading 不消失
→ 检查 TodoList 的 useEffect 依赖
→ 检查 setState 的 loading 状态更新
```

---

## 关键提示

🎯 **我的目标**：快速诊断 + 精确定位 + 安全修复

✅ **我会做的**：
- 问明确的问题
- 分析根本原因
- 精确定位文件
- 生成无风险的修改

❌ **我不会做的**：
- 盲目修改
- 一次改太多地方
- 未经诊断就给出方案
- 忽视可能的副作用

