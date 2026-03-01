const express = require("express");
const controller = require("./ai.controller");
const authMiddleware = require("../../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

router.post("/generate-tasks", controller.generateTasks);
router.post("/execute-command", controller.executeCommand);
router.post("/chat", controller.chat);

module.exports = router;
