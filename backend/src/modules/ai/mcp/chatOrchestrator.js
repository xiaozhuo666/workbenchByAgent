const env = require("../../../config/env");
const repository = require("../ai.repository");
const mcpManager = require("./mcpServerManager");
const OpenAI = require("openai");
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

/**
 * 核心重构：原生 MCP 编排器
 * 1. 自动发现所有 MCP Server 的工具
 * 2. 对接 OpenAI 原生 tool_calls
 * 3. 自动处理多轮调用 (Model-in-the-loop)
 */
async function runChatLoop({ text, conversationHistory = [], conversationId, userId }) {
  // --- 1. 动态工具发现 (仅在启动或配置变更时执行，此处简化为每次请求检查) ---
  const projectRoot = path.resolve(process.cwd());
  const actualRoot = projectRoot.endsWith('backend') ? path.dirname(projectRoot) : projectRoot;

  // 注册 12306 Server
  await mcpManager.registerServer('12306-server', {
    command: 'node',
    args: [path.join(actualRoot, 'MCP-Tools', '12306-mcp', 'build', 'index.js')],
    env: {}
  });

  // 注册 WebSearch Server
  await mcpManager.registerServer('web-search-server', {
    command: 'node',
    args: [path.join(actualRoot, 'MCP-Tools', 'open-webSearch', 'build', 'index.js')],
    env: { MODE: 'stdio', DEFAULT_SEARCH_ENGINE: 'baidu' }
  });

  // --- 2. 准备对话上下文 ---
  const messages = [
    { 
      role: "system", 
      content: `你是一个全能的生活助手。你拥有强大的工具调用能力。
今天的日期是 2026-03-04。
请根据用户的问题，决定是否需要调用工具。如果需要，请直接调用。
你可以进行多步调用，例如：先查站码，再查余票。
当所有工具结果都拿到后，请为用户整理出一份美观的最终回答。` 
    },
    ...conversationHistory,
    { role: "user", content: text }
  ];

  let totalCalls = 0;
  let successCalls = 0;
  let failedCalls = 0;

  // --- 3. 核心循环：让模型自主控制工具链 ---
  const maxRounds = 5; // 最多允许 5 轮交互
  for (let i = 0; i < maxRounds; i++) {
    const availableTools = mcpManager.getOpenAiTools();
    
    const response = await openai.chat.completions.create({
      model: "qwen-plus",
      messages: messages,
      tools: availableTools.length > 0 ? availableTools : undefined,
      tool_choice: "auto",
    });

    const message = response.choices[0].message;
    messages.push(message);

    // 如果模型不需要调用工具，则跳出循环
    if (!message.tool_calls || message.tool_calls.length === 0) {
      break;
    }

    // 处理模型发起的工具调用
    for (const toolCall of message.tool_calls) {
      totalCalls += 1;
      const toolName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      console.log(`[Orchestrator] Model calling tool: ${toolName}`, args);

      try {
        const result = await mcpManager.callTool(toolName, args);
        successCalls += 1;
        
        // 将工具结果反馈给模型
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });

        // 记录日志
        await repository.logToolExecution({
          conversationId,
          userId,
          roundIndex: i + 1,
          toolName,
          argsSummary: toolCall.function.arguments,
          status: 'SUCCESS',
          durationMs: 0,
          errorMessage: null,
        });
      } catch (error) {
        failedCalls += 1;
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: `Error: ${error.message}`
        });
      }
    }
  }

  const finalReply = messages[messages.length - 1].content;

  // 记录 Trace
  await repository.logToolTrace({
    conversationId,
    totalCalls,
    successCalls,
    failedCalls,
    fallbackTriggered: failedCalls > 0,
    finalResponseType: totalCalls > 0 ? "tool_enhanced" : "model_only",
  });

  return {
    reply: finalReply,
    finalResponseType: totalCalls > 0 ? "tool_enhanced" : "model_only",
    fallbackTriggered: failedCalls > 0,
  };
}

module.exports = {
  runChatLoop,
};
