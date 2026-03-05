const express = require("express");
const authMiddleware = require("../../../middleware/auth");
const controller = require("./ticket.controller");

const router = express.Router();

router.use(authMiddleware);
router.post("/ticket-drafts", controller.createDraft);
router.get("/ticket-drafts/:draftId", controller.getDraft);
router.post("/tickets/search", controller.searchTickets);
router.post("/tickets/recommendations", controller.getRecommendations);

module.exports = router;
