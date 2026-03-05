# 规范驱动开发 (SSD) 项目总结：智能生活助手工作台

## 1. 项目核心概述
本项目是一个基于 **规范驱动开发 (SSD)** 理念构建的全能 AI 助手平台。它不仅具备基础的对话能力，最核心的突破在于实现了 **原生 MCP (Model Context Protocol) 协议宿主环境**，使 AI 能够通过标准协议动态接入并调用外部工具（如 12306、实时网页搜索等），解决了大模型无法获取实时信息和操作第三方服务的痛点。

## 2. 核心技术栈
*   **前端**：React 19 + Ant Design + Less。采用响应式布局，实现了复杂的对话流渲染，支持 Markdown、表格展示以及工具调用中间状态的实时反馈。
*   **后端**：Node.js 20 + Express。构建了 RESTful API 体系，利用 `child_process` 实现了异步进程管理，用于驱动外部 MCP Server。[详见附录 6.1]
*   **存储**：MySQL 8.x。设计了完整的持久化层，包含会话管理、消息历史以及工具调用审计日志（耗时、状态、参数）。[详见附录 6.2]
*   **AI 引擎**：阿里通义千问 (Qwen-Plus)，通过 OpenAI 兼容 SDK 进行集成。

## 3. 从 0 到 1 的实现路径 (SSD 流程)
1.  **规范定义 (Spec)**：使用 **Spec Kit** 流程进行规范驱动开发，确保“先想清楚再写代码”。整个流程分为以下四个关键步骤：
    1.  **`/constitution` (立规矩，定原则)**：通过此命令确定了 Node.js (Express) + React (antd) + MySQL 的技术闭环，定义了前后端分离规范。
    2.  **`/specify` (写规范，讲清楚做什么)**：生成 `spec.md`，明确两个核心用户故事（US1: 账号注册登录，US2: 登录态保持与退出），并定义了“注册用户名唯一性”、“未登录访问拦截率 100%”等验收标准。
    3.  **`/clarify`**:可以使用clarify 进一步澄清细节澄清 ，通过对话式的，明确具体需求，AI会给出参考
    4.  **`/plan` (出方案，设计怎么做)**：产出 `plan.md`，完成了 `users` 和 `sessions` 表的 DDL 设计、JWT 鉴权逻辑、以及蓝白科技感视觉布局。
    5.  **`/tasks` (拆任务，细化到可执行的步骤)**：生成 `tasks.md`，将认证功能拆解为 50 个微小任务，确保开发节奏可回溯。
    6.  **`/implement` (代码落地，动手做)**：按照任务列表高效编码，完成了后端 API 开发、前端统一认证页合并（`/auth`）以及路由守卫等核心实现。
2.  **原型搭建**：基于 Node.js 实现基础的 stdio 通信逻辑，验证与外部进程进行 JSON-RPC 交互的可行性。
3.  **架构演进**：
    *   **V1 (适配器模式)**：为每个工具手写 Adapter，发现扩展性差且代码冗余。
    *   **V2 (通用客户端)**：实现 `GenericMcpClient`，初步实现参数化调用。
    *   **V3 (原生 MCP 架构)**：实现 `McpServerManager` 自动发现工具定义，直接对接大模型原生的 `tool_calls` 接口，实现真正的“即插即用”。[详见附录 6.3]
4.  **实战集成**：先后接入 `open-webSearch`（联网搜索）和 `12306-mcp`（火车票查询），验证了多步链式调用的复杂场景。

## 4. AI & MCP 核心流程深度解析 (技术亮点)

### A. 协议驱动 vs 代码驱动
*   **传统方式**：硬编码。每增加一个功能都要修改后端代码，定义接口和参数映射。
*   **原生 MCP 方式**：**工具发现 (Discovery)**。系统启动时自动调用 MCP Server 的 `tools/list`，动态获取工具名、描述及 JSON Schema，并自动注入给 AI。

### B. 完整的交互链路（前端 -> 后端 -> AI -> MCP -> AI -> 前端）
下面这段是面试时可以直接复述的“闭环流程”：

1.  **前端发起请求**  
    用户在页面输入问题（例如“查明天上海到北京高铁票”），前端调用后端聊天接口（如 `/api/ai/chat`），请求体里包含 `text + conversationHistory`。

2.  **后端组装模型输入**  
    Controller 收到请求后交给 Service，Service 再进入 `chatOrchestrator.runChatLoop`。  
    Orchestrator 会组装 `messages`（system + 历史 + 本轮用户问题），并从 `mcpServerManager.getOpenAiTools()` 取到全部可用工具定义（名称、描述、参数 Schema）。

