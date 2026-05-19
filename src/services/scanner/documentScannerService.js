/**
 * Document Scanner Service (FINAL FIXED + OCR SAFE)
 */

const TextExtractor = require("./textExtractor");
const RiskCalculator = require("./riskCalculator");
const fs = require("fs");

class DocumentScannerService {
  static async scanFile(filePath, userProfile) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    if (!userProfile || !userProfile.fullName) {
      throw new Error("Invalid user profile");
    }

    const extractedData = await TextExtractor.extractFromFile(filePath);

    return this._processScanData(extractedData, userProfile, "file");
  }

  static async scanURL(url, userProfile) {
    if (!url || typeof url !== "string") {
      throw new Error("Invalid URL provided");
    }

    if (!userProfile || !userProfile.fullName) {
      throw new Error("Invalid user profile");
    }

    const extractedData = await TextExtractor.extractFromURL(url);

    return this._processScanData(extractedData, userProfile, "url");
  }

  static _processScanData(extractedData, userProfile, source) {
    // 🔥 SAFE EXTRACTION (CRITICAL FIX)
    const pages = extractedData?.pages || [];
    const fileType = extractedData?.fileType || "unknown";

    // 🔥 HANDLE BOTH CASES (pages OR text)
    let fullText = "";

    if (pages.length > 0) {
      fullText = pages.map((p) => p.text).join(" ");
    } else {
      fullText = extractedData?.text || "";
    }

    fullText = fullText.toLowerCase();

    console.log("🔥 FULL TEXT PREVIEW:", fullText.slice(0, 200));

    const scanReport = {
      source,
      fileType,
      timestamp: new Date().toISOString(),
      userId: userProfile.userId,

      matchedData: {
        name: false,
        email: false,
        phone: false,
        location: false,
      },

      occurrences: {
        name: [],
        email: [],
        phone: [],
        location: [],
      },

      riskScore: 0,
      riskLevel: "LOW",
      recommendations: [],
      extractedTextSnippets: [],

      // 🔥 SAFE PAGE COUNT
      pageCount: pages.length > 0 ? pages.length : 1,

      extractedValues: {
        name: null,
        email: null,
        phone: null,
        location: null,
      },

      details: {
        pagesScanned: [],
      },
    };

    // ===============================
    // 🔥 DETECTION
    // ===============================
    const detected = {
      name: fullText.includes(userProfile.fullName.toLowerCase()),

      email: /[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(fullText),

      phone: /(\+91[\s-]?)?[6-9]\d{9}/.test(fullText),

      location:
        fullText.includes("mumbai") ||
        fullText.includes("navi mumbai") ||
        fullText.includes("india"),
    };

    console.log("🔥 DETECTED:", detected);

    // ===============================
    // 🔥 EXTRACT VALUES
    // ===============================
    const extractedValues = {
      name: null,
      email: null,
      phone: null,
      location: null,
    };

    const nameMatch = fullText.match(/[a-z]+ [a-z]+/i);
    if (nameMatch) extractedValues.name = nameMatch[0];

    const emailMatch = fullText.match(/[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/);
    if (emailMatch) extractedValues.email = emailMatch[0];

    const phoneMatch = fullText.match(/(\+91[\s-]?)?[6-9]\d{9}/);
    if (phoneMatch) extractedValues.phone = phoneMatch[0];

    const locationMatch = fullText.match(/(mumbai|navi mumbai|india)/i);
    if (locationMatch) extractedValues.location = locationMatch[0];

    console.log("🔥 EXTRACTED VALUES:", extractedValues);

    // ===============================
    // APPLY
    // ===============================
    scanReport.matchedData = detected;
    scanReport.extractedValues = extractedValues;

    if (detected.name) scanReport.occurrences.name.push(1);
    if (detected.email) scanReport.occurrences.email.push(1);
    if (detected.phone) scanReport.occurrences.phone.push(1);
    if (detected.location) scanReport.occurrences.location.push(1);

    scanReport.extractedTextSnippets.push(fullText.slice(0, 150));

    // ===============================
    // 🔥 RISK
    // ===============================
    const riskData = RiskCalculator.calculateRisk(
      scanReport.matchedData,
      scanReport.extractedTextSnippets
    );

    scanReport.riskScore = riskData.riskScore;
    scanReport.riskLevel = riskData.riskLevel;
    scanReport.riskBreakdown = riskData.breakdown;

    scanReport.recommendations = RiskCalculator.getRecommendations(
      scanReport.matchedData,
      riskData.riskScore
    );

    return scanReport;
  }
}

module.exports = DocumentScannerService;