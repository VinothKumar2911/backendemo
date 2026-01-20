
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const { generateCustomId } = require('../utils/idGenerator');


/**
 * Normalize phone number
 */
function normalizePhone(phone) {
  phone = phone.replace(/\D/g, '');

  if (phone.length === 10) return '+91' + phone;
  if (phone.length === 12 && phone.startsWith('91')) return '+' + phone;

  throw new Error('Invalid phone number');
}

/**
 * =========================
 * SEND OTP (STATIC)
 * =========================
 */
exports.sendOtp = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);

    const [[user]] = await pool.query(
      `SELECT id, role FROM users_auth WHERE phone = ?`,
      [phone]
    );

    if (!user) {
      return res.status(404).json({ message: 'Phone number not registered' });
    }

    // Remove old OTPs
    await pool.query(`DELETE FROM otp_verification WHERE phone = ?`, [phone]);

    const otp = '1234'; // STATIC OTP
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      `INSERT INTO otp_verification (phone, otp, expires_at)
       VALUES (?, ?, ?)`,
      [phone, otp, expiresAt]
    );

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('SEND OTP ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.verifyOtp = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'OTP required' });
    }

    const [[otpRow]] = await pool.query(
      `SELECT * FROM otp_verification
       WHERE phone = ? AND otp = ? AND expires_at > NOW()`,
      [phone, otp]
    );

    if (!otpRow) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    const [[user]] = await pool.query(
      `SELECT id, role FROM users_auth WHERE phone = ?`,
      [phone]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mark verified
    await pool.query(
      `UPDATE users_auth SET is_verified = 1 WHERE id = ?`,
      [user.id]
    );

    // Cleanup OTP
    await pool.query(`DELETE FROM otp_verification WHERE phone = ?`, [phone]);

    // Patient must be created by doctor
    if (user.role === 'patient') {
      const [[patient]] = await pool.query(
        `SELECT patient_id FROM patients WHERE user_auth_id = ?`,
        [user.id]
      );

      if (!patient) {
        return res.status(403).json({
          message: 'Patient profile not created. Contact doctor.',
        });
      }
    }

const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);
await pool.query(
  `
  INSERT INTO user_sessions
  (session_id, user_auth_id, role)
  VALUES (?, ?, ?)
  `,
  [
    await generateCustomId('USER_SESSION'),
    user.id,
    user.role
  ]
);

    res.json({
      message: 'OTP verified successfully',
      token,
      role: user.role,
    });
  } catch (err) {
    console.error('VERIFY OTP ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * =========================
 * CREATE SUPPORT REQUEST
 * =========================
 */
exports.createSupportRequest = async (req, res) => {
  try {
    const { name, age, gender, phone, purpose } = req.body;

    if (!name || !age || !gender || !phone || !purpose) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const phoneNormalized = phone.replace(/\D/g, '');
    if (phoneNormalized.length < 10) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    await pool.query(
      `
      INSERT INTO support_requests
      (name, age, gender, phone, purpose, status)
      VALUES (?, ?, ?, ?, ?, 'open')
      `,
      [name, age, gender, phone, purpose]
    );

    res.json({ message: 'Support request created successfully' });
  } catch (err) {
    console.error('SUPPORT ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



