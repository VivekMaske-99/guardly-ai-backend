const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/dashboard/:userId", dashboardController.getDashboardOverview);
router.get("/dashboard/category/:userId", dashboardController.getCategoryBreakdown);
router.get("/dashboard/trend/:userId", dashboardController.getWeeklyTrend);
router.get("/dashboard/alerts/:userId", dashboardController.getUserAlerts);

module.exports = router;
