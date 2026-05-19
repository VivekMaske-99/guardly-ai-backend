const DocumentScannerService = require("../services/scanner/documentScannerService");
const ThreatEvent = require("../models/ThreatEvent");
const Scan = require("../models/Scan");
const { modifyPdf } = require("../services/scanner/pdfModifier");
const fs = require("fs");

exports.scanFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const filePath = req.file.path.replace(/\\/g, "/");

    const userProfile = {
      userId,
      fullName: req.body.fullName || "User",
      email: req.body.email || "",
      phone: req.body.phone || "",
      location: req.body.location || "",
    };

    // 🔍 Scan
    const result = await DocumentScannerService.scanFile(
      filePath,
      userProfile
    );

    // 🔴 Redaction preview
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

    // ✅ Detection
    const detected = {
      name: !!result?.extractedValues?.name,
      email: !!result?.extractedValues?.email,
      phone: !!result?.extractedValues?.phone,
      location: !!result?.extractedValues?.location,
    };

    console.log("🔥 DETECTED:", detected);

    // 🔥 Risk
    let riskLevel = (result.riskLevel || "Low").toLowerCase();

if (riskLevel === "high") riskLevel = "High";
else if (riskLevel === "medium") riskLevel = "Medium";
else riskLevel = "Low";
    const riskScore = result.riskScore || 10;

    // 💾 Save threat
    const threat = await ThreatEvent.create({
      userId,
      sourceType: "file",
      category: "data_leak",
      severity: riskLevel,
      likelihood: Object.values(detected).filter(Boolean).length || 1,
      impact: riskScore,
      description: `Detected: ${JSON.stringify(detected)}`,
    });

    // 💾 Save scan
    const scanRecord = await Scan.create({
      userId,
      riskScore,
      riskLevel,
      fileName: req.file.originalname,
      filePath,
      extractedValues: result.extractedValues || {},
    });

    // ✅ FINAL RESPONSE
    res.json({
      success: true,
      message: "Scan completed successfully",
      scanId: scanRecord._id, // 🔥 FIXED
      data: {
        riskScore,
        riskLevel,
        pageCount: result.pageCount || 1,
        detected: {
          name: detected.name ? 1 : 0,
          email: detected.email ? 1 : 0,
          phone: detected.phone ? 1 : 0,
          location: detected.location ? 1 : 0,
        },
        extractedValues: result.extractedValues || {},
        filePath,
        modifiedPdf,
      },
    });

  } catch (err) {
    console.error("❌ Scan Error:", err);
    res.status(500).json({
      error: "Scan failed",
      details: err.message,
    });
  }
};