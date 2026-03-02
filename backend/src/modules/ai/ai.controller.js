const service = require("./ai.service");
const repository = require("./ai.repository");
const { v4: uuidv4 } = require("uuid");

async function ensureConversation(userId, conversationId, firstText, model) {
  let cid = conversationId;
  let isNew = false;
  
  console.log(`Ensuring conversation: userId=${userId}, cid=${cid}, model=${model}`);
  
  if (!cid) {
    cid = uuidv4();
    isNew = true;
    const initialTitle = firstText.slice(0, 15) + "...";
    console.log(`Creating new conversation: ${cid}, title: ${initialTitle}`);
    await repository.createConversation(cid, userId, initialTitle, model);
  } else {
    const conversation = await repository.getConversation(userId, cid);
    if (!conversation) {
      cid = uuidv4();
      isNew = true;
      console.log(`Existing conversation not found or not owned by user, creating new one: ${cid}`);
      await repository.createConversation(cid, userId, firstText.slice(0, 15) + "...", model);
    } else {
      console.log(`Found existing conversation: ${cid}`);
    }
  }
  return { cid, isNew };
}

async function generateTasks(req, res, next) {
  try {
    const { text, conversationId, model = "qwen-plus" } = req.body;
    if (!text) throw new Error("请输入指令");
    
    // 1. Ensure conversation exists
    const { cid, isNew } = await ensureConversation(req.auth.id, conversationId, text, model);
    
    // 2. Get history to avoid duplicate saving and provide context
    const history = await repository.getConversationHistory(req.auth.id, cid);
    const lastMsg = history[history.length - 1];
    
    // Only save user message if it's not already the last message (avoid duplicates from frontend sequential calls)
    if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== text) {
      await repository.saveMessage(cid, "user", text);
    }

    const messages = history.map(h => ({ role: h.role, content: h.content }));

    // 3. Generate tasks with history context
    const tasks = await service.generateTasks(text, messages);
    
    // 4. If tasks found, save assistant message and log
    if (tasks.length > 0) {
      const reply = `我已为你解析出 ${tasks.length} 个任务，是否保存？`;
      await repository.saveMessage(cid, "assistant", reply);

      try {
        await repository.logCommand(req.auth.id, text, tasks, "generate_todo");
      } catch (logError) {
        console.error("AI Logging error:", logError);
      }
    }

    res.json({ 
      code: "OK", 
      data: { 
        tasks, 
        conversationId: cid,
        isNew 
      } 
    });
  } catch (error) {
    next(error);
  }
}

async function executeCommand(req, res, next) {
  try {
    const { text, currentTodos, conversationId, model = "qwen-plus" } = req.body;
    
    // 1. Ensure conversation exists
    const { cid, isNew } = await ensureConversation(req.auth.id, conversationId, text, model);
    
    // 2. Get history
    const history = await repository.getConversationHistory(req.auth.id, cid);
    const lastMsg = history[history.length - 1];
    
    // Only save user message if it's not already the last message
    if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== text) {
      await repository.saveMessage(cid, "user", text);
    }

    const messages = history.map(h => ({ role: h.role, content: h.content }));

    // 3. Execute command with history context
    const result = await service.executeBatchCommand(text, currentTodos, messages);
    
    // 4. If updates found, save assistant message and log
    if (result.updates && result.updates.length > 0) {
      await repository.saveMessage(cid, "assistant", result.summary || "操作已完成");

      try {
        await repository.logCommand(req.auth.id, text, result, "batch_update");
      } catch (logError) {
        console.error("AI Logging error:", logError);
      }
    }

    res.json({ 
      code: "OK", 
      data: { 
        ...result, 
        conversationId: cid,
        isNew
      } 
    });
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
    
    if (!text) throw new Error("请输入内容");
    
    // 1. Ensure conversation and get history
    const { cid, isNew } = await ensureConversation(req.auth.id, conversationId, text, model);
    
    const history = await repository.getConversationHistory(req.auth.id, cid);
    const lastMsg = history[history.length - 1];
    
    // Only save user message if it's not already the last message
    if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== text) {
      await repository.saveMessage(cid, "user", text);
    }

    // Refresh history after potentially saving new message
    const finalHistory = await repository.getConversationHistory(req.auth.id, cid);
    const messages = finalHistory.map(h => ({ role: h.role, content: h.content }));

    // 3. Handle Streaming vs Single Reply
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const streamResponse = await service.chat({ 
        text, 
        conversationHistory: messages.slice(0, -1),
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

      // 4. Save Assistant Message after stream ends
      await repository.saveMessage(cid, "assistant", fullReply);
      
      // If it's a new conversation, generate a better title asynchronously
      if (isNew) {
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

      if (isNew) {
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
