const express = require('express');
const cors = require('cors');

const apiRoutes = require('./routes/apiRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes'); // ✅ ADD THIS
const reportRoutes = require("./routes/reportRoutes");



const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', apiRoutes);
app.use('/', dashboardRoutes); // ✅ ADD THIS
app.use("/", reportRoutes);

module.exports = app;
