const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

/**
 * =========================
 * SEND OTP (DEMO)
 * =========================
 */
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Phone is required' });
    }

    // 🔥 CHECK USER EXISTS
    const [[user]] = await pool.query(
      `SELECT id, role FROM users_auth WHERE phone = ?`,
      [phone]
    );

    if (!user) {
      return res.status(404).json({
        message: 'Phone number not registered'
      });
    }

    const otp = '1234';
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      `INSERT INTO otp_verification (phone, otp, expires_at)
       VALUES (?, ?, ?)`,
      [phone, otp, expiresAt]
    );

    res.json({ message: 'OTP sent', otp });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


/**
 * =========================
 * VERIFY OTP + CREATE USER
 * =========================
 */

/**
 * =========================
 * VERIFY OTP (ROLE FROM DB)
 * =========================
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP required' });
    }

    if (otp !== '1234') {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    // 1️⃣ Get auth user
    const [[user]] = await pool.query(
      `SELECT id, role FROM users_auth WHERE phone = ?`,
      [phone]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2️⃣ AUTO CREATE PROFILE (KEY PART)
    if (user.role === 'doctor') {
      const [[doctor]] = await pool.query(
        `SELECT id FROM doctors WHERE user_auth_id = ?`,
        [user.id]
      );

      if (!doctor) {
        await pool.query(
          `INSERT INTO doctors (id, user_auth_id, phone)
           VALUES (?, ?, ?)`,
          [uuidv4(), user.id, phone]
        );
      }
    }

    // PATIENT AUTO-LINK (NO DUPLICATES)
    if (user.role === 'patient') {
      const [[patient]] = await pool.query(
        `SELECT id FROM patients WHERE user_auth_id = ?`,
        [user.id]
      );

      if (!patient) {
        return res.status(403).json({
          message: 'Patient profile not created by doctor yet'
        });
      }
    }


    // 3️⃣ Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      message: 'OTP verified successfully',
      token,
      role: user.role,
    });

  } catch (err) {
    console.error('VERIFY OTP ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
