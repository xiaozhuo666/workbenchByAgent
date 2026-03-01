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

module.exports = {
  logCommand,
};
