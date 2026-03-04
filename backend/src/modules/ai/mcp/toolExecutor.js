const { TOOL_STATUS } = require("./tool.constants");
const { TOOL_ERROR_CODES, ToolExecutionError } = require("./tool.errors");
const { getMcpConfig } = require("../../../config/mcp");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout(promise, timeoutMs) {
  let timer = null;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new ToolExecutionError(TOOL_ERROR_CODES.TOOL_TIMEOUT, "工具执行超时")), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function executeTool({ tool, args = {}, timeoutMs, maxRetries }) {
  const config = getMcpConfig();
  const finalTimeout = timeoutMs || config.toolTimeoutMs;
  const retries = Number.isFinite(maxRetries) ? maxRetries : config.toolMaxRetries;
  const startedAt = Date.now();
  let attempt = 0;
  while (attempt <= retries) {
    attempt += 1;
    try {
      const result = await withTimeout(Promise.resolve(tool.adapter.execute(args)), finalTimeout);
      return {
        status: TOOL_STATUS.SUCCESS,
        result,
        error: null,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      const isTimeout = error.code === TOOL_ERROR_CODES.TOOL_TIMEOUT;
      const isLastAttempt = attempt > retries;
      if (!isLastAttempt) {
        await sleep(config.retryBackoffMs);
        continue;
      }
      return {
        status: isTimeout ? TOOL_STATUS.TIMEOUT : TOOL_STATUS.FAILED,
        result: null,
        error: {
          code: error.code || TOOL_ERROR_CODES.TOOL_FAILED,
          message: error.message || "工具执行失败",
        },
        durationMs: Date.now() - startedAt,
      };
    }
  }
  return {
    status: TOOL_STATUS.FAILED,
    result: null,
    error: { code: TOOL_ERROR_CODES.TOOL_FAILED, message: "工具执行失败" },
    durationMs: Date.now() - startedAt,
  };
}

module.exports = {
  executeTool,
};
