const groqService = require("../services/groqService");
const ChatHistory = require("../models/ChatHistory");
const UserRisk = require("../models/UserRisk");

const chat = async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: "userId and message required" });
  }

  try {
    const aiResult = await groqService.analyzeMessage(message);

    // Save chat
    await ChatHistory.create({
      userId,
      message,
      aiResult
    });

    // Update risk
    let risk = await UserRisk.findOne({ userId });

    if (!risk) {
      risk = await UserRisk.create({ userId });
    }

    risk.totalScans += 1;

    if (aiResult.severity === "High") risk.highRisk += 1;
    if (aiResult.severity === "Medium") risk.mediumRisk += 1;
    if (aiResult.severity === "Low") risk.lowRisk += 1;

    const score =
      (risk.highRisk * 10 + risk.mediumRisk * 5 + risk.lowRisk * 1) /
      risk.totalScans;

    risk.riskScore = Number(score.toFixed(2));
    await risk.save();

   res.json({
  ai: aiResult.userMessage,
  risk: aiResult.risk,
  impact: aiResult.impact,
  action: aiResult.action,
  severity: aiResult.severity,
  riskScore: risk.riskScore
});


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI processing failed" });
  }
};

module.exports = { chat };
