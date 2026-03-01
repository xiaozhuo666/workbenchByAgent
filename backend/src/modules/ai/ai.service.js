const OpenAI = require("openai");
const dayjs = require("dayjs");

const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

async function generateTasks(text) {
  const response = await openai.chat.completions.create({
    model: "qwen-plus",
    messages: [
      {
        role: "system",
        content: `你是一个专业的任务管理助手。请将用户输入的自然语言转化为待办事项或日程。
        要求：
        1. 仅返回 JSON 对象，包含一个 "tasks" 数组。
        2. 每个任务对象包含: 
           - "type": "todo" 或 "schedule"
           - "title": 标题
           - "description": 描述 (可选)
           - "startTime": 对于 schedule 是必填的 (格式: YYYY-MM-DD HH:mm:ss)
           - "endTime": 对于 schedule 是可选的 (格式: YYYY-MM-DD HH:mm:ss)
        3. 如果没有明确的时间，默认为 "todo"。如果有具体时间点或时间段，设为 "schedule"。
        4. 当前时间是: ${dayjs().format("YYYY-MM-DD HH:mm:ss")} (星期${['日','一','二','三','四','五','六'][dayjs().day()]})。
        5. 请特别注意：
           - 如果用户提到“明天”、“下周”等相对时间，请根据当前时间计算出正确的绝对日期。
           - 如果用户只提到了时间点（如“10点”），且该时间在今天已过去，请默认设为“明天”。
           - 如果用户说“周五”，请根据当前日期找到接下来的那个周五的日期。
        6. 不要包含任何解释或 Markdown 代码块标识。`
      },
      { role: "user", content: text }
    ]
  });

  const content = response.choices[0].message.content;
  try {
    const jsonStr = content.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonStr);
    return data.tasks || [];
  } catch (error) {
    console.error("AI Parsing Error:", error, content);
    throw new Error("AI 助手解析任务失败");
  }
}

async function executeBatchCommand(text, todos) {
  const response = await openai.chat.completions.create({
    model: "qwen-plus",
    messages: [
      {
        role: "system",
        content: `你是一个专业的任务管理助手。请根据用户的自然语言指令，从现有的待办列表中识别出需要操作的任务及其新状态。
        
        现有任务列表 (JSON): ${JSON.stringify(todos)}
        
        要求：
        1. 仅返回 JSON 对象，包含: 
           - "updates": 数组，每个对象包含 "id" (任务 ID) 和 "status" ('pending', 'completed' 或 'delete')。
           - "summary": 字符串，简述你准备执行的操作。
        2. 仅识别用户明确要求更改的任务。
        3. 如果用户提及“删除”、“移除”、“去掉”某些任务，请将 status 设为 'delete'。
        4. 如果用户指令不是为了更新或删除现有状态（例如是想新建任务），则返回 {"updates": [], "summary": "不是操作指令"}。
        5. 不要包含任何解释或 Markdown 代码块标识。`
      },
      { role: "user", content: text }
    ]
  });

  const content = response.choices[0].message.content;
  try {
    const jsonStr = content.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Command Parsing Error:", error, content);
    throw new Error("无法解析您的批量操作指令");
  }
}

async function chat(text, conversationHistory = []) {
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
    ...conversationHistory,
    { role: "user", content: text }
  ];

  const response = await openai.chat.completions.create({
    model: "qwen-plus",
    messages: messages,
    temperature: 0.7,
    max_tokens: 1000
  });

  return response.choices[0].message.content;
}

module.exports = {
  generateTasks,
  executeBatchCommand,
  chat,
};
