const service = require("./ai.service");
const repository = require("./ai.repository");
const { v4: uuidv4 } = require("uuid");

async function generateTasks(req, res, next) {
  try {
    const { text } = req.body;
    if (!text) throw new Error("请输入指令");
    const tasks = await service.generateTasks(text);
    
    try {
      await repository.logCommand(req.auth.id, text, tasks, "generate_todo");
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

/**
 * Chat with AI (supports sessions and streaming)
 */
async function chat(req, res, next) {
  try {
    const { text, conversationId, model = "qwen-plus", stream = false } = req.body;
    
    // Log for debugging
    console.log("Chat Request Body:", { textLength: text?.length, conversationId, model, stream, type: typeof stream });

    if (!text) throw new Error("请输入内容");
    
    let cid = conversationId;
    let isNewConversation = false;

    // 1. Resolve or Create Conversation
    if (!cid) {
      cid = uuidv4();
      isNewConversation = true;
      const initialTitle = text.slice(0, 15) + "..."; // Placeholder title
      await repository.createConversation(cid, req.auth.id, initialTitle, model);
    } else {
      // Verify conversation belongs to user
      const conversation = await repository.getConversation(req.auth.id, cid);
      if (!conversation) {
        throw new Error("会话不存在或无访问权限");
      }
    }

    // 2. Save User Message
    await repository.saveMessage(cid, "user", text);

    // 3. Get Full History for AI Context
    const history = await repository.getConversationHistory(req.auth.id, cid);
    const messages = history.map(h => ({ role: h.role, content: h.content }));

    // 4. Handle Streaming vs Single Reply
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const streamResponse = await service.chat({ 
        text, 
        conversationHistory: messages.slice(0, -1), // History before current user message
        model, 
        stream: true 
      });

      let fullReply = "";
      for await (const chunk of streamResponse) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullReply += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // 5. Save Assistant Message after stream ends
      await repository.saveMessage(cid, "assistant", fullReply);
      
      // If it's a new conversation, generate a better title asynchronously
      if (isNewConversation) {
        service.generateTitle([{ role: "user", content: text }, { role: "assistant", content: fullReply }])
          .then(title => repository.updateConversationTitle(cid, title))
          .catch(err => console.error("Async title generation failed:", err));
        
        res.write(`data: ${JSON.stringify({ conversationId: cid, title: "..." })}\n\n`);
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } else {
      const reply = await service.chat({ 
        text, 
        conversationHistory: messages.slice(0, -1),
        model, 
        stream: false 
      });

      await repository.saveMessage(cid, "assistant", reply);

      if (isNewConversation) {
        const title = await service.generateTitle([{ role: "user", content: text }, { role: "assistant", content: reply }]);
        await repository.updateConversationTitle(cid, title);
        res.json({ code: "OK", data: { reply, conversationId: cid, title } });
      } else {
        res.json({ code: "OK", data: { reply, conversationId: cid } });
      }
    }
  } catch (error) {
    next(error);
  }
}

async function getConversationHistory(req, res, next) {
  try {
    const { conversationId } = req.params;

    const history = await repository.getConversationHistory(
      req.auth.id,
      conversationId
    );

    res.json({ code: "OK", data: history });
  } catch (error) {
    next(error);
  }
}

async function listConversations(req, res, next) {
  try {
    const { limit = 20, offset = 0 } = req.query;

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
