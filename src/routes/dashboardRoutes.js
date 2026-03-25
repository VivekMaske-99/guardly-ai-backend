const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

// Dashboard Overview
router.get("/dashboard/:userId", dashboardController.getDashboardOverview);

// Category Breakdown
router.get("/dashboard/category/:userId", dashboardController.getCategoryBreakdown);

// Weekly Trend
router.get("/dashboard/trend/:userId", dashboardController.getWeeklyTrend);

// Alerts
router.get("/dashboard/alerts/:userId", dashboardController.getUserAlerts);

router.get("/dashboard/insight/:userId", dashboardController.getRiskExplanation);

module.exports = router;