3.  **AI 如何“识别需要用 MCP 工具”**  
    后端调用千问接口时把 `tools` 一起传入。  
    AI 并不是“猜”到工具，而是基于以下输入做决策：  
    * 用户问题语义（要不要查实时数据）。  
    * 每个工具的 `description`（这个工具能做什么）。  
    * `inputSchema`（这个工具需要哪些参数）。  
    * 对话历史（上一步工具结果是什么）。  
    当 AI 判断“需要工具”时，它不会直接执行工具，而是返回结构化指令 `message.tool_calls`。

4.  **AI 如何“通知后端去调用工具”**  
    通知机制就是模型响应里的 `tool_calls` 字段（函数名 + 参数 JSON）。  
    后端读取 `message.tool_calls` 后，逐个执行：  
    * 解析 `toolName` 和 `arguments`。  
    * 调用 `mcpServerManager.callTool(toolName, args)`。  
    * 管理器通过 `child_process.spawn` 与 MCP Server 走 stdio/JSON-RPC（`tools/call`）。

5.  **后端调用后，怎么“喂给 AI”继续思考**  
    工具返回结果后，后端不会立刻给前端，而是把结果封装成一条 `role: "tool"` 的消息，追加回 `messages`。  
    然后再次调用模型。模型看到新消息后会做二次决策：  
    * 继续调用下一个工具（如先查站码，再查余票）；或  
    * 结束工具链，直接生成最终自然语言答案。

6.  **最终输出与回传前端**  
    当模型返回的消息里不再包含 `tool_calls`，说明链路结束。  
    后端取最终文本作为回复，记录调用日志（成功/失败/轮次/耗时），最后返回给前端渲染。

> 关键理解：  
> **AI 负责决策（要不要调、调哪个、传什么参数）**；  
> **后端负责执行（真的去调 MCP）**；  
> **工具结果再回灌给 AI，形成闭环推理。**

## 5. 关键功能实现细节
*   **原生 Tool Calling 对接**：弃用模拟决策逻辑，利用大模型原生的函数调用能力，大幅提升意图识别准确率。
*   **多进程隔离执行**：每个 MCP 工具运行在独立的子进程中，互不干扰，确保了 Host 环境的稳定性。
*   **工具调用审计**：在 `ai_mcp_tool_logs` 中记录每一轮调用的详细 Trace，为 AI 行为审计和性能优化提供数据支持。
*   **上下文感知**：在工具决策流中透传完整的对话历史，使 AI 能够根据前文信息（如上一步获取的站码）进行逻辑推理。

## 6. 附录：后端技术基础解析 (面向初学者)

### 6.1 Node.js & Express (后端实现流程)

Node.js 作为后端，本质上是一个**“死循环监听器”**。它的工作流程可以拆解为以下四个基本步骤：

#### 1. 初始化与环境配置 (Setup)
*   **入口文件**：通常是 `app.js` 或 `index.js`。
*   **环境变量 (`dotenv`)**：后端需要连接数据库、调用 AI 接口（API Key），这些敏感信息存放在 `.env` 文件中，通过 `process.env` 读取。
*   **跨域处理 (`cors`)**：因为前端（3000端口）和后端（4000端口）不在一个地方，必须配置 CORS 允许前端访问。

#### 2. 接口实现的四大核心组件 (分层架构)
在本项目中，为了让代码结构清晰、易于维护，每一个功能接口都严格拆分为四个部分。以下以“AI 聊天接口”为例说明其分工：

*   **Routes (路标)**：负责定义 URL 路径和允许的动作（GET/POST）。
    *   *职责*：告诉系统，当用户访问 `/api/ai/chat` 时，应该去找哪个 Controller。
    *   *示例*：`router.post('/chat', aiController.chat);`
*   **Controller (接线员/调度员)**：负责处理 HTTP 请求的“进入”和“离开”。
    *   *职责*：从 `req`（请求）中提取参数，调用 Service 处理业务，最后通过 `res`（响应）把结果吐给前端。它不处理具体的业务逻辑。
    *   *示例*：
        ```javascript
        async chat(req, res) {
          const { text } = req.body; // 1. 拿到输入
          const result = await aiService.chatWithMcp(text); // 2. 派活给 Service
          res.json({ success: true, data: result }); // 3. 输出给前端
        }
        ```
*   **Service (业务员/大脑)**：负责处理“真正的业务逻辑”。
    *   *职责*：它是最聪明的部分。比如判断是否需要调用 MCP 工具、如何组合千问大模型的提示词、如何处理多轮对话。它会调用 Repository 来存取数据。
    *   *示例*：`async chatWithMcp(text) { /* 复杂的 AI 决策和工具调用逻辑 */ }`
*   **Repository (仓库管理员/数据员)**：负责处理“数据库操作”。
    *   *职责*：它只关心 SQL 语句。它不知道什么是 AI，只负责把 Service 给它的数据存进 MySQL，或者从 MySQL 查出数据给 Service。
    *   *示例*：`async saveMessage(msg) { await db.query('INSERT INTO ai_messages ...', [msg]); }`

#### 3. 一个接口的完整执行流程 (从输入到输出)
当你点击前端的“发送”按钮时，后端内部发生了如下“接力”：
1.  **输入阶段**：前端发起 POST 请求 -> **Routes** 识别路径 -> 移交给 **Controller**。
2.  **解析阶段**：**Controller** 从请求体中解析出用户说的文字 `text`。
3.  **逻辑阶段**：**Controller** 调用 **Service**。**Service** 思考后决定调用 MCP 工具，并调用 **Repository** 将对话存入数据库。
4.  **输出阶段**：**Service** 返回 AI 的回答 -> **Controller** 拿到回答 -> 通过 `res.json()` 将结果发回给前端。

#### 4. 异步处理与子进程 (Async & child_process)
由于 AI 回复和工具调用都很慢，Node.js 使用 `async/await` 确保在等待结果时不会卡死整个服务器。
*   **child_process.spawn**：这是本项目驱动 MCP 的核心。
    *   *实现流程*：
        1.  `spawn` 启动 12306 脚本进程。
        2.  `stdin.write` 发送 JSON 请求。
        3.  监听 `stdout.on('data')` 事件，像接水管一样一点点接收返回的数据。
        4.  监听 `close` 事件，数据接完了，关闭水龙头，把结果给 AI。

### 6.2 MySQL (数据库持久化流程)
数据在后端是如何“活”下来的？
1.  **连接池 (Pool)**：后端启动时，先跟数据库建立一堆“长连接”，用的时候直接拿，不用每次都重新登录数据库，提高性能。
2.  **SQL 执行**：后端拼好指令（如 `INSERT INTO ai_messages ...`），通过连接池发给 MySQL。
3.  **ORM/查询构建器**：本项目使用了 `mysql2` 驱动，直接书写原生的 SQL 语句，这对于理解数据库底层逻辑非常有帮助。

### 6.3 原生 MCP 架构实现细节 (技术深水区)

原生 MCP 架构的重构是本项目的最高技术亮点，它让 AI 助手从“手动调用接口”进化到了“协议驱动自动化”。

#### 1. 自动发现机制 (Discovery) - McpServerManager 的核心逻辑
`McpServerManager` 是整个 MCP 架构的“指挥官”，它通过以下逻辑实现工具的自动识别：

*   **启动与握手**：当系统启动或注册新 Server 时，管理器会通过 `child_process.spawn` 启动工具进程（如 `node index.js`）。
*   **发送 Discovery 请求**：管理器向工具进程发送“你是谁？你能干什么？”的询问。
    *   *代码逐行解析*：
        ```javascript
        // 1. 准备一个符合 MCP 协议标准的 JSON 请求对象
        const request = {
          jsonrpc: "2.0",      // 协议版本
          id: "discovery",     // 给这次询问起个名字叫“发现”
          method: "tools/list",// 核心指令：请列出你所有的工具
          params: {}           // 额外参数（目前为空）
        };

        // 2. 将对象转成字符串，通过 stdin（标准输入）塞进工具进程的“耳朵”里
        child.stdin.write(JSON.stringify(request) + '\n');
        
        // 3. 告诉工具进程：我说完了，你可以开始处理并回答我了
        child.stdin.end();
        ```
*   **解析工具定义**：MCP Server 收到请求后，会从其 `stdout`（标准输出）返回它所拥有的所有工具列表。
    *   *代码逐行解析*：
        ```javascript
        // 1. 监听 stdout 的 data 事件，就像接水管一样，把工具吐出来的字符一点点存进 stdout 变量里
        child.stdout.on('data', (data) => stdout += data.toString());

        // 2. 当工具进程关闭时（表示它说完了），开始处理拿到的全部数据
        child.on('close', (code) => {
          // 3. 使用正则表达式，从一大堆输出信息中精准找出那一串 { ... } 格式的 JSON 数据
          const jsonMatch = stdout.match(/\{.*\}/s);
          
          // 4. 将字符串转回成 JavaScript 对象，AI 就能读懂里面的工具名和参数要求了
          const response = JSON.parse(jsonMatch[0]);
          resolve(response.result?.tools || []); // 返回最终的工具列表
        });
        ```
    *   `description`：工具的功能描述（AI 靠这个来判断什么时候用它）。
    *   `inputSchema`：参数要求（基于 **JSON Schema** 规范，定义了哪些参数是必填的，类型是什么）。
