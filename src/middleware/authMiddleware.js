const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // 🔥 Get Authorization Header
    const authHeader = req.headers.authorization;

    console.log("🔐 AUTH HEADER:", authHeader);

    // ❌ No header
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    // ❌ Wrong format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Invalid auth format" });
    }

    // 🔥 Extract token safely
    const token = authHeader.split(" ")[1];

    console.log("🔑 TOKEN:", token);

    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    // 🔥 Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "guardly-secret"
    );

    console.log("✅ DECODED:", decoded);

    // 🔥 Attach userId
    req.userId = decoded.userId;

    next();

  } catch (error) {
    console.error("❌ AUTH ERROR:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;