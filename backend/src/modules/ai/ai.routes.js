const express = require("express");
const controller = require("./ai.controller");
const authMiddleware = require("../../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

router.post("/generate-todos", controller.generateTodos);
router.post("/execute-command", controller.executeCommand);

module.exports = router;
