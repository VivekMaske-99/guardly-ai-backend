const ThreatEvent = require("../models/ThreatEvent");
const UserRiskProfile = require("../models/UserRiskProfile");
const UserAlert = require("../models/UserAlert");

const calculateRiskScore = async (userId) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const events = await ThreatEvent.find({
    userId,
    createdAt: { $gte: sevenDaysAgo }
  });

  if (!events.length) return 0;

  let total = 0;
  let count = 0;

  events.forEach(e => {
    const daysOld = (new Date() - e.createdAt) / (1000 * 60 * 60 * 24);

    // 🔥 Time-decay (older events reduce impact)
    const decayFactor = Math.max(0.4, 1 - daysOld / 14);

    total += (e.riskLevel || 0) * decayFactor;
    count++;
  });

  const average = total / count;

  return Math.min(10, Math.round(average));
};

const calculateSecurityHealth = async (userId) => {
  const totalThreats = await ThreatEvent.countDocuments({ userId });
  const health = 100 - totalThreats * 5;
  return Math.max(0, health);
};

const updateUserProfile = async (userId) => {

  const riskScore = await calculateRiskScore(userId);
  const securityHealth = await calculateSecurityHealth(userId);

  let riskLevel = "Low";
  if (riskScore >= 7) riskLevel = "High";
  else if (riskScore >= 4) riskLevel = "Medium";

  let profile = await UserRiskProfile.findOne({ userId });

  const previousScore = profile?.currentRiskScore || 0;

  if (!profile) {
    profile = new UserRiskProfile({ userId });
  }

  profile.currentRiskScore = riskScore;
  profile.riskLevel = riskLevel;
  profile.securityHealth = securityHealth;
  profile.lastUpdated = new Date();

  await profile.save();

  // 🔥 Spike Detection
  if (riskScore - previousScore >= 3) {
    await UserAlert.create({
      userId,
      type: "critical",
      message: "Sudden risk spike detected. Review recent activity immediately."
    });
  }

  return profile;
};

module.exports = { updateUserProfile };
