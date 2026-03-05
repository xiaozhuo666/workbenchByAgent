const path = require("path");
const mcpManager = require("./mcpServerManager");

let registerCoreServersPromise = null;

function getProjectRoot() {
  const cwd = path.resolve(process.cwd());
  return cwd.endsWith("backend") ? path.dirname(cwd) : cwd;
}

async function registerCoreServers() {
  const root = getProjectRoot();
  await mcpManager.registerServer("12306-server", {
    command: "node",
    args: [path.join(root, "MCP-Tools", "12306-mcp", "build", "index.js")],
    env: {},
  });

  await mcpManager.registerServer("web-search-server", {
    command: "node",
    args: [path.join(root, "MCP-Tools", "open-webSearch", "build", "index.js")],
    env: { MODE: "stdio", DEFAULT_SEARCH_ENGINE: "baidu" },
  });
}

async function ensureCoreServersRegistered() {
  if (!registerCoreServersPromise) {
    registerCoreServersPromise = registerCoreServers().catch((error) => {
      registerCoreServersPromise = null;
      throw error;
    });
  }
  return registerCoreServersPromise;
}

module.exports = {
  ensureCoreServersRegistered,
};
