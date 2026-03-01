const express = require("express");
const controller = require("./schedule.controller");
const authMiddleware = require("../../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

router.get("/", controller.list);
router.post("/", controller.create);
router.delete("/:id", controller.remove);

module.exports = router;
