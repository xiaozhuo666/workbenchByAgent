const { getMcpConfig } = require("../../../config/mcp");
const { TOOL_ERROR_CODES, ToolExecutionError } = require("./tool.errors");
const mcpManager = require("./mcpServerManager");
const { ensureCoreServersRegistered } = require("./serverBootstrap");
const { normalizeWhitelist, isToolWhitelisted } = require("./whitelist");
const toggleRepository = require("./toggle.repository");

let cacheExpiresAt = 0;
let toggleCacheMap = new Map();

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

/**
 * 获取所有可用工具（包含动态发现的 MCP 工具），带 serverName 便于前端按类分组
 */
async function listTools() {
  await ensureCoreServersRegistered();
  await refreshToggleCacheIfNeeded();
  const allTools = mcpManager.getToolsWithServer();
  
  return allTools.map((t) => {
    const toolName = t.name;
    const isEnabled = toggleCacheMap.has(toolName) ? toggleCacheMap.get(toolName) : true;
    return {
      toolName,
      displayName: toolName,
      description: t.description,
      enabled: isEnabled,
      serverName: t.serverName,
    };
  });
}

async function getTool(toolName) {
  const tools = await listTools();
  return tools.find((item) => item.toolName === toolName) || null;
}

async function assertToolAllowed(toolName) {
  await refreshToggleCacheIfNeeded();
  
  const isEnabled = toggleCacheMap.has(toolName) ? toggleCacheMap.get(toolName) : true;
  if (!isEnabled) {
    throw new ToolExecutionError(TOOL_ERROR_CODES.TOOL_DISABLED, "工具已关闭");
  }

  const whitelist = normalizeWhitelist(getMcpConfig().toolWhitelist);
  if (!isToolWhitelisted(toolName, whitelist)) {
    // 如果白名单是 '*' 则允许所有
    if (whitelist.length === 1 && whitelist[0] === '*') {
      return true;
    }
    throw new ToolExecutionError(TOOL_ERROR_CODES.TOOL_NOT_ALLOWED, "工具不在白名单");
  }

  return true;
}

async function updateToolToggle({ toolName, enabled, operatorId, reason }) {
  const currentEnabled = toggleCacheMap.has(toolName) ? toggleCacheMap.get(toolName) : true;
  
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

async function updateServerToggle({ serverName, enabled, operatorId, reason }) {
  const toolNames = mcpManager.getToolNamesByServer(serverName);
  for (const toolName of toolNames) {
    await updateToolToggle({ toolName, enabled, operatorId, reason });
  }
  return toolNames.length;
}

module.exports = {
  listTools,
  getTool,
  assertToolAllowed,
  updateToolToggle,
  updateServerToggle,
};
