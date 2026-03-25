const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

// EXISTING
router.get("/pdf/:userId", reportController.generatePDFReport);
router.get("/doc/:userId", reportController.generateDOCReport);

// 🔥 NEW ROUTE
router.post("/ai-scan", reportController.generateAIScanReport);

module.exports = router;