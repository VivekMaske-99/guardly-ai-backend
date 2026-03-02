const mongoose = require("mongoose");

const userAlertSchema = new mongoose.Schema({
  userId: { type: String, required: true },

  type: {
    type: String,
    enum: ["critical", "warning", "info"],
    required: true
  },

  message: { type: String, required: true },

  isRead: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("UserAlert", userAlertSchema);
