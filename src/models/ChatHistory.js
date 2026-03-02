const mongoose = require("mongoose");

const ChatHistorySchema = new mongoose.Schema({
  userId: String,
  sessionId: String,
  message: String,
  aiResult: Object,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ChatHistory", ChatHistorySchema);
