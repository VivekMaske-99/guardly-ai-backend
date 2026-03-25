const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  riskScore: Number,
  riskLevel: String,

  fileName: String, // 🔥 ADD THIS

  filePath: {
    type: String,
    required: true
  },

  extractedValues: {
    type: Object,
    default: {}
  },

  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("Scan", scanSchema);