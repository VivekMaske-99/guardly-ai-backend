const ThreatEvent = require("../models/ThreatEvent");

const getThreatSummary = async (req, res) => {

  try {

    const { userId } = req.params;

    const events = await ThreatEvent.find({ userId });

    if (events.length === 0) {
      return res.json({
        topThreat: "None",
        weeklyThreatCount: 0,
        mostFrequentCategory: "None",
        trend: "Stable"
      });
    }

    let categoryCount = {};
    let severityCount = { Low: 0, Medium: 0, High: 0 };

    events.forEach(event => {

      categoryCount[event.category] =
        (categoryCount[event.category] || 0) + 1;

      if (severityCount[event.severity] !== undefined) {
        severityCount[event.severity]++;
      }

    });

    const topThreat =
      Object.keys(severityCount).reduce((a, b) =>
        severityCount[a] > severityCount[b] ? a : b
      );

    const mostFrequentCategory =
      Object.keys(categoryCount).reduce((a, b) =>
        categoryCount[a] > categoryCount[b] ? a : b
      );

    res.json({
      topThreat,
      mostFrequentCategory,
      weeklyThreatCount: events.length,
      trend: events.length > 5 ? "Increasing" : "Stable"
    });

  } catch (error) {

    console.error("Threat Summary Error:", error);

    res.status(500).json({
      message: "Server Error"
    });

  }

};

module.exports = { getThreatSummary };