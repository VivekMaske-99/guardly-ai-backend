const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const healthController = require('../controllers/healthController');

router.post('/chat', chatController.chat);
router.get('/health', healthController.checkHealth);

module.exports = router;
