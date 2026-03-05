const express = require("express");
const controller = require("./ai.controller");
const ticketController = require("./ticket/ticket.controller");
const authMiddleware = require("../../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

router.post("/generate-tasks", controller.generateTasks);
router.post("/execute-command", controller.executeCommand);
router.post("/chat", controller.chat);
router.post("/ticket-drafts", ticketController.createDraft);
router.get("/ticket-drafts/:draftId", ticketController.getDraft);
router.post("/tickets/search", ticketController.searchTickets);
router.post("/tickets/recommendations", ticketController.getRecommendations);
router.get("/mcp/tools", controller.listMcpTools);
router.patch("/mcp/tools/:toolName/toggle", controller.toggleMcpTool);
router.get("/conversations", controller.listConversations);
router.get("/conversations/:conversationId", controller.getConversationHistory);
router.delete("/conversations/:conversationId", controller.deleteConversation);

module.exports = router;
