const PDFDocument = require("pdfkit");
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require("docx");

const ThreatEvent = require("../models/ThreatEvent");
const UserRisk = require("../models/UserRisk");
const UserAlert = require("../models/UserAlert");

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

  return {
    riskProfile,
    threats,
    alerts,
    weeklyThreats,
    categoryMap
  };
}

/* ===============================
   PDF REPORT (PRO VERSION)
================================ */
exports.generatePDFReport = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      riskProfile,
      threats,
      alerts,
      weeklyThreats,
      categoryMap
    } = await getReportData(userId);

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=GuardLY_Professional_Report_${userId}.pdf`
    );

    doc.pipe(res);

    /* Cover */
    doc.fontSize(22).text("GuardLY Security Intelligence Report", {
      align: "center"
    });
    doc.moveDown(2);

    /* Executive Summary */
    doc.fontSize(16).text("1. Executive Summary");
    doc.moveDown(0.5);
    doc.fontSize(12).text(
      `User ${userId} currently has a risk score of ${
        riskProfile?.riskScore || 0
      } with security health at ${
        riskProfile?.securityHealth || 100
      }%. Total recorded threats: ${threats.length}.`
    );
    doc.moveDown();

    /* Risk Overview */
    doc.fontSize(16).text("2. Risk Overview");
    doc.fontSize(12).text(`Risk Score: ${riskProfile?.riskScore || 0}`);
    doc.text(`Security Health: ${riskProfile?.securityHealth || 100}%`);
    doc.text(`High Threat Count: ${riskProfile?.highRisk || 0}`);
    doc.text(`Medium Threat Count: ${riskProfile?.mediumRisk || 0}`);
    doc.text(`Low Threat Count: ${riskProfile?.lowRisk || 0}`);
    doc.moveDown();

    /* Risk Calculation Explanation */
    doc.fontSize(16).text("3. Risk Calculation Model");
    doc.moveDown(0.5);
    doc.fontSize(12).text(
      "GuardLY risk score is inspired by CVSS (Common Vulnerability Scoring System). Each detected threat is assigned a severity weight:"
    );
    doc.text("Low = 2 points");
    doc.text("Medium = 5 points");
    doc.text("High = 8–10 points");
    doc.text(
      "The total weighted average of recent threats determines the overall risk score (1–10 scale)."
    );
    doc.moveDown();

    /* Weekly Comparison */
    doc.fontSize(16).text("4. Weekly Activity Summary");
    doc.moveDown(0.5);
    doc.fontSize(12).text(
      `Threats detected in last 7 days: ${weeklyThreats.length}`
    );
    doc.moveDown();

    /* Category Breakdown */
    doc.fontSize(16).text("5. Threat Category Breakdown");
    doc.moveDown(0.5);
    Object.keys(categoryMap).forEach((category) => {
      doc.fontSize(12).text(
        `${category} : ${categoryMap[category]} occurrences`
      );
    });
    doc.moveDown();

    /* Detailed Threat Log */
    doc.fontSize(16).text("6. Detailed Threat Log");
    doc.moveDown(0.5);
    threats.slice(0, 15).forEach((t, index) => {
      doc.fontSize(12).text(
        `${index + 1}. ${t.category} | Severity: ${t.severity} | Risk: ${
          t.riskLevel
        } | Date: ${new Date(t.createdAt).toLocaleDateString()}`
      );
    });
    doc.moveDown();

    /* Alerts */
    doc.fontSize(16).text("7. Security Alerts");
    doc.moveDown(0.5);
    if (alerts.length === 0) {
      doc.fontSize(12).text("No alerts generated.");
    } else {
      alerts.forEach((a, index) => {
        doc.fontSize(12).text(`${index + 1}. ${a.message}`);
      });
    }
    doc.moveDown();

    /* AI Recommendations */
    doc.fontSize(16).text("8. AI Recommendations");
    doc.moveDown(0.5);
    doc.fontSize(12).text(
      "• Enable Two-Factor Authentication\n" +
        "• Avoid clicking unknown financial links\n" +
        "• Keep devices updated with latest security patches\n" +
        "• Monitor suspicious activity regularly"
    );

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate PDF report" });
  }
};

/* ===============================
   DOC REPORT (PRO VERSION)
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
              text: "GuardLY Security Intelligence Report",
              heading: HeadingLevel.HEADING_1
            }),
            new Paragraph(`User ID: ${userId}`),
            new Paragraph(
              `Risk Score: ${riskProfile?.riskScore || 0}`
            ),
            new Paragraph(
              `Security Health: ${riskProfile?.securityHealth || 100}%`
            ),
            new Paragraph(" "),
            new Paragraph({
              text: "Threat Summary",
              heading: HeadingLevel.HEADING_2
            }),
            ...threats.slice(0, 10).map(
              (t) =>
                new Paragraph(
                  `${t.category} | Severity: ${t.severity} | Risk Level: ${t.riskLevel}`
                )
            )
          ]
        }
      ]
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=GuardLY_Professional_Report_${userId}.docx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate DOC report" });
  }
};
