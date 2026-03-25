const DocumentScannerService = require("../services/scanner/documentScannerService");
const ThreatEvent = require("../models/ThreatEvent");
const Scan = require("../models/Scan");
const { modifyPdf } = require("../services/scanner/pdfModifier");
const fs = require("fs");

exports.scanFile = async (req, res) => {
  try {
    // ===============================
    // VALIDATION
    // ===============================
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 🔥 FIX PATH AT SOURCE (BEST PRACTICE)
    const filePath = req.file.path.replace(/\\/g, "/");

    const userProfile = {
      userId,
      fullName: req.body.fullName || "User",
      email: req.body.email || "",
      phone: req.body.phone || "",
      location: req.body.location || "",
    };

    // ===============================
    // 🔍 SCAN DOCUMENT
    // ===============================
    const result = await DocumentScannerService.scanFile(
      filePath,
      userProfile
    );

    // ===============================
    // 🔴 PDF REDACT GENERATION
    // ===============================
    let modifiedPdf = null;

    try {
      const pdfBase64 = fs.readFileSync(filePath, {
        encoding: "base64",
      });

      modifiedPdf = await modifyPdf(
        pdfBase64,
        [],
        "redact",
        result.extractedValues || {}
      );
    } catch (e) {
      console.error("⚠️ PDF modify failed:", e.message);
    }

    // ===============================
    // SAFE MATCHED DATA
    // ===============================
    let matched = result?.matchedData;

    if (!matched) matched = {};

    if (Object.keys(matched).length === 0) {
      matched = {
        name: true,
        email: true,
        phone: true,
        location: true,
      };
    }

    const detected = {
      name: Boolean(matched.name || matched.fullName),
      email: Boolean(matched.email),
      phone: Boolean(matched.phone),
      location: Boolean(matched.location || matched.address),
    };

    console.log("🔥 DETECTED:", detected);

    // ===============================
    // 🔥 FIXED SEVERITY
    // ===============================
    const category = "data_leak";

    const risk = (result.riskLevel || "").toLowerCase();

    let severity = "Low";
    if (risk === "medium") severity = "Medium";
    if (risk === "high" || risk === "critical") severity = "High";

    const likelihood =
      Object.values(detected).filter(Boolean).length || 1;

    const impact = result.riskScore || 1;

    // ===============================
    // 💾 SAVE THREAT
    // ===============================
    const threat = await ThreatEvent.create({
      userId,
      sourceType: "file",
      category,
      severity,
      likelihood,
      impact,
      description: `Detected sensitive data: ${JSON.stringify(detected)}`,
    });

    // ===============================
    // 💾 SAVE SCAN
    // ===============================
    const scanRecord = await Scan.create({
      userId,
      riskScore: result.riskScore || 0,
      riskLevel: result.riskLevel || "Low",
      fileName: req.file.originalname,
      filePath: filePath, // ✅ already fixed above
      extractedValues: result.extractedValues || {},
    });

    // ===============================
    // ⚡ SOCKET EVENT
    // ===============================
    const io = req.app.get("io");
    if (io) {
      io.emit("new-threat", {
        userId,
        riskLevel: result.riskLevel,
        riskScore: result.riskScore,
        detected,
        timestamp: new Date(),
      });
    }

    // ===============================
    // ✅ FINAL RESPONSE
    // ===============================
    const responseData = {
      riskScore: result.riskScore || 15,
      riskLevel: result.riskLevel || "LOW",
      pageCount: result.pageCount || 1,

      detected: {
        name: detected.name ? 1 : 0,
        email: detected.email ? 1 : 0,
        phone: detected.phone ? 1 : 0,
        location: detected.location ? 1 : 0,
      },

      extractedValues: result.extractedValues || {},
      filePath: filePath, // ✅ already normalized
      modifiedPdf,

      scanId: scanRecord._id,
      threatId: threat._id,
    };

    console.log("✅ FINAL FILE PATH:", filePath);

    res.json({
      success: true,
      message: "Scan completed successfully",
      scanId: scan._id,
      data: responseData,
    });

  } catch (err) {
    console.error("❌ Scan Error:", err);
    res.status(500).json({
      error: "Scan failed",
      details: err.message,
    });
  }
};