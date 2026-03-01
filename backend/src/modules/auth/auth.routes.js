const express = require("express");
const auth = require("../../middleware/auth");
const controller = require("./auth.controller");

const router = express.Router();

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/logout", auth, controller.logout);
router.get("/me", auth, controller.me);

module.exports = router;
