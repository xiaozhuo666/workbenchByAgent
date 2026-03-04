const mockQueryTool = require("./adapters/mockQueryTool");
const { TOOL_CAPABILITY } = require("./tool.constants");

function buildDefaultTools() {
  return [
    {
      toolName: "tool.mock.query",
      displayName: "模拟查询工具",
      description: "用于演示 MCP 查询能力",
      capabilityType: TOOL_CAPABILITY.READ,
      riskLevel: "low",
      enabled: true,
      adapter: mockQueryTool,
    },
  ];
}

module.exports = {
  buildDefaultTools,
};
