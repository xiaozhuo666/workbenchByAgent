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
 * 获取所有可用工具（包含动态发现的 MCP 工具）
 */
async function listTools() {
  await ensureCoreServersRegistered();
  await refreshToggleCacheIfNeeded();
  const allTools = mcpManager.getOpenAiTools();
  
  return allTools.map((t) => {
    const toolName = t.function.name;
    const isEnabled = toggleCacheMap.has(toolName) ? toggleCacheMap.get(toolName) : true;
    
    return {
      toolName,
      displayName: toolName,
      description: t.function.description,
      enabled: isEnabled,
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

module.exports = {
  listTools,
  getTool,
  assertToolAllowed,
  updateToolToggle,
};
