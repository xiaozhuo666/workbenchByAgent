const { TOOL_CAPABILITY } = require("./tool.constants");

/**
 * 默认工具配置
 * 注意：在原生 MCP 架构下，大部分工具由 McpServerManager 动态发现。
 * 此处仅保留系统内置的、非 MCP 协议的工具（如有）。
 * 目前已全部迁移至动态发现，此处返回空列表。
 */
function buildDefaultTools() {
  return [];
}

module.exports = {
  buildDefaultTools,
};
