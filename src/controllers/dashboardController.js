const UserRiskProfile = require("../models/UserRiskProfile");
const ThreatEvent = require("../models/ThreatEvent");
const UserAlert = require("../models/UserAlert");

const getDashboardOverview = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await UserRiskProfile.findOne({ userId });

    const recentEvents = await ThreatEvent.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const alerts = await UserAlert.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      riskScore: profile?.currentRiskScore || 0,
      riskLevel: profile?.riskLevel || "Low",
      securityHealth: profile?.securityHealth || 100,
      recentEvents,
      alerts
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

const getCategoryBreakdown = async (req, res) => {
  const { userId } = req.params;

  const result = await ThreatEvent.aggregate([
    { $match: { userId } },
    { $group: { _id: "$category", count: { $sum: 1 } } }
  ]);

  res.json(result);
};

const getWeeklyTrend = async (req, res) => {
  const { userId } = req.params;

  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const result = await ThreatEvent.aggregate([
    { $match: { userId, createdAt: { $gte: last30Days } } },
    { $group: { _id: { $week: "$createdAt" }, count: { $sum: 1 } } },
    { $sort: { "_id": 1 } }
  ]);

  res.json(result);
};

const getUserAlerts = async (req, res) => {
  const { userId } = req.params;

  const alerts = await UserAlert.find({ userId })
    .sort({ createdAt: -1 })
    .limit(10);

  res.json(alerts);
};

const getRiskExplanation = async (req, res) => {
  const { userId } = req.params;

  const events = await ThreatEvent.find({ userId })
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    explanation:
      "Risk score is calculated using likelihood × impact model with time-decay weighting and anomaly detection.",
    recentEvents: events
  });
};

module.exports = {
  getDashboardOverview,
  getCategoryBreakdown,
  getWeeklyTrend,
  getUserAlerts,
  getRiskExplanation
};
