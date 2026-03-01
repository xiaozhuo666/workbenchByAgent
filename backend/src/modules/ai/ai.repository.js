const pool = require("../../db");

async function logCommand(userId, rawText, parsedJson, commandType) {
  try {
    await pool.execute(
      "INSERT INTO ai_command_logs (user_id, raw_text, parsed_json, command_type) VALUES (?, ?, ?, ?)",
      [userId || null, rawText || null, JSON.stringify(parsedJson) || null, commandType || "generate_task"]
    );
  } catch (err) {
    console.error("Failed to log AI command:", err);
  }
}

async function saveMessage(userId, conversationId, role, content) {
  try {
    await pool.execute(
      "INSERT INTO ai_conversations (user_id, conversation_id, role, content) VALUES (?, ?, ?, ?)",
      [userId, conversationId, role, content]
    );
  } catch (err) {
    console.error("Failed to save conversation message:", err);
    throw err;
  }
}

async function getConversationHistory(userId, conversationId, limit = 20) {
  try {
    const [rows] = await pool.execute(
      `SELECT role, content, created_at FROM ai_conversations 
       WHERE user_id = ? AND conversation_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, conversationId, limit]
    );
    return rows.reverse();
  } catch (err) {
    console.error("Failed to get conversation history:", err);
    return [];
  }
}

async function getConversations(userId, limit = 10, offset = 0) {
  try {
    const [rows] = await pool.execute(
      `SELECT DISTINCT conversation_id, MAX(created_at) as last_message_at
       FROM ai_conversations 
       WHERE user_id = ? 
       GROUP BY conversation_id 
       ORDER BY last_message_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return rows;
  } catch (err) {
    console.error("Failed to get conversations:", err);
    return [];
  }
}

async function deleteConversation(userId, conversationId) {
  try {
    await pool.execute(
      "DELETE FROM ai_conversations WHERE user_id = ? AND conversation_id = ?",
      [userId, conversationId]
    );
  } catch (err) {
    console.error("Failed to delete conversation:", err);
    throw err;
  }
}

module.exports = {
  logCommand,
  saveMessage,
  getConversationHistory,
  getConversations,
  deleteConversation,
};
