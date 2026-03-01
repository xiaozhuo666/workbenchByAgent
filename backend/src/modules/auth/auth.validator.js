const ERROR_CODES = require("../../utils/errorCodes");
const { appError } = require("../../middleware/errorHandler");

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,32}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function validateRegisterPayload(body) {
  const { username, password, email } = body || {};

  if (!USERNAME_REGEX.test(username || "")) {
    throw appError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "用户名格式不正确", 422);
  }

  if (!PASSWORD_REGEX.test(password || "")) {
    throw appError(
      ERROR_CODES.AUTH_PASSWORD_WEAK,
      "密码至少8位，且包含大小写字母和数字",
      422
    );
  }

  if (!email) {
    throw appError(ERROR_CODES.AUTH_INVALID_EMAIL, "请输入邮箱", 422);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw appError(ERROR_CODES.AUTH_INVALID_EMAIL, "邮箱格式不正确", 422);
  }
}

function validateLoginPayload(body) {
  const { account, password } = body || {};
  if (!account || !password) {
    throw appError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "账号或密码不能为空", 422);
  }

  if (String(account).trim().length < 3) {
    throw appError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "账号格式不正确", 422);
  }

  if (String(password).length < 8) {
    throw appError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "密码长度至少8位", 422);
  }
}

module.exports = {
  validateRegisterPayload,
  validateLoginPayload,
};
