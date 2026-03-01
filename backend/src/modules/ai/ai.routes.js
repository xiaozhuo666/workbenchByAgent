const express = require("express");
const controller = require("./ai.controller");
const authMiddleware = require("../../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

router.post("/generate-tasks", controller.generateTasks);
router.post("/execute-command", controller.executeCommand);
router.post("/chat", controller.chat);
router.get("/conversations", controller.listConversations);
router.get("/conversations/:conversationId", controller.getConversationHistory);
router.delete("/conversations/:conversationId", controller.deleteConversation);

module.exports = router;
