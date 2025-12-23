const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { generateToken } = require('../config/jwt');

/**
 * =========================
 * SEND OTP (DEMO)
 * =========================
 * - No SMS
 * - Static OTP = 1234
 */
exports.sendOtp = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      message: 'Phone is required'
    });
  }

  // Demo response
  return res.json({
    message: 'Demo OTP sent',
    otp: '1234'
  });
};

/**
 * =========================
 * VERIFY OTP (DEMO)
 * =========================
 * - OTP is always 1234
 * - Role decided from DB
 */
const jwt = require('jsonwebtoken');

exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    console.log("VERIFY OTP:", phone, otp);

    // 🔹 DEMO STATIC OTP
    if (otp !== '1234') {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    // 🔹 DEMO ROLE LOGIC
    let role = 'patient';
    if (phone === '9000000001') role = 'doctor';
    if (phone === '9000000003') role = 'admin';

    // 🔹 CREATE JWT (DEMO)
    const token = jwt.sign(
      { phone, role },
      process.env.JWT_SECRET || 'demo_secret',
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      token,
      role,
    });

  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    return res.status(500).json({ message: 'Server error' });
  }
};

