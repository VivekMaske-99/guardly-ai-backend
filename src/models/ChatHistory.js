const mongoose = require("mongoose");

const ChatHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  message: { type: String, required: true },
  aiResult: {
    risk: String,
    impact: String,
    action: String,
    severity: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("ChatHistory", ChatHistorySchema);
