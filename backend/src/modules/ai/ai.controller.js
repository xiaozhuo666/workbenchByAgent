const service = require("./ai.service");
const repository = require("./ai.repository");
const { v4: uuidv4 } = require("uuid");

async function generateTasks(req, res, next) {
  try {
    const { text } = req.body;
    if (!text) throw new Error("请输入指令");
    const tasks = await service.generateTasks(text);
    
    try {
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
    
    try {
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
    const { text, conversationId, conversationHistory = [] } = req.body;
    if (!text) throw new Error("请输入内容");
    
    const cid = conversationId || uuidv4();
    
    try {
      await repository.saveMessage(req.auth.id, cid, "user", text);
    } catch (saveError) {
      console.error("Failed to save user message:", saveError);
    }
    
    const reply = await service.chat(text, conversationHistory);
    
    try {
      await repository.saveMessage(req.auth.id, cid, "assistant", reply);
      await repository.logCommand(req.auth.id, text, { reply }, "chat");
    } catch (logError) {
      console.error("AI Logging error:", logError);
    }

    res.json({ code: "OK", data: { reply, conversationId: cid } });
  } catch (error) {
    next(error);
  }
}

async function getConversationHistory(req, res, next) {
  try {
    const { conversationId } = req.params;
    const { limit = 20 } = req.query;

    const history = await repository.getConversationHistory(
      req.auth.id,
      conversationId,
      parseInt(limit)
    );

    res.json({ code: "OK", data: history });
  } catch (error) {
    next(error);
  }
}

async function listConversations(req, res, next) {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const conversations = await repository.getConversations(
      req.auth.id,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({ code: "OK", data: conversations });
  } catch (error) {
    next(error);
  }
}

async function deleteConversation(req, res, next) {
  try {
    const { conversationId } = req.params;

    await repository.deleteConversation(req.auth.id, conversationId);

    res.json({ code: "OK", data: { message: "对话已删除" } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateTasks,
  executeCommand,
  chat,
  getConversationHistory,
  listConversations,
  deleteConversation,
};
