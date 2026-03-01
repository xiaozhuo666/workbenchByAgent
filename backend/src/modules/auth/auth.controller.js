const service = require("./auth.service");
const {
  validateRegisterPayload,
  validateLoginPayload,
} = require("./auth.validator");

async function register(req, res, next) {
  try {
    validateRegisterPayload(req.body);
    const result = await service.register({
      ...req.body,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
    res.status(201).json({
      code: "OK",
      message: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    validateLoginPayload(req.body);
    const result = await service.login({
      ...req.body,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
    res.status(200).json({
      code: "OK",
      message: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await service.getCurrentUser({ userId: Number(req.auth.sub) });
    res.status(200).json({
      code: "OK",
      message: "success",
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    await service.logout({ jti: req.auth.jti });
    res.status(200).json({
      code: "OK",
      message: "success",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  me,
  logout,
};
