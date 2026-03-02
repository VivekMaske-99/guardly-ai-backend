const express = require("express");
const router = express.Router();

const chatController = require("../controllers/chatController");
const userController = require("../controllers/userController");

router.post("/chat", chatController.chat);
router.get("/user/sessions/:userId", userController.getUserSessions);
router.get("/chat/session/:sessionId", userController.getSessionChats);
router.get("/risk/session/:sessionId", userController.getSessionRisk);

module.exports = router;
