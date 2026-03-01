const service = require("./ai.service");

async function generateTasks(req, res, next) {
  try {
    const { text } = req.body;
    if (!text) throw new Error("请输入指令");
    const tasks = await service.generateTasks(text);
    
    // Log AI command
    try {
      const repository = require("./ai.repository");
      await repository.logCommand(req.auth.id, text, tasks, "generate_task");
    } catch (logError) {
      console.error("AI Logging error:", logError);
    }

    res.json({ code: "OK", data: tasks });
  } catch (error) {
    next(error);
  }
}

async function executeCommand(req, res, next) {
  try {
    const { text, currentTodos } = req.body;
    const result = await service.executeBatchCommand(text, currentTodos);
    
    // Log AI command
    try {
      const repository = require("./ai.repository");
      await repository.logCommand(req.auth.id, text, result, "batch_update");
    } catch (logError) {
      console.error("AI Logging error:", logError);
    }

    res.json({ code: "OK", data: result });
  } catch (error) {
    next(error);
  }
}

async function chat(req, res, next) {
  try {
    const { text, conversationHistory = [] } = req.body;
    if (!text) throw new Error("请输入内容");
    
    const reply = await service.chat(text, conversationHistory);
    
    // Log chat message
    try {
      const repository = require("./ai.repository");
      await repository.logCommand(req.auth.id, text, { reply }, "chat");
    } catch (logError) {
      console.error("AI Logging error:", logError);
    }

    res.json({ code: "OK", data: { reply } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateTasks,
  executeCommand,
  chat,
};
