const express = require("express");
const auth = require("../../middleware/auth");
const controller = require("./auth.controller");

const router = express.Router();

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/logout", (req, res, next) => {
  auth(req, res, (err) => {
    if (err) {
      // 忽略 logout 时的认证错误，直接放行
      req.auth = null;
    }
    next();
  });
}, controller.logout);
router.get("/me", auth, controller.me);
router.post("/guest-token", controller.guestToken);

module.exports = router;
