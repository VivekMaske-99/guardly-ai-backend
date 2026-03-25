const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

// 🔐 Protected route
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route working",
    userId: req.userId,
  });
});

module.exports = router;