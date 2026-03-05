const OpenAI = require("openai");
const dayjs = require("dayjs");
const env = require("../../config/env");
const chatOrchestrator = require("./mcp/chatOrchestrator");
const toolRegistry = require("./mcp/toolRegistry");

const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

async function generateTasks(text, conversationHistory = []) {
  const filteredHistory = [...conversationHistory];
  if (filteredHistory.length > 0 && 
      filteredHistory[filteredHistory.length - 1].role === "user" && 
      filteredHistory[filteredHistory.length - 1].content === text) {
    filteredHistory.pop();
  }

  const response = await openai.chat.completions.create({
    model: "qwen-plus",
    messages: [
      {
        role: "system",
        content: `你是一个专业的任务管理助手。
        【核心任务】：仅在用户“当前”输入中包含明确的“待办事项”或“日程安排”时进行解析。
        【严禁脑补】：如果用户在聊天、问技术问题、或进行日常对话，请务必返回 {"tasks": []}。
        【上下文使用】：历史记录仅用于辅助理解代词（如“把它也加上”中的“它”），不要被历史记录干扰当前的意图判断。
        
        要求：
        1. 返回 JSON 对象，包含 "tasks" 数组。
        2. 每个任务对象包含: "type" ("todo"|"schedule"), "title", "description", "startTime", "endTime"。
        3. 当前时间: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}。
        4. 必须返回纯 JSON，不要包含任何解释。`
      },
      ...filteredHistory.slice(-3), 
      { role: "user", content: text }
    ]
  });

  const content = response.choices[0].message.content;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];
    
    const data = JSON.parse(jsonMatch[0]);
    return data.tasks || [];
  } catch (error) {
    return [];
  }
}

async function executeBatchCommand(text, todos, conversationHistory = []) {
  const filteredHistory = [...conversationHistory];
  if (filteredHistory.length > 0 && 
      filteredHistory[filteredHistory.length - 1].role === "user" && 
      filteredHistory[filteredHistory.length - 1].content === text) {
    filteredHistory.pop();
  }

  const response = await openai.chat.completions.create({
    model: "qwen-plus",
    messages: [
      {
        role: "system",
        content: `你是一个待办列表操作专家。
        【现有任务列表】: ${JSON.stringify(todos)}
        【核心任务】：仅当用户“当前”输入明确要求修改、删除或完成上述列表中的任务时，才生成操作指令。
        【拒绝无关请求】：如果用户当前输入是问问题、写代码、聊天，或者与任务列表无关，必须返回 {"updates": [], "summary": "不是操作指令"}。
        【严格匹配】：不要因为历史记录中包含之前的操作就重复执行。
        
        要求：
        1. 返回 JSON：{"updates": [{"id":..., "status":...}], "summary": "..."}。
        2. status 的取值范围【必须】是且仅限: "pending", "completed", "delete"。
        3. 如果用户要求“删除”、“清空”、“移除”任务，status 必须设为 "delete"。
        4. 不要包含任何解释。`
      },
      ...filteredHistory.slice(-3), 
      { role: "user", content: text }
    ]
  });

  const content = response.choices[0].message.content;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { updates: [], summary: "不是操作指令" };
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    return { updates: [], summary: "不是操作指令" };
  }
}

/**
 * Chat with AI (supports streaming)
 */
async function chat({ text, conversationHistory = [], model = "qwen-plus", stream = false }) {
  const filteredHistory = [...conversationHistory];
  if (filteredHistory.length > 0 && 
      filteredHistory[filteredHistory.length - 1].role === "user" && 
      filteredHistory[filteredHistory.length - 1].content === text) {
    filteredHistory.pop();
  }

  const messages = [
    {
      role: "system",
      content: `你是一个友好、聪慧的AI助手。用户可以与你进行自由对话。
      
      你的功能包括：
      1. 回答各种问题（知识、建议、创意等）
      2. 帮助制定计划和决策
      3. 提供工作和生活相关的建议
      4. 进行头脑风暴和创意讨论
      
      注意：
      - 保持对话自然流畅，友好且专业
      - 如果用户想创建任务或日程，可以建议他们使用任务创建功能
      - 回答要简洁明了，避免过长
      - 使用中文回答`
    },
    ...filteredHistory,
    { role: "user", content: text }
  ];

  if (stream) {
    return await openai.chat.completions.create({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500,
      stream: true,
    });
  } else {
    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500
    });
    return response.choices[0].message.content;
  }
}

async function chatWithMcp({ text, conversationHistory = [], model = "qwen-plus", stream = false, conversationId, userId }) {
  // 注意：在原生 MCP 架构下，chatOrchestrator 内部会处理 baseReply 和多轮调用
  // 暂时不支持流式 MCP 回复（因为需要多轮交互汇总），如果是流式请求则退回到普通对话
  if (!env.mcp.enabled || stream) {
    const baseReply = await chat({ text, conversationHistory, model, stream });
    return { reply: baseReply, finalResponseType: "model_only", fallbackTriggered: false };
  }
  
  return chatOrchestrator.runChatLoop({
    text,
    conversationHistory, // 传入历史记录，让 AI 更有上下文
    conversationId,
    userId,
  });
}

async function listMcpTools() {
  return toolRegistry.listTools();
}

async function updateMcpToolToggle({ toolName, enabled, operatorId, reason }) {
  await toolRegistry.updateToolToggle({
    toolName,
    enabled,
    operatorId,
    reason,
  });
  return toolRegistry.getTool(toolName);
}

function parseTicketDraft(text) {
  const input = String(text || "").trim();
  const matched = input.match(/(?:查|看).*(?:从)?([\u4e00-\u9fa5]{2,8})到([\u4e00-\u9fa5]{2,8}).*(今天|明天|后天|\d{4}-\d{2}-\d{2})/);
  if (!matched) return null;

  const fromCity = matched[1];
  const toCity = matched[2];
  let date = matched[3];
  const now = dayjs();
  if (date === "今天") date = now.format("YYYY-MM-DD");
  if (date === "明天") date = now.add(1, "day").format("YYYY-MM-DD");
  if (date === "后天") date = now.add(2, "day").format("YYYY-MM-DD");

  const trainTypes = /高铁|动车/.test(input) ? ["G", "D"] : [];
  return {
    route: {
      fromCity,
      toCity,
    },
    date,
    preferences: {
      trainTypes,
      departureTimeRange: "",
      seatTypes: [],
      strategy: "fastest",
    },
  };
}

/**
 * Summarize conversation to generate a title
 */
async function generateTitle(messages) {
  try {
    const response = await openai.chat.completions.create({
      model: "qwen-plus",
      messages: [
        {
          role: "system",
          content: "你是一个专业的总结助手。请根据用户的对话内容，生成一个简短、精准的标题（不超过 15 个字）。仅返回标题文本，不要包含任何多余的词汇或 Markdown 代码块标识。"
        },
        ...messages.slice(-2), // Take the last message or a small context
        { role: "user", content: "请为这段对话起一个简洁明了的标题。" }
      ],
      max_tokens: 50
    });
    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error("Failed to generate title:", err);
    return "新会话";
  }
}

module.exports = {
  generateTasks,
  executeBatchCommand,
  chat,
  chatWithMcp,
  generateTitle,
  listMcpTools,
  updateMcpToolToggle,
  parseTicketDraft,
};
