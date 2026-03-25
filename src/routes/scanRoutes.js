// src/routes/scanRoutes.js

const express = require("express");
const multer = require("multer");
const path = require("path");

const authMiddleware = require("../middleware/authMiddleware");
const ThreatEvent = require("../models/ThreatEvent");

const reportController = require("../controllers/reportController");
const { scanFile } = require("../controllers/scanController");

const router = express.Router();

// storage config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

// 🔐 1. Upload + scan (protected)
router.post(
  "/upload",
  authMiddleware,
  upload.single("document"),
  scanFile
);

// 🔐 2. Save scan result manually (optional API)
router.post("/save", authMiddleware, async (req, res) => {
  try {
    const { sourceType, category, severity, likelihood, impact, description } =
      req.body;

    const newEvent = new ThreatEvent({
      userId: req.userId,
      sourceType,
      category,
      severity,
      likelihood,
      impact,
      description,
    });

    await newEvent.save();

    res.json({
      message: "Threat saved",
      data: newEvent,
    });
  } catch (err) {
    res.status(500).json({ message: "Error saving threat" });
  }
});

// 🔐 3. Get history (for dashboard)
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const history = await ThreatEvent.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Error fetching history" });
  }
});

router.get("/redact/:scanId", authMiddleware, reportController.redactPDF);

module.exports = router;