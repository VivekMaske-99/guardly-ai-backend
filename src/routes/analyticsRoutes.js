const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/analyticsController");

router.get("/analytics/threat-summary/:userId", analyticsController.getThreatSummary);

module.exports = router;