const { verifyAccessToken } = require("../utils/crypto");
const ERROR_CODES = require("../utils/errorCodes");
const { appError } = require("./errorHandler");
const repository = require("../modules/auth/auth.repository");

async function authMiddleware(req, res, next) {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    const authHeader = req.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      throw appError(ERROR_CODES.AUTH_TOKEN_MISSING, "缺少认证令牌", 401);
    }

    const token = authHeader.slice(7);
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      const code =
        error.name === "TokenExpiredError"
          ? ERROR_CODES.AUTH_TOKEN_EXPIRED
          : ERROR_CODES.AUTH_TOKEN_INVALID;
      throw appError(code, "认证令牌无效", 401);
    }

    const session = await repository.findActiveSessionByJti(payload.jti);
    if (!session) {
      throw appError(ERROR_CODES.AUTH_SESSION_INVALID, "会话无效或已失效", 401);
    }

    req.auth = {
      ...payload,
      id: payload.sub ? Number(payload.sub) : undefined,
    };
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authMiddleware;
