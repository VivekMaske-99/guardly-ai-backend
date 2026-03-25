const PDFDocument = require("pdfkit");
const { Document, Packer, Paragraph, HeadingLevel } = require("docx");

const ThreatEvent = require("../models/ThreatEvent");
const UserRisk = require("../models/UserRisk");
const UserAlert = require("../models/UserAlert");
const TextExtractor = require("../services/scanner/textExtractor");
const { generateScanReport } = require("../services/groqService");

const fs = require("fs");
const { modifyPdf } = require("../services/scanner/pdfModifier");
const { detectSensitiveData } = require("../services/aiDetector"); // ✅ AI ADDED
const Scan = require("../models/Scan");

/* ===============================
   Fetch Report Data
================================ */
async function getReportData(userId) {
  const riskProfile = await UserRisk.findOne({ userId });
  const threats = await ThreatEvent.find({ userId }).sort({ createdAt: -1 });
  const alerts = await UserAlert.find({ userId });

  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const weeklyThreats = threats.filter(
    (t) => new Date(t.createdAt) >= last7Days
  );

  const categoryMap = {};
  threats.forEach((t) => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + 1;
  });

  return { riskProfile, threats, alerts, weeklyThreats, categoryMap };
}

/* ===============================
   PDF REPORT
================================ */
exports.generatePDFReport = async (req, res) => {
  try {
    const { userId } = req.params;
    const { riskProfile, threats } = await getReportData(userId);

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=GuardLY_Report_${userId}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(22).text("GuardLY Security Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(16).text("Risk Overview");
    doc.fontSize(12).text(`Risk Score: ${riskProfile?.riskScore || 0}`);
    doc.text(`Security Health: ${riskProfile?.securityHealth || 100}%`);

    doc.moveDown();

    doc.fontSize(16).text("Threat Summary");
    threats.slice(0, 10).forEach((t, i) => {
      doc.fontSize(12).text(
        `${i + 1}. ${t.category} | ${t.severity} | ${t.riskLevel}`
      );
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: "PDF failed" });
  }
};

/* ===============================
   DOC REPORT
================================ */
exports.generateDOCReport = async (req, res) => {
  try {
    const { userId } = req.params;
    const { riskProfile, threats } = await getReportData(userId);

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: "GuardLY Security Report",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph(`User ID: ${userId}`),
            new Paragraph(`Risk Score: ${riskProfile?.riskScore || 0}`),
            ...threats.slice(0, 10).map(
              (t) =>
                new Paragraph(
                  `${t.category} | ${t.severity} | ${t.riskLevel}`
                )
            ),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=GuardLY_Report_${userId}.docx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: "DOC failed" });
  }
};

/* ================= 🔥 AI SCAN REPORT ================= */
exports.generateAIScanReport = async (req, res) => {
  try {
    const { filePath, extractedValues, riskScore, riskLevel } = req.body;

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(400).json({ error: "File not found" });
    }

    const extractedData = await TextExtractor.extractFromFile(filePath);
    const text = extractedData.text.slice(0, 3000);

    const prompt = `
Analyze this document and generate a professional cybersecurity report.

Document:
${text}

Detected Data:
${JSON.stringify(extractedValues)}

Risk Score: ${riskScore}
Risk Level: ${riskLevel}

Format STRICTLY like this:
1. Document Overview
2. Detected Sensitive Data
3. Risk Analysis
4. Security Assessment
5. Recommendations (3 points)
`;

    const aiText = await generateScanReport(prompt);

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=GuardLY_AI_Report.pdf"
    );

    doc.pipe(res);

    doc.fontSize(20).text("GuardLY AI Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Risk Score: ${riskScore}`);
    doc.text(`Risk Level: ${riskLevel}`);
    doc.moveDown();

    Object.entries(extractedValues || {}).forEach(([k, v]) => {
      doc.text(`${k.toUpperCase()}: ${v}`);
    });

    doc.moveDown();
    doc.text(aiText);

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= 🔥 AI + REDACTION ================= */
exports.redactPDF = async (req, res) => {
  try {
    const { scanId } = req.params;

    const scan = await Scan.findById(scanId);
    if (!scan) {
      return res.status(404).json({ error: "Scan not found" });
    }

    const filePath = scan.filePath;

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(400).json({ error: "File not found" });
    }

    const originalBuffer = fs.readFileSync(filePath);

    // 🔥 STEP 1 — Extract text
    const extractedData = await TextExtractor.extractFromFile(filePath);
    const fullText = extractedData.text || "";

    // 🤖 STEP 2 — AI Detection
    const aiDetectedValues = await detectSensitiveData(fullText);
    console.log("🤖 AI DETECTED:", aiDetectedValues);

    let modifiedBuffer;

    try {
      const pdfBase64 = originalBuffer.toString("base64");

      // 🔥 STEP 3 — Redaction using AI values
      const modifiedBase64 = await modifyPdf(
        pdfBase64,
        [],
        "redact",
        aiDetectedValues
      );

      modifiedBuffer = Buffer.from(modifiedBase64, "base64");

      // ✅ Validate output
      if (!modifiedBuffer || modifiedBuffer.length < 1000) {
        throw new Error("Invalid PDF generated");
      }
    } catch (e) {
      console.log("⚠️ Falling back to original PDF");
      modifiedBuffer = originalBuffer;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=redacted.pdf");
    res.setHeader("Content-Length", modifiedBuffer.length);

    res.end(modifiedBuffer);
  } catch (err) {
    console.error("❌ Redact Error:", err);
    res.status(500).json({ error: "Redact failed" });
  }
};