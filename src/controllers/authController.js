const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "guardly-secret";

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
    });

    res.status(201).json({
      message: "User created successfully",
      userId: user._id,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      userId: user._id,
      name: user.name,
      email: user.email,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};