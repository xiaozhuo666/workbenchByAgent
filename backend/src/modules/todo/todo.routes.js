const express = require("express");
const controller = require("./todo.controller");
const authMiddleware = require("../../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

router.get("/", controller.list);
router.post("/", controller.create);
router.patch("/:id/status", controller.updateStatus);
router.patch("/batch-status", controller.batchUpdateStatus);
router.delete("/:id", controller.remove);

module.exports = router;
