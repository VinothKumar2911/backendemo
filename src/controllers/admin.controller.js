  const pool = require('../config/db');
  const { generateCustomId } = require('../utils/idGenerator');
  const { normalizePhone } = require('../utils/phone');
  const { getSignedUrl } = require('../config/s3');


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

      const [[supportCount]] = await pool.query(
        `SELECT COUNT(*) AS count FROM support_requests`
      );

      // 🔥 RECENT ACTIVITY = SUPPORT REQUESTS ONLY
      const [recentActivity] = await pool.query(`
        SELECT
          id,
          purpose AS title,
          created_at,
          status
        FROM support_requests
        ORDER BY created_at DESC
        LIMIT 5
      `);

      res.json({
        stats: {
          doctors: doctorCount.count,
          patients: patientCount.count,
          videos: videoCount.count,
        },
        alerts: {
          supportRequests: supportCount.count,
        },
        recentActivity,
      });
    } catch (err) {
      console.error('ADMIN DASHBOARD ERROR:', err);
      res.status(500).json({ message: 'Dashboard failed' });
    }
  };

// const { getSignedUrl } = require('../utils/s3');

// controllers/exerciseController.js
// const pool = require('../config/db');
// const { getSignedUrl } = require('../utils/s3');

exports.getPatientExercises = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT exercise_id, name, video_s3_url 
       FROM exercises 
       WHERE status = 'active'`
    );

    const data = rows.map((row) => ({
      id: row.exercise_id,
      name: row.name,
      videoUrl: getSignedUrl(row.video_s3_url),
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch exercises' });
  }
};





  /* =========================
    LIST DOCTORS
  ========================= */
  exports.listDoctors = async (req, res) => {
    const [rows] = await pool.query(`
      SELECT
        d.doctor_id,
        d.user_auth_id,
        d.name,
        d.phone,
        d.email,
        d.gender,
        d.specialization,
        d.experience,
        d.registration_id,
        d.status,
        d.created_at,
        d.updated_at,

        COUNT(DISTINCT p.patient_id) AS total_patient,
        COUNT(
          DISTINCT CASE
            WHEN p.status = 'active' THEN p.patient_id
          END
        ) AS patient_active,

        COUNT(DISTINCT e.exercise_id) AS exercise_uploaded

      FROM doctors d
      LEFT JOIN patients p
        ON p.assigned_doctor_id = d.doctor_id
      LEFT JOIN exercises e
  ON e.created_by_id = d.doctor_id
      GROUP BY d.doctor_id
      ORDER BY d.created_at DESC
    `);

    res.json(rows);
  };



  /* =========================
    UPDATE DOCTOR STATUS
  ========================= */
  exports.updateDoctorStatus = async (req, res) => {
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

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
      SELECT
        patient_id,
        name,
        phone,
        gender,
        age,
        status,
        created_at
      FROM patients
      ORDER BY created_at DESC
    `);

    res.json(rows);
  };
  exports.getPatientById = async (req, res) => {
    const [[patient]] = await pool.query(
      `SELECT * FROM patients WHERE patient_id = ?`,
      [req.params.id]
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(patient);
  };
  exports.updatePatientStatus = async (req, res) => {
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await pool.query(
      `UPDATE patients SET status = ? WHERE patient_id = ?`,
      [status, req.params.id]
    );

    res.json({ message: 'Status updated' });
  };



  /* =========================
    LIST VIDEOS (EXERCISES)
  ========================= */
  exports.listVideos = async (req, res) => {
    const [rows] = await pool.query(`
    
      SELECT
  e.exercise_id,
  e.title,
  e.duration_minutes,
  e.description,
  e.video_s3_url,
  e.status,
  e.created_at,
  d.name AS uploaded_by
FROM exercises e
LEFT JOIN doctors d
  ON d.doctor_id = e.created_by_id
ORDER BY e.created_at DESC


    `);

    res.json(rows);
  };


  /* =========================
    SUPPORT REQUESTS
  ========================= */
  exports.listSupportRequests = async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT
          id,
          name,
          age,
          gender,
          phone,
          purpose,
          status,
          created_at
        FROM support_requests
        ORDER BY created_at DESC
      `);

      res.json(rows);
    } catch (err) {
      console.error('LIST SUPPORT ERROR:', err);
      res.status(500).json({ message: 'Failed to load support requests' });
    }
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

  exports.createDoctor = async (req, res) => {
    let { phone, name, specialization = null, experience = null, email = null } = req.body;

    phone = normalizePhone(phone);

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
        `
        INSERT INTO doctors (
          doctor_id,
          user_auth_id,
          phone,
          name,
          specialization,
          experience,
          email,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
        `,
        [doctorId, doctorId, phone, name, specialization, experience, email]
      );

      await conn.commit();
      res.status(201).json({ message: 'Doctor created', doctorId });
    } catch (err) {
      await conn.rollback();
      res.status(500).json({ message: 'Failed to create doctor' });
    } finally {
      conn.release();
    }
  };



  exports.createPatient = async (req, res) => {
  let { name, phone, email = null, gender, age } = req.body;

  phone = normalizePhone(phone); // 🔥 ADD THIS


    if (!name || !phone || !gender || !age) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const patientId = await generateCustomId('PATIENT');

    await pool.query(
      `
      INSERT INTO patients
      (patient_id, name, phone, email, gender, age, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
      `,
      [patientId, name, phone, email, gender, age]
    );

    res.status(201).json({ message: 'Patient created', patientId });
  };


  /* =========================
    CREATE VIDEO
  ========================= */
  exports.createVideo = async (req, res) => {
    const {
      title,
      duration = '',
      category = '',
      description = '',
      videoUrl = '',
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title required' });
    }

    const videoId = await generateCustomId('EX');

    await pool.query(
    `
    INSERT INTO exercises
    (exercise_id, title, duration, category, description, video_url, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)
    `,
    [videoId, title, duration, category, description, videoUrl, req.user.userId]
  );


    res.status(201).json({ message: 'Video created', videoId });
  };


// admin.controller.js
exports.updateProgramStatus = async (req, res) => {
  const { status } = req.body;

  if (!['draft', 'published', 'disabled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  await pool.query(
    `UPDATE programs SET status=? WHERE program_id=?`,
    [status, req.params.id]
  );

  res.json({ message: 'Program status updated' });
};


  /* =========================
    UPDATE VIDEO
  ========================= */
  exports.updateVideo = async (req, res) => {
    const { title, duration, category, description, videoUrl } = req.body;

    await pool.query(
      `
      UPDATE exercises
      SET title=?, duration=?, category=?, description=?, video_url=?
      WHERE exercise_id=?
      `,
      [title, duration, category, description, videoUrl, req.params.id]
    );

    res.json({ message: 'Video updated' });
  };


  /* =========================
    UPDATE VIDEO STATUS
  ========================= */
  exports.updateVideoStatus = async (req, res) => {
    const { status } = req.body;

    if (!['draft', 'published', 'disabled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await pool.query(
      `UPDATE exercises SET status=? WHERE exercise_id=?`,
      [status, req.params.id]
    );

    res.json({ message: 'Status updated' });
  };
