// src/models/ThreatEvent.js

const mongoose = require("mongoose");

const threatEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // 🔥 FIXED
      ref: "User",
      required: true,
    },

    sourceType: {
      type: String,
      enum: ["chat", "url", "file", "manual"],
      required: true,
    },

    category: {
      type: String,
      enum: ["phishing", "malware", "scam", "data_leak", "social_engineering"],
      required: true,
    },

    severity: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: true,
    },

    likelihood: { type: Number, default: 0 },
    impact: { type: Number, default: 0 },

    riskLevel: { type: Number, default: 0 },

    description: String,
  },
  { timestamps: true } // 🔥 auto createdAt, updatedAt
);

// 🔥 Auto risk calculation
threatEventSchema.pre("save", function (next) {
  this.riskLevel = this.likelihood * this.impact;
  next();
});

module.exports = mongoose.model("ThreatEvent", threatEventSchema);