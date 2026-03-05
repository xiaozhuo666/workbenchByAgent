const { appError } = require("../../../middleware/errorHandler");

const TICKET_ERROR_CODES = {
  DRAFT_NOT_FOUND: "DRAFT_NOT_FOUND",
  DRAFT_EXPIRED: "DRAFT_EXPIRED",
  INVALID_TICKET_PARAMS: "INVALID_TICKET_PARAMS",
  MCP_UPSTREAM_TIMEOUT: "MCP_UPSTREAM_TIMEOUT",
  MCP_UPSTREAM_PARTIAL: "MCP_UPSTREAM_PARTIAL",
};

function draftNotFound() {
  return appError(TICKET_ERROR_CODES.DRAFT_NOT_FOUND, "行程草稿不存在", 404);
}

function draftExpired() {
  return appError(TICKET_ERROR_CODES.DRAFT_EXPIRED, "行程草稿已过期，请重新生成", 410);
}

function invalidTicketParams(message = "票务参数不合法") {
  return appError(TICKET_ERROR_CODES.INVALID_TICKET_PARAMS, message, 400);
}

module.exports = {
  TICKET_ERROR_CODES,
  draftNotFound,
  draftExpired,
  invalidTicketParams,
};
