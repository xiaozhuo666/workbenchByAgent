const ERROR_CODES = require("../../utils/errorCodes");
const { appError } = require("../../middleware/errorHandler");
const {
  hashPassword,
  verifyPassword,
  signAccessToken,
} = require("../../utils/crypto");
const repository = require("./auth.repository");

function unixToDateTime(unixSeconds) {
  return new Date(unixSeconds * 1000);
}

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email || null,
  };
}

async function register({ username, email, password, ip, userAgent }) {
  const exists = await repository.findByUsername(username);
  if (exists) {
    throw appError(ERROR_CODES.AUTH_USERNAME_EXISTS, "用户名已存在", 409);
  }

  const emailExists = await repository.findByEmail(email);
  if (emailExists) {
    throw appError(ERROR_CODES.AUTH_EMAIL_EXISTS, "邮箱已被注册", 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await repository.createUser({
    username,
    email,
    passwordHash,
  });

  const { token, jti, exp } = signAccessToken({ sub: String(user.id) });
  await repository.createSession({
    userId: user.id,
    jti,
    tokenExpiresAt: unixToDateTime(exp),
    ip,
    userAgent,
  });

  return { token, user: toPublicUser(user) };
}

async function login({ account, password, ip, userAgent }) {
  const user = await repository.findByAccount(account);
  if (!user) {
    throw appError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "账号或密码错误", 401);
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    throw appError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "账号或密码错误", 401);
  }

  const { token, jti, exp } = signAccessToken({ sub: String(user.id) });
  await repository.createSession({
    userId: user.id,
    jti,
    tokenExpiresAt: unixToDateTime(exp),
    ip,
    userAgent,
  });

  return { token, user: toPublicUser(user) };
}

async function getCurrentUser({ userId }) {
  const user = await repository.findById(userId);
  if (!user) {
    throw appError(ERROR_CODES.AUTH_SESSION_INVALID, "会话无效", 401);
  }
  return toPublicUser(user);
}

async function logout({ jti }) {
  await repository.revokeSessionByJti(jti);
}

async function guestToken({ ip, userAgent }) {
  // Create a special guest user token with a unique identifier
  // The sub field will be set to a negative number to identify as guest
  const { token, jti, exp } = signAccessToken({ 
    sub: "-1",
    isGuest: true 
  });
  
  // Create session for guest token tracking
  await repository.createSession({
    userId: null, // No real user associated
    jti,
    tokenExpiresAt: unixToDateTime(exp),
    ip,
    userAgent,
  });

  return { 
    token,
    user: {
      id: -1,
      username: "访客",
      email: null,
      isGuest: true
    }
  };
}

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
  guestToken,
};
