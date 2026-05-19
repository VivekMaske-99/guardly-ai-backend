const ChatHistory = require("../models/ChatHistory");
const ThreatEvent = require("../models/ThreatEvent");
const groqService = require("../services/groqService");
const { updateUserProfile } = require("../services/riskEngine");

const chat = async (req, res) => {
  try {
    const { message, userId, sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId required" });
    }

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    // AI analysis
    const ai = await groqService.analyzeMessage(message);

    // Save chat history
    await ChatHistory.create({
      userId,
      sessionId,
      message,
      aiResult: ai
    });

    try {

      // Only create threat event if AI detects risk
      // 🔥 CHECK IF FIRST MESSAGE OF SESSION
// 🔥 CHECK IF FIRST MESSAGE IN SESSION
const isFirstMessage =
  (await ChatHistory.countDocuments({ sessionId })) === 1;

if (isFirstMessage && ai.severity && ai.severity !== "None") {

  const formattedSeverity =
    ai.severity.charAt(0).toUpperCase() +
    ai.severity.slice(1).toLowerCase();

  const likelihood = Number(ai.likelihood) || 0;
  const impactScore = Number(ai.impactScore) || 0;

  const calculatedRisk = likelihood * impactScore;

  await ThreatEvent.create({
    userId,
    sourceType: "chat",
    category: ai.risk?.toLowerCase() || "phishing",
    severity: formattedSeverity,
    likelihood,
    impact: impactScore,
    riskLevel: calculatedRisk,
    description: message
  });

  // ✅ ONLY UPDATE ON FIRST MESSAGE
  await updateUserProfile(userId);
}

    } catch (riskError) {
      console.error("Risk Engine Error:", riskError);
    }

    res.json(ai);

  } catch (err) {

    console.error("Chat Controller Error:", err);

    res.status(500).json({
      error: "AI processing failed"
    });
  }
};

module.exports = { chat };