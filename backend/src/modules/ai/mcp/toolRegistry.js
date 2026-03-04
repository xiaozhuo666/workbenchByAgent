const { getMcpConfig } = require("../../../config/mcp");
const { TOOL_ERROR_CODES, ToolExecutionError } = require("./tool.errors");
const { buildDefaultTools } = require("./defaultTools");
const { normalizeWhitelist, isToolWhitelisted, isReadOnlyTool } = require("./whitelist");
const toggleRepository = require("./toggle.repository");

let cacheExpiresAt = 0;
let toggleCacheMap = new Map();

const toolMap = new Map();
buildDefaultTools().forEach((tool) => toolMap.set(tool.toolName, tool));

async function refreshToggleCacheIfNeeded() {
  const now = Date.now();
  const { toggleCacheTtlMs } = getMcpConfig();
  if (now < cacheExpiresAt) {
    return;
  }
  const rows = await toggleRepository.listToolToggles().catch(() => []);
  toggleCacheMap = new Map(rows.map((row) => [row.toolName, Boolean(row.enabled)]));
  cacheExpiresAt = now + Math.max(toggleCacheTtlMs, 500);
}

async function listTools() {
  await refreshToggleCacheIfNeeded();
  return Array.from(toolMap.values()).map((tool) => ({
    toolName: tool.toolName,
    displayName: tool.displayName,
    description: tool.description,
    riskLevel: tool.riskLevel,
    capabilityType: tool.capabilityType,
    enabled: toggleCacheMap.has(tool.toolName)
      ? toggleCacheMap.get(tool.toolName)
      : Boolean(tool.enabled),
  }));
}

async function getTool(toolName) {
  await refreshToggleCacheIfNeeded();
  const tool = toolMap.get(toolName);
  if (!tool) return null;
  return {
    ...tool,
    enabled: toggleCacheMap.has(toolName) ? toggleCacheMap.get(toolName) : Boolean(tool.enabled),
  };
}

async function assertToolAllowed(toolName) {
  const tool = await getTool(toolName);
  if (!tool) {
    throw new ToolExecutionError(TOOL_ERROR_CODES.TOOL_NOT_FOUND, "工具不存在");
  }
  const whitelist = normalizeWhitelist(getMcpConfig().toolWhitelist);
  if (!isToolWhitelisted(toolName, whitelist)) {
    throw new ToolExecutionError(TOOL_ERROR_CODES.TOOL_NOT_ALLOWED, "工具不在白名单");
  }
  if (!tool.enabled) {
    throw new ToolExecutionError(TOOL_ERROR_CODES.TOOL_DISABLED, "工具已关闭");
  }
  if (!isReadOnlyTool(tool)) {
    throw new ToolExecutionError(TOOL_ERROR_CODES.TOOL_NOT_ALLOWED, "仅允许只读工具");
  }
  return tool;
}

async function updateToolToggle({ toolName, enabled, operatorId, reason }) {
  const tool = toolMap.get(toolName);
  if (!tool) {
    throw new ToolExecutionError(TOOL_ERROR_CODES.TOOL_NOT_FOUND, "工具不存在");
  }
  const currentEnabled = toggleCacheMap.has(toolName)
    ? toggleCacheMap.get(toolName)
    : Boolean(tool.enabled);
  await toggleRepository.upsertToolToggle({
    toolName,
    enabled,
    updatedBy: operatorId,
    reason,
  });
  await toggleRepository.insertToggleAudit({
    toolName,
    beforeEnabled: currentEnabled,
    afterEnabled: enabled,
    operatorId,
  });
  cacheExpiresAt = 0;
}

module.exports = {
  listTools,
  getTool,
  assertToolAllowed,
  updateToolToggle,
};
