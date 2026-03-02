const mongoose = require("mongoose");

const userRiskProfileSchema = new mongoose.Schema({
  userId: { type: String, unique: true },

  currentRiskScore: { type: Number, default: 0 },
  riskLevel: { type: String, default: "Low" },

  securityHealth: { type: Number, default: 100 },

  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("UserRiskProfile", userRiskProfileSchema);
