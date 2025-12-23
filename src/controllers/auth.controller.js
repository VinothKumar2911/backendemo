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
    console.log("VERIFY OTP HIT:", phone, otp);

    // 1️⃣ Validate input
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP required' });
    }

    // 2️⃣ Check OTP
    if (otp !== '1234') {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    // 3️⃣ Fetch user from DB
    const [rows] = await pool.query(
      `SELECT id, role FROM users_auth WHERE phone = ?`,
      [phone]
    );

    console.log("USER QUERY RESULT:", rows);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'User not found in DB' });
    }

    const user = rows[0];

    // 4️⃣ Generate JWT with userId
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET || 'demo_secret',
      { expiresIn: '1d' }
    );

    // 5️⃣ Success
    return res.status(200).json({
      token,
      role: user.role,
    });

  } catch (err) {
    console.error("VERIFY OTP SERVER ERROR:", err);
    return res.status(500).json({ message: 'Server error' });
  }
};


