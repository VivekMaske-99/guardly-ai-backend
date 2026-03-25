const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const scanController = require("../controllers/scanController");
const Scan = require("../models/Scan");

// 🔥 FILE SCAN (PROTECTED)
router.post("/upload", authMiddleware, scanController.scanFile);

// 🔥 URL SCAN (if you have it)
router.post("/url", authMiddleware, scanController.scanUrl);

// 🔥 GET USER HISTORY
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const scans = await Scan.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: scans
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;