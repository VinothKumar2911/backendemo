const pool = require('../config/db');
const { generateCustomId } = require('../utils/idGenerator');

/* =========================
   ADMIN DASHBOARD
========================= */
exports.getAdminDashboard = async (req, res) => {
  try {
    const [[doctorCount]] = await pool.query(
      `SELECT COUNT(*) AS count FROM doctors`
    );

    const [[patientCount]] = await pool.query(
      `SELECT COUNT(*) AS count FROM patients`
    );

    const [[videoCount]] = await pool.query(
      `SELECT COUNT(*) AS count FROM exercises`
    );

    const [[newDoctors]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM doctors
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    const [[newPatients]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM patients
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    const [[supportCount]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM support_requests
       WHERE status = 'open'`
    );

    const [recentActivity] = await pool.query(`
      (
        SELECT 'New Doctor Added' AS type, name AS title, created_at
        FROM doctors
        ORDER BY created_at DESC
        LIMIT 5
      )
      UNION ALL
      (
        SELECT 'New Patient Added', name, created_at
        FROM patients
        ORDER BY created_at DESC
        LIMIT 5
      )
      UNION ALL
      (
        SELECT 'Support Request', purpose, created_at
        FROM support_requests
        ORDER BY created_at DESC
        LIMIT 5
      )
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json({
      stats: {
        doctors: doctorCount.count,
        patients: patientCount.count,
        videos: videoCount.count,
      },
      alerts: {
        newDoctors: newDoctors.count,
        newPatients: newPatients.count,
        supportRequests: supportCount.count,
      },
      recentActivity,
    });
  } catch (err) {
    console.error('ADMIN DASHBOARD ERROR:', err);
    res.status(500).json({ message: 'Dashboard failed' });
  }
};

/* =========================
   CREATE DOCTOR (ADMIN)
========================= */
exports.createDoctor = async (req, res) => {
  const { phone, name, specialization } = req.body;

  if (!phone || !name) {
    return res.status(400).json({ message: 'Phone and name are required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[exists]] = await conn.query(
      `SELECT id FROM users_auth WHERE phone = ?`,
      [phone]
    );

    if (exists) {
      await conn.rollback();
      return res.status(409).json({ message: 'Doctor already exists' });
    }

    const doctorId = await generateCustomId('DOCTOR');

    await conn.query(
      `INSERT INTO users_auth (id, phone, role, is_verified)
       VALUES (?, ?, 'doctor', 0)`,
      [doctorId, phone]
    );

    await conn.query(
      `INSERT INTO doctors (doctor_id, user_auth_id, phone, name, specialization, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [doctorId, doctorId, phone, name, specialization || null]
    );

    await conn.commit();
    res.status(201).json({ message: 'Doctor created', doctorId });
  } catch (err) {
    await conn.rollback();
    console.error('CREATE DOCTOR ERROR:', err);
    res.status(500).json({ message: 'Failed to create doctor' });
  } finally {
    conn.release();
  }
};

/* =========================
   LIST DOCTORS
========================= */
exports.listDoctors = async (req, res) => {
  const [rows] = await pool.query(`
    SELECT doctor_id, name, phone, specialization, status, created_at
    FROM doctors
    ORDER BY created_at DESC
  `);
  res.json(rows);
};

/* =========================
   UPDATE DOCTOR STATUS
========================= */
exports.updateDoctorStatus = async (req, res) => {
  const { status } = req.body;

  await pool.query(
    `UPDATE doctors SET status = ? WHERE doctor_id = ?`,
    [status, req.params.id]
  );

  res.json({ message: 'Doctor status updated' });
};

/* =========================
   LIST PATIENTS
========================= */
exports.listPatients = async (req, res) => {
  const [rows] = await pool.query(`
    SELECT patient_id, name, phone, status, created_at
    FROM patients
    ORDER BY created_at DESC
  `);
  res.json(rows);
};

/* =========================
   LIST VIDEOS (EXERCISES)
========================= */
exports.listVideos = async (req, res) => {
  const [rows] = await pool.query(`
    SELECT exercise_id, title, status, created_at
    FROM exercises
    ORDER BY created_at DESC
  `);
  res.json(rows);
};

/* =========================
   SUPPORT REQUESTS
========================= */
exports.listSupportRequests = async (req, res) => {
  const [rows] = await pool.query(`
    SELECT *
    FROM support_requests
    ORDER BY created_at DESC
  `);
  res.json(rows);
};

/* =========================
   ANALYTICS
========================= */
exports.getAnalytics = async (req, res) => {
  const [[dailyActive]] = await pool.query(`
    SELECT COUNT(DISTINCT user_auth_id) AS count
    FROM user_sessions
    WHERE DATE(created_at) = CURDATE()
  `);

  const [[monthlyActive]] = await pool.query(`
    SELECT COUNT(DISTINCT user_auth_id) AS count
    FROM user_sessions
    WHERE MONTH(created_at) = MONTH(CURDATE())
  `);

  const [[engagement]] = await pool.query(`
    SELECT
      (COUNT(DISTINCT patient_id) / (SELECT COUNT(*) FROM patients)) * 100 AS percent
    FROM patient_exercises
  `);

  res.json({
    dailyActiveUsers: dailyActive.count || 0,
    monthlyActiveUsers: monthlyActive.count || 0,
    doctorParticipation: Math.round(engagement.percent || 0),
    patientEngagement: Math.round(engagement.percent || 0),
  });
};


/* =========================
   GET ADMIN PROFILE
========================= */
exports.getAdminProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [[admin]] = await pool.query(
      `SELECT a.name, u.phone
       FROM admins a
       JOIN users_auth u ON a.user_auth_id = u.id
       WHERE u.id = ?`,
      [userId]
    );

    res.json(admin);
  } catch (err) {
    console.error("GET ADMIN PROFILE ERROR:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};
/* =========================
   UPDATE ADMIN PROFILE
========================= */
exports.updateAdminProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;

    // 🔥 Check duplicate phone
    const [[exists]] = await pool.query(
      `SELECT id FROM users_auth WHERE phone = ? AND id != ?`,
      [phone, userId]
    );

    if (exists) {
      return res.status(409).json({ message: "Phone already in use" });
    }

    // 🔥 UPDATE PHONE (LOGIN TABLE)
    await pool.query(
      `UPDATE users_auth SET phone = ? WHERE id = ?`,
      [phone, userId]
    );

    // 🔥 UPDATE NAME (PROFILE TABLE)
    await pool.query(
      `UPDATE admins SET name = ?, phone = ? WHERE user_auth_id = ?`,
      [name, phone, userId]
    );

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("UPDATE ADMIN PROFILE ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
};
