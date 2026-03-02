const mongoose = require("mongoose");

const threatEventSchema = new mongoose.Schema({
  userId: { type: String, required: true },

  sourceType: { 
    type: String, 
    enum: ["chat", "url", "file", "manual"], 
    required: true 
  },

  category: {
    type: String,
    enum: ["phishing", "malware", "scam", "data_leak", "social_engineering"],
    required: true
  },

  severity: {
    type: String,
    enum: ["Low", "Medium", "High"],
    required: true
  },

  likelihood: { type: Number, default: 0 },  // 1–5
  impact: { type: Number, default: 0 },      // 1–5
  riskLevel: { type: Number, default: 0 },   // likelihood × impact (1–10)

  description: String,

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ThreatEvent", threatEventSchema);
