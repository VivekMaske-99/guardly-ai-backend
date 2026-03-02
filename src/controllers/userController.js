const ChatHistory = require("../models/ChatHistory");

const getUserSessions = async (req, res) => {
  const { userId } = req.params;

  const sessions = await ChatHistory.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: "$sessionId",
        last: { $last: "$message" },
        time: { $max: "$createdAt" }
      }
    },
    { $sort: { time: -1 } }
  ]);

  res.json(sessions);
};

const getSessionChats = async (req, res) => {
  const { sessionId } = req.params;
  const chats = await ChatHistory.find({ sessionId }).sort({ createdAt: 1 });
  res.json(chats);
};

const getSessionRisk = async (req, res) => {
  const { sessionId } = req.params;
  const chats = await ChatHistory.find({ sessionId });

  let high = 0, medium = 0, low = 0;
  let last = null;

  chats.forEach(c => {
    if (!c.aiResult) return;

    if (c.aiResult.severity === "High") high++;
    if (c.aiResult.severity === "Medium") medium++;
    if (c.aiResult.severity === "Low") low++;

    last = c.aiResult;
  });

  res.json({
    highRisk: high,
    mediumRisk: medium,
    lowRisk: low,
    riskScore: last?.riskLevel || 0, // 🔥 FIXED
    last
  });
};

module.exports = {
  getUserSessions,
  getSessionChats,
  getSessionRisk
};
