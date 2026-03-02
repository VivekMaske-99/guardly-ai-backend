const UserAlert = require("../models/UserAlert");

const generateAlert = async (userId, riskLevel, riskScore) => {

  if (riskLevel === "High") {
    await UserAlert.create({
      userId,
      type: "critical",
      message: `Risk score is HIGH (${riskScore}). Immediate action required.`
    });
  }

  if (riskLevel === "Medium") {
    await UserAlert.create({
      userId,
      type: "warning",
      message: `Risk level increasing. Current score: ${riskScore}.`
    });
  }
};

module.exports = { generateAlert };
