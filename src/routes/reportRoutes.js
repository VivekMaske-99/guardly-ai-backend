const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

router.get("/report/pdf/:userId", reportController.generatePDFReport);
router.get("/report/doc/:userId", reportController.generateDOCReport);

module.exports = router;
