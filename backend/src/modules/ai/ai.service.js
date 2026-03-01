const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

async function generateTodos(text) {
  const response = await openai.chat.completions.create({
    model: "qwen-plus",
    messages: [
      {
        role: "system",
        content: `你是一个专业的任务管理助手。请将用户输入的自然语言转化为待办事项列表。
        要求：
        1. 仅返回 JSON 数组格式，不要包含任何解释或 Markdown 代码块标识。
        2. 数组中的每个对象应包含: "title" (必填, 标题), "description" (选填, 详细描述)。
        3. 如果用户没有明确的任务，返回空数组 []。
        
        示例输入："帮我安排明天下午两点开会，三点写文档"
        示例输出：[{"title": "下午两点开会", "description": ""}, {"title": "三点写文档", "description": ""}]`
      },
      { role: "user", content: text }
    ],
    response_format: { type: "json_object" } // DashScope might not support this exactly but qwen-plus handles JSON prompt well
  });

  const content = response.choices[0].message.content;
  try {
    // Sometimes models return Markdown even if asked not to
    const jsonStr = content.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonStr);
    return Array.isArray(data) ? data : (data.todos || []);
  } catch (error) {
    console.error("AI Parsing Error:", error, content);
    throw new Error("AI 助手解析指令失败，请重试");
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
           - "updates": 数组，每个对象包含 "id" (任务 ID) 和 "status" ('pending' 或 'completed')。
           - "summary": 字符串，简述你准备执行的操作。
        2. 仅识别用户明确要求更改的任务。
        3. 如果用户指令不是为了更新现有状态（例如是想新建任务），则返回 {"updates": [], "summary": "不是更新指令"}。
        4. 不要包含任何解释或 Markdown 代码块标识。`
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

module.exports = {
  generateTodos,
  executeBatchCommand,
};
