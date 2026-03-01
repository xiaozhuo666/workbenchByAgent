const ERROR_CODES = require("../utils/errorCodes");

function appError(code, message, status = 400, details) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  error.details = details;
  return error;
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const code = err.code || ERROR_CODES.SYS_INTERNAL_ERROR;
  const message = err.message || "Internal server error";

  if (status >= 500) {
    // Keep server logs concise and avoid sensitive payload leakage.
    console.error("[error]", req.requestId || "-", code, message);
  }

  res.status(status).json({
    code,
    message,
    requestId: req.requestId || "",
    details: err.details || undefined,
  });
}

module.exports = {
  appError,
  errorHandler,
};
