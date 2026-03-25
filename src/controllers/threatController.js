const ThreatEvent = require("../models/ThreatEvent");
const UserRiskProfile = require("../models/UserRiskProfile");
const UserAlert = require("../models/UserAlert");

const createThreatEvent = async (req, res) => {
  try {

    const { userId, sourceType, category, severity, likelihood, impact, description } = req.body;

    // Create Threat Event
    const event = new ThreatEvent({
      userId,
      sourceType,
      category,
      severity,
      likelihood,
      impact,
      description
    });

    await event.save();

    // -------- Alert Engine --------
    let alertType = "info";
    let alertMessage = "";

    if (severity === "High") {
      alertType = "critical";
      alertMessage = `Critical ${category} threat detected`;
    }
    else if (severity === "Medium") {
      alertType = "warning";
      alertMessage = `Potential ${category} activity detected`;
    }
    else {
      alertType = "info";
      alertMessage = `${category} event logged`;
    }

    const alert = new UserAlert({
      userId,
      type: alertType,
      message: alertMessage
    });

    await alert.save();

    // -------- Risk Engine --------
    const allEvents = await ThreatEvent.find({ userId });

    let totalRisk = 0;

    allEvents.forEach(e => {
      totalRisk += e.riskLevel;
    });

    let riskLevel = "Low";
    let securityHealth = 100;

    if (totalRisk > 10 && totalRisk <= 25) {
      riskLevel = "Medium";
      securityHealth = 80;
    }
    else if (totalRisk > 25 && totalRisk <= 50) {
      riskLevel = "High";
      securityHealth = 60;
    }
    else if (totalRisk > 50) {
      riskLevel = "Critical";
      securityHealth = 30;
    }

    await UserRiskProfile.findOneAndUpdate(
      { userId },
      {
        userId,
        currentRiskScore: totalRisk,
        riskLevel,
        securityHealth
      },
      { upsert: true }
    );

    // -------- SOCKET.IO REALTIME UPDATE --------
    const io = req.app.get("io");

    io.emit("threatDetected", {
      userId,
      category,
      severity,
      riskLevel,
      totalRisk
    });

    res.status(201).json({
      message: "Threat event created",
      event
    });

  } catch (error) {

    console.error("Threat Event Error:", error);

    res.status(500).json({
      message: "Server Error",
      error: error.message
    });

  }
};

module.exports = {
  createThreatEvent
};