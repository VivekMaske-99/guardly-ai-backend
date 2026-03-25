const express = require("express");
const router = express.Router();

const threatController = require("../controllers/threatController");

router.post("/threat-event", threatController.createThreatEvent);

module.exports = router;