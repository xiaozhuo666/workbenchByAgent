const dotenv = require("dotenv");

dotenv.config();

const env = {
  port: Number(process.env.PORT || 4000),
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || "ai_workbench",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  },
  jwtSecret: process.env.JWT_SECRET || "replace_with_strong_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2h",
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
  corsOrigin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(",") 
    : ["http://localhost:3000", "http://127.0.0.1:3000"],
  mcp: {
    enabled: String(process.env.MCP_ENABLED || "false").toLowerCase() === "true",
    toolWhitelist: (process.env.MCP_TOOL_WHITELIST || "tool.mock.query")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    maxCallRounds: Number(process.env.MCP_MAX_CALL_ROUNDS || 3),
    toolTimeoutMs: Number(process.env.MCP_TOOL_TIMEOUT_MS || 3000),
    toolMaxRetries: Number(process.env.MCP_TOOL_MAX_RETRIES || 1),
    retryBackoffMs: Number(process.env.MCP_RETRY_BACKOFF_MS || 200),
    toggleCacheTtlMs: Number(process.env.MCP_TOGGLE_CACHE_TTL_MS || 3000),
    adminUserIds: (process.env.MCP_ADMIN_USER_IDS || "1")
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item)),
  },
};

module.exports = env;
