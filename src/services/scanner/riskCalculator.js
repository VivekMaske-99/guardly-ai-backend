/**
 * Risk Calculator Module
 * Calculates privacy risk score based on detected and matched data
 */

class RiskCalculator {
  /**
   * Calculate risk score
   * @param {Object} matchedData - Matched data object with boolean flags
   * @param {Array} snippets - Extracted text snippets
   * @param {Object} entities - All detected entities
   * @returns {Object} { riskScore: number, riskLevel: string, breakdown: Object }
   */
  static calculateRisk(matchedData, snippets, entities = {}) {
    const breakdown = {
      nameScore: 0,
      emailScore: 0,
      phoneScore: 0,
      locationScore: 0,
    };

    // Calculate component scores
    if (matchedData.name) breakdown.nameScore = 15;
    if (matchedData.email) breakdown.emailScore = 25;
    if (matchedData.phone) breakdown.phoneScore = 30;
    if (matchedData.location) breakdown.locationScore = 15;

    // Calculate total (capped at 100)
    let totalScore =
      breakdown.nameScore +
      breakdown.emailScore +
      breakdown.phoneScore +
      breakdown.locationScore;
    totalScore = Math.min(totalScore, 100);

    // Determine risk level
    const riskLevel = this._determineRiskLevel(totalScore);

    return {
      riskScore: totalScore,
      riskLevel,
      breakdown,
      snippetsCount: snippets.length,
    };
  }

  /**
   * Determine risk level based on score
   * @param {number} score - Risk score (0-100)
   * @returns {string} Risk level: LOW, MEDIUM, HIGH, CRITICAL
   */
  static _determineRiskLevel(score) {
    if (score === 0) return "LOW";
    if (score <= 15) return "LOW";
    if (score <= 30) return "LOW";
    if (score <= 60) return "MEDIUM";
    if (score <= 85) return "HIGH";
    return "CRITICAL";
  }

  /**
   * Get risk recommendations
   * @param {Object} matchedData - Matched data
   * @param {number} riskScore - Calculated risk score
   * @returns {Array} Array of recommendations
   */
  static getRecommendations(matchedData, riskScore) {
    const recommendations = [];

    if (matchedData.name) {
      recommendations.push(
        "Your full name is exposed in this document. Consider redacting or removing personal identifiers.",
      );
    }

    if (matchedData.email) {
      recommendations.push(
        "Your email address is visible. This could lead to spam or phishing attacks. Consider using a privacy-focused email.",
      );
    }

    if (matchedData.phone) {
      recommendations.push(
        "Your phone number is exposed. This is a high-risk data point. Consider redacting this document.",
      );
    }

    if (matchedData.location) {
      recommendations.push(
        "Your location information is visible. Be cautious about documents containing this data.",
      );
    }

    if (riskScore >= 60) {
      recommendations.push(
        "This document contains multiple personal data points. Review and consider redacting before sharing.",
      );
    }

    return recommendations;
  }
}

module.exports = RiskCalculator;
