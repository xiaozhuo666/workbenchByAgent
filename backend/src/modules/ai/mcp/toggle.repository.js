const pool = require("../../../db");

async function listToolToggles() {
  const [rows] = await pool.query(
    "SELECT tool_name AS toolName, enabled, updated_by AS updatedBy, updated_at AS updatedAt, reason FROM ai_mcp_tool_toggles ORDER BY tool_name ASC"
  );
  return rows;
}

async function getToolToggle(toolName) {
  const [rows] = await pool.query(
    "SELECT tool_name AS toolName, enabled, updated_by AS updatedBy, updated_at AS updatedAt, reason FROM ai_mcp_tool_toggles WHERE tool_name = ? LIMIT 1",
    [toolName]
  );
  return rows[0] || null;
}

async function upsertToolToggle({ toolName, enabled, updatedBy, reason = null }) {
  await pool.query(
    `INSERT INTO ai_mcp_tool_toggles (tool_name, enabled, updated_by, reason)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), updated_by = VALUES(updated_by), reason = VALUES(reason), updated_at = CURRENT_TIMESTAMP`,
    [toolName, enabled ? 1 : 0, updatedBy || null, reason]
  );
}

async function insertToggleAudit({ toolName, beforeEnabled, afterEnabled, operatorId }) {
  await pool.query(
    "INSERT INTO ai_mcp_toggle_audits (tool_name, before_enabled, after_enabled, operator_id) VALUES (?, ?, ?, ?)",
    [toolName, beforeEnabled ? 1 : 0, afterEnabled ? 1 : 0, operatorId || null]
  );
}

module.exports = {
  listToolToggles,
  getToolToggle,
  upsertToolToggle,
  insertToggleAudit,
};
