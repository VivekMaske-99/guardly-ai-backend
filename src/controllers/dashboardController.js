const UserRiskProfile = require("../models/UserRiskProfile");
const ThreatEvent = require("../models/ThreatEvent");
const UserAlert = require("../models/UserAlert");


// Dashboard Overview
const getDashboardOverview = async (req, res) => {
  try {

    const { userId } = req.params;

    const profile = await UserRiskProfile.findOne({ userId }).lean();

    const recentEvents = await ThreatEvent.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const alerts = await UserAlert.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      riskScore: profile?.currentRiskScore || 0,
      riskLevel: profile?.riskLevel || "Low",
      securityHealth: profile?.securityHealth || 100,
      recentEvents: recentEvents || [],
      alerts: alerts || []
    });

  } catch (err) {

    console.error("Dashboard Error:", err);

    res.status(500).json({
      message: "Server Error",
      error: err.message
    });
  }
};


// Threat Category Breakdown
const getCategoryBreakdown = async (req, res) => {
  try {

    const { userId } = req.params;

    const result = await ThreatEvent.aggregate([
      { $match: { userId } },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    res.json(result);

  } catch (err) {

    console.error("Category Breakdown Error:", err);

    res.status(500).json({
      message: "Server Error",
      error: err.message
    });
  }
};


// Weekly Threat Trend
const getWeeklyTrend = async (req, res) => {
  try {

    const { userId } = req.params;

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const result = await ThreatEvent.aggregate([
      { $match: { userId, createdAt: { $gte: last30Days } } },
      { $group: { _id: { $week: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { "_id": 1 } }
    ]);

    res.json(result);

  } catch (err) {

    console.error("Weekly Trend Error:", err);

    res.status(500).json({
      message: "Server Error",
      error: err.message
    });
  }
};


// User Alerts
const getUserAlerts = async (req, res) => {
  try {

    const { userId } = req.params;

    const alerts = await UserAlert.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json(alerts);

  } catch (err) {

    console.error("Alerts Error:", err);

    res.status(500).json({
      message: "Server Error",
      error: err.message
    });
  }
};


// Risk Explanation (AI Insight Card)
const getRiskExplanation = async (req, res) => {
  try {

    const { userId } = req.params;

    const events = await ThreatEvent.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const profile = await UserRiskProfile.findOne({ userId }).lean();

    let insight = "System operating normally.";

    if (profile) {

      if (profile.riskLevel === "Critical") {
        insight =
          "Multiple high severity threats detected. System risk level is CRITICAL. Immediate investigation required.";
      }

      else if (profile.riskLevel === "High") {
        insight =
          "Several high risk events detected including malware or phishing attempts. Monitoring recommended.";
      }

      else if (profile.riskLevel === "Medium") {
        insight =
          "Moderate risk activity detected. Users should remain cautious of suspicious messages or links.";
      }

      else {
        insight =
          "Low risk level. No significant security threats detected.";
      }

    }

    res.json({
      insight,
      recentEvents: events
    });

  } catch (err) {

    console.error("Risk Insight Error:", err);

    res.status(500).json({
      message: "Server Error",
      error: err.message
    });
  }
};

module.exports = {
  getDashboardOverview,
  getCategoryBreakdown,
  getWeeklyTrend,
  getUserAlerts,
  getRiskExplanation
};