*   **内存映射与转换**：管理器将这些原始定义存入内部的 `Map` 对象，并实时将其转换为 OpenAI 要求的 `tools` 数组格式。这意味着后端**完全不需要预先知道**工具有哪些，一切都是在运行时动态“问”出来的。
*   **即插即用**：只要 clone 下一个符合 MCP 协议的项目（如 12306 或搜索工具），在配置里填上路径，AI 就能立刻学会它的所有功能。

#### 2. 模型自主循环 (Model-in-the-loop)
*   **原生 Tool Calling**：我们直接利用了千问大模型的 `tool_calls` 能力。
*   **多轮交互流程**：
    1.  **AI 思考**：AI 发现要完成任务需要工具，返回“我要调用 A 工具”。
    2.  **后端执行**：后端拦截到指令，通过子进程运行工具，拿到原始数据。
    3.  **结果反馈**：后端将数据作为 `role: tool` 的消息传回给 AI。
    4.  **AI 决策**：AI 看到结果后，自主决定是“继续调用 B 工具”还是“结束并总结”。
*   **优势**：这种方式比手动写 `if/else` 循环要聪明得多，AI 能处理非常复杂的逻辑依赖。

#### 3. 跨语言通信 (stdio & JSON-RPC)
*   **标准协议**：后端（Node.js）与工具（可能是 Python 或 TS）之间通过 **stdio (标准输入输出)** 通信。
*   **JSON-RPC**：这是一种轻量级的远程调用协议。后端把请求包装成 JSON 发给工具，工具处理完把 JSON 吐回来。这保证了无论工具是用什么语言写的，都能完美接入。

### 6.4 开发一个 MCP 工具的基本步骤 (以 12306 为例)

开发一个 MCP 工具不需要写复杂的网络接口，核心只需三步，就能让它与我们的后端 Host 完美衔接：

#### Step 1: 定义工具“大脑” (逻辑实现)
在工具的代码中（如 `12306-mcp/src/index.ts`），使用 MCP SDK 注册功能。
*   **关键代码**：
    ```typescript
    server.tool(
      "get-tickets", // 工具名
      "查询余票信息", // 描述（AI 靠这个识别意图）
      { from: z.string(), to: z.string(), date: z.string() }, // 参数要求 (Schema)
      async ({ from, to, date }) => {
        // 这里写真正的爬虫或 API 调用逻辑
        return { content: [{ type: "text", text: "结果数据..." }] };
      }
    );
    ```

#### Step 2: 开启工具“耳朵”与“嘴巴” (传输层)
告诉工具如何接收指令。最标准的方式是使用 **stdio**（标准输入输出）。
*   **关键代码**：
    ```typescript
    const transport = new StdioServerTransport(); // 开启监听  mcp API
    await server.connect(transport); // 把大脑和耳朵连起来 mcp API
    ```
    *这行代码运行后，工具就会死循环盯着 `process.stdin`，等待后端发来的 JSON 指令。*

#### Step 3: 在后端 Host 中“插上”工具 (集成使用)
回到我们的后端 `chatOrchestrator.js`，只需要一行配置：
*   **关键代码**：
    ```javascript
    await mcpManager.registerServer('12306-server', {
      command: 'node',
      args: ['C:/path/to/12306-mcp/build/index.js']
    });
    ```

### 总结：整个流程是如何串联的？
1.  **启动阶段**：后端启动，执行 `registerServer`。
2.  **握手阶段**：后端发送 `tools/list` -> 工具通过 `StdioServerTransport` 听到 -> 返回工具清单（含 `get-tickets`）。
3.  **任务执行**：用户想查票 -> AI 识别出 `get-tickets` -> 后端发送 `tools/call` -> 工具执行逻辑并打印结果到 `stdout` -> 后端接住结果给 AI -> AI 总结回答。

---
*注：本项目总结适用于简历中的“项目经历”描述，重点突出了 AI 工程化能力和架构设计思想。*
