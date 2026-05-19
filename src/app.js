// src/app.js
const express = require("express");
const cors = require("cors");

const app = express();

// middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://your-frontend.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
const apiRoutes = require("./routes/apiRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
const authRoutes = require("./routes/authRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const scanRoutes = require("./routes/scanRoutes");
const userRoutes = require("./routes/userRoutes"); // 🔥 NEW

// ✅ CLEAN ROUTING STRUCTURE
app.use("/api/auth", authRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/user", userRoutes);          // 🔥 PROTECTED ROUTES

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/analytics", analyticsRoutes);

// optional base route
app.use("/api", apiRoutes);

module.exports = app;