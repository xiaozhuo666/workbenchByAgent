const { TOOL_CAPABILITY } = require("./tool.constants");

function normalizeWhitelist(list = []) {
  return new Set(
    list
      .map((item) => String(item || "").trim())
      .filter(Boolean)
  );
}

function isToolWhitelisted(toolName, whitelistSet) {
  return whitelistSet.has(toolName);
}

function isReadOnlyTool(toolDefinition) {
  return toolDefinition && toolDefinition.capabilityType === TOOL_CAPABILITY.READ;
}

module.exports = {
  normalizeWhitelist,
  isToolWhitelisted,
  isReadOnlyTool,
};
