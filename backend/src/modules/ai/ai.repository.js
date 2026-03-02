const pool = require("../../db");

/**
 * Log AI commands for auditing and debugging
 */
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

/**
 * Create a new AI session/conversation
 */
async function createConversation(id, userId, title, model) {
  try {
    await pool.execute(
      "INSERT INTO ai_conversations (id, user_id, title, model) VALUES (?, ?, ?, ?)",
      [id, userId, title, model]
    );
  } catch (err) {
    console.error("Failed to create conversation:", err);
    throw err;
  }
}

/**
 * Save a message within a conversation
 */
async function saveMessage(conversationId, role, content) {
  try {
    await pool.execute(
      "INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, ?, ?)",
      [conversationId, role, content]
    );
  } catch (err) {
    console.error("Failed to save message:", err);
    throw err;
  }
}

/**
 * Update conversation title
 */
async function updateConversationTitle(id, title) {
  try {
    await pool.execute(
      "UPDATE ai_conversations SET title = ? WHERE id = ?",
      [title, id]
    );
  } catch (err) {
    console.error("Failed to update conversation title:", err);
  }
}

/**
 * Get conversation history (all messages)
 */
async function getConversationHistory(userId, conversationId) {
  try {
    const [rows] = await pool.execute(
      `SELECT m.role, m.content, m.created_at 
       FROM ai_messages m
       JOIN ai_conversations c ON m.conversation_id = c.id
       WHERE c.user_id = ? AND c.id = ? 
       ORDER BY m.created_at ASC`,
      [userId, conversationId]
    );
    return rows;
  } catch (err) {
    console.error("Failed to get conversation history:", err);
    return [];
  }
}

/**
 * List user's conversations
 */
async function getConversations(userId, limit = 20, offset = 0) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, title, model, created_at, updated_at 
       FROM ai_conversations 
       WHERE user_id = ? 
       ORDER BY updated_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return rows;
  } catch (err) {
    console.error("Failed to get conversations:", err);
    return [];
  }
}

/**
 * Delete a conversation (cascades to messages due to DB constraints)
 */
async function deleteConversation(userId, conversationId) {
  try {
    await pool.execute(
      "DELETE FROM ai_conversations WHERE user_id = ? AND id = ?",
      [userId, conversationId]
    );
  } catch (err) {
    console.error("Failed to delete conversation:", err);
    throw err;
  }
}

/**
 * Check if conversation exists for user
 */
async function getConversation(userId, conversationId) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM ai_conversations WHERE user_id = ? AND id = ?",
      [userId, conversationId]
    );
    return rows[0] || null;
  } catch (err) {
    console.error("Failed to get conversation:", err);
    return null;
  }
}

module.exports = {
  logCommand,
  createConversation,
  saveMessage,
  updateConversationTitle,
  getConversationHistory,
  getConversations,
  deleteConversation,
  getConversation,
};
