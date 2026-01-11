const mongoose = require("mongoose");

const UserRiskSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  totalScans: { type: Number, default: 0 },
  highRisk: { type: Number, default: 0 },
  mediumRisk: { type: Number, default: 0 },
  lowRisk: { type: Number, default: 0 },
  riskScore: { type: Number, default: 0 }
});

module.exports = mongoose.model("UserRisk", UserRiskSchema);
