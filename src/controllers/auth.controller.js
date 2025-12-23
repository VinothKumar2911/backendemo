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
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        message: 'Phone and OTP are required'
      });
    }

    // ✅ DEMO STATIC OTP CHECK
    if (otp !== '1234') {
      return res.status(401).json({
        message: 'Invalid OTP (Demo)'
      });
    }

    // Check if user already exists
    const [users] = await pool.query(
      `SELECT * FROM users_auth WHERE phone = ?`,
      [phone]
    );

    let user;

    if (users.length === 0) {
      // New user → default role = patient
      const userId = uuidv4();

      await pool.query(
        `INSERT INTO users_auth (id, phone, role, is_verified)
         VALUES (?, ?, 'patient', true)`,
        [userId, phone]
      );

      user = {
        id: userId,
        role: 'patient'
      };
    } else {
      user = users[0];
    }

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      role: user.role
    });

    return res.json({
      message: 'Login successful (Demo)',
      token,
      role: user.role
    });

  } catch (err) {
    console.error('VERIFY OTP ERROR:', err);
    return res.status(500).json({
      message: 'Login failed'
    });
  }
};
