<<<<<<< HEAD
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
=======
  const pool = require('../config/db');
  const { generateCustomId } = require('../utils/idGenerator');
  const { normalizePhone } = require('../utils/phone');
  const { getSignedUrl } = require('../config/s3');
const upload = require('../middleware/upload.middleware');

const { uploadToS3 } = require('../config/s3');

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


exports.getPatientExercises = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT exercise_id, title, video_s3_url
      FROM exercises
      WHERE status = 'published'
      `
    );

    const data = await Promise.all(
      rows.map(async row => ({
        id: row.exercise_id,
        title: row.title,
        videoUrl: await getSignedUrl(row.video_s3_url),
      }))
    );

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
  const [rows] = await pool.query(
    `
    SELECT
      e.exercise_id,
      e.title,
      e.description,
      e.video_s3_url,
      e.status,
      e.created_at,
      e.created_by_id,
      pt.name AS tag_name,
      CASE
        WHEN e.created_by_id LIKE 'ADMIN%' THEN 'Admin'
        ELSE d.name
      END AS uploaded_by
    FROM exercises e
    LEFT JOIN doctors d
      ON d.doctor_id = e.created_by_id
    LEFT JOIN program_tags pt
      ON pt.program_tag_id = e.tag_id
    ORDER BY e.created_at DESC
    `
  );

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
    description,
    tag_id,
    video_s3_url
  } = req.body;

  if (!title || !tag_id) {
    return res.status(400).json({
      message: 'Title and tag are required'
    });
  }

  try {
    const exerciseId = await generateCustomId('EXERCISE');

    await pool.query(
      `
      INSERT INTO exercises
      (
        exercise_id,
        title,
        description,
        tag_id,
        video_s3_url,
        status,
        created_by_id
      )
      VALUES (?, ?, ?, ?, ?, 'draft', ?)
      `,
      [
        exerciseId,
        title,
        description || null,
        tag_id,
        video_s3_url || null,
        req.user.userId // 👈 ADMINxxxx
      ]
    );

    res.status(201).json({
      message: 'Video created successfully',
      exerciseId
    });

  } catch (err) {
    console.error('ADMIN CREATE VIDEO ERROR:', err);
    res.status(500).json({ message: 'Failed to create video' });
  }
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
  const { title, description, tag_id, video_s3_url } = req.body;

  await pool.query(
    `
    UPDATE exercises
    SET
      title = ?,
      description = ?,
      tag_id = ?,
      video_s3_url = ?
    WHERE exercise_id = ?
    `,
    [
      title,
      description,
      tag_id,
      video_s3_url,
      req.params.id
    ]
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


exports.uploadPatientPhoto = async (req, res) => {
  const { patientId } = req.params;

  if (!req.file || !patientId) {
    return res.status(400).json({ message: 'Patient ID and photo required' });
  }

  const s3Key = await uploadToS3(req.file, 'patients');

  await pool.query(
    `UPDATE patients SET photo_url = ? WHERE patient_id = ?`,
    [s3Key, patientId]
  );

  res.json({ message: 'Photo uploaded', s3Key });
};
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
