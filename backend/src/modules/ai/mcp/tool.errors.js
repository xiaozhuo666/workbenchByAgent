class ToolExecutionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ToolExecutionError";
    this.code = code;
  }
}

const TOOL_ERROR_CODES = {
  TOOL_NOT_FOUND: "TOOL_NOT_FOUND",
  TOOL_DISABLED: "TOOL_DISABLED",
  TOOL_NOT_ALLOWED: "TOOL_NOT_ALLOWED",
  TOOL_TIMEOUT: "TOOL_TIMEOUT",
  TOOL_FAILED: "TOOL_FAILED",
  INVALID_ARGS: "INVALID_ARGS",
};

module.exports = {
  ToolExecutionError,
  TOOL_ERROR_CODES,
};
