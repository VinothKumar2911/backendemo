const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/* =========================
   CREATE DOCTOR PROFILE
========================= */
exports.createDoctorProfile = async (req, res) => {
  try {
    const { name, specialization, registrationId, gender, email, profileImageUrl } = req.body;

    const [[exists]] = await pool.query(
      `SELECT id FROM doctors WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    if (exists) {
      return res.status(409).json({ message: 'Doctor profile already exists' });
    }

    const doctorId = uuidv4();

    await pool.query(
      `
      INSERT INTO doctors
      (id, user_auth_id, name, phone, specialization, registration_id, gender, email, profile_image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        doctorId,
        req.user.userId,
        name,
        null,
        specialization,
        registrationId,
        gender,
        email,
        profileImageUrl
      ]
    );

    res.json({ message: 'Doctor profile created successfully', doctorId });
  } catch (err) {
    console.error('CREATE DOCTOR ERROR:', err);
    res.status(500).json({ message: 'Failed to create doctor profile' });
  }
};

/* =========================
   CREATE PROGRAM
========================= */
exports.createProgram = async (req, res) => {
  try {
    const { name, description, totalMinutes } = req.body;

    const [[doctor]] = await pool.query(
      `SELECT id FROM doctors WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    const programId = uuidv4();

    await pool.query(
      `
      INSERT INTO programs (id, doctor_id, name, description, total_minutes)
      VALUES (?, ?, ?, ?, ?)
      `,
      [programId, doctor.id, name, description, totalMinutes]
    );

    res.json({ message: 'Program created successfully', programId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create program' });
  }
};

/* =========================
   CREATE EXERCISE
========================= */
exports.createExercise = async (req, res) => {
  try {
    const { title, video_s3_url, duration_minutes, category } = req.body;

    if (!title || !video_s3_url || !duration_minutes) {
      return res.status(400).json({
        message: 'title, video_s3_url, duration_minutes are required'
      });
    }

    const [[doctor]] = await pool.query(
      `SELECT id FROM doctors WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    const exerciseId = uuidv4();

    await pool.query(
      `
      INSERT INTO exercises
      (id, doctor_id, title, video_s3_url, duration_minutes, category)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [exerciseId, doctor.id, title, video_s3_url, duration_minutes, category]
    );

    res.json({ message: 'Exercise created successfully', exerciseId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create exercise' });
  }
};

/* =========================
   ADD EXERCISE TO PROGRAM
========================= */
exports.addExerciseToProgram = async (req, res) => {
  const { programId, exerciseId, sets = 3, reps = 15 } = req.body;

  try {
    await pool.query(
      `
      INSERT IGNORE INTO program_exercises
      (id, program_id, exercise_id, sets, reps)
      VALUES (?, ?, ?, ?, ?)
      `,
      [uuidv4(), programId, exerciseId, sets, reps]
    );

    res.json({ message: 'Exercise added to program' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add exercise' });
  }
};

/* =========================
   ASSIGN PROGRAM TO PATIENT
========================= */
exports.assignProgramToPatient = async (req, res) => {
  const { patientId, programId } = req.body;

  try {
    const [[doctor]] = await pool.query(
      `SELECT id FROM doctors WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    const [[already]] = await pool.query(
      `
      SELECT id FROM patient_programs
      WHERE patient_id = ? AND assigned_by = ?
      `,
      [patientId, doctor.id]
    );

    await pool.query(
      `
      INSERT IGNORE INTO patient_programs
      (id, patient_id, program_id, assigned_by, start_date)
      VALUES (?, ?, ?, ?, CURDATE())
      `,
      [uuidv4(), patientId, programId, doctor.id]
    );

    // 🔥 CRITICAL FIX
    await pool.query(
      `UPDATE patients SET doctor_id = ? WHERE id = ?`,
      [doctor.id, patientId]
    );

    if (!already) {
      await pool.query(
        `UPDATE doctors SET patients_treated = patients_treated + 1 WHERE id = ?`,
        [doctor.id]
      );
    }

    res.json({ message: 'Program assigned to patient successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Assignment failed' });
  }
};


/* =========================
   DOCTOR DASHBOARD
========================= */
exports.getDoctorDashboard = async (req, res) => {
  try {
    const [[doctor]] = await pool.query(
      `SELECT id FROM doctors WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    if (!doctor) {
      return res.json({ patients: [] });
    }

    const [patients] = await pool.query(
      `
  SELECT
    p.id AS patient_id,
    COALESCE(p.name, 'Unknown Patient') AS patient_name,
     p.photo_url AS photo_url,
    p.active AS active,
    p.gender AS gender,
p.age AS age,

    MAX(pr.id) AS program_id,
    MAX(pr.name) AS program_name,

    COUNT(DISTINCT e.id) AS total_exercises,
    COUNT(DISTINCT CASE WHEN ep.completed = true THEN e.id END) AS completed_exercises


  FROM patients p
  LEFT JOIN patient_programs pp ON pp.patient_id = p.id
  LEFT JOIN programs pr ON pr.id = pp.program_id
  LEFT JOIN program_exercises pe ON pe.program_id = pr.id
  LEFT JOIN exercises e ON e.id = pe.exercise_id
  LEFT JOIN exercise_progress ep
    ON ep.exercise_id = e.id AND ep.patient_id = p.id

  WHERE p.doctor_id = ?

  GROUP BY p.id
  `,
      [doctor.id]
    );


    res.json({ patients });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard" });
  }
};

exports.updateDoctorProfile = async (req, res) => {
  try {
    const { name, specialization, gender, email, profile_image_url } = req.body;

    // 1️⃣ Find doctor using JWT userId
    const [[doctor]] = await pool.query(
      `SELECT id FROM doctors WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // 2️⃣ Update doctor profile
    await pool.query(
      `
      UPDATE doctors
      SET
        name = COALESCE(?, name),
        specialization = COALESCE(?, specialization),
        gender = COALESCE(?, gender),
        email = COALESCE(?, email),
        profile_image_url = COALESCE(?, profile_image_url)
      WHERE id = ?
      `,
      [
        name,
        specialization,
        gender,
        email,
        profile_image_url,
        doctor.id,
      ]
    );

    res.json({ message: 'Doctor profile updated successfully' });
  } catch (err) {
    console.error('UPDATE DOCTOR ERROR:', err);
    res.status(500).json({ message: 'Failed to update doctor profile' });
  }
};

/* =========================
   GET DOCTOR PROFILE
========================= */
exports.getDoctorProfile = async (req, res) => {
  try {
    const [[doctor]] = await pool.query(
      `
      SELECT
        id,
        name,
        specialization,
        registration_id,
        gender,
        email,
        profile_image_url,
        patients_treated,
        created_at
      FROM doctors
      WHERE user_auth_id = ?
      `,
      [req.user.userId]
    );

    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor profile not found'
      });
    }

    res.json(doctor);
  } catch (err) {
    console.error('GET DOCTOR PROFILE ERROR:', err);
    res.status(500).json({
      message: 'Failed to fetch doctor profile'
    });
  }
};

/* =========================
   CREATE PATIENT
========================= */
exports.createPatient = async (req, res) => {
  try {


    const { name, age, phone, email, gender } = req.body;

    if (!name || !age || !phone || !email || !gender) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const [[doctor]] = await pool.query(
      `SELECT id FROM doctors WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    const patientId = uuidv4();
    const photoUrl = req.file
      ? `/uploads/patients/${req.file.filename}`
      : null;



    await pool.query(
      `
      INSERT INTO patients
      (id, doctor_id, name, age, phone, email, gender, photo_url, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?,true)
      `,
      [patientId, doctor.id, name, age, phone, email, gender, photoUrl]
    );

    res.json({ message: 'Patient created', patientId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create patient' });
  }
};
/* =========================
   TOGGLE PATIENT STATUS
========================= */
exports.updatePatientStatus = async (req, res) => {
  const { active } = req.body;
  const patientId = req.params.id;

  try {
    await pool.query(
      `UPDATE patients SET active = ? WHERE id = ?`,
      [active, patientId]
    );

    res.json({ message: 'Patient status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update status' });
  }
};

/* =========================
   GET PATIENT PROFILE
========================= */
exports.getPatientProfile = async (req, res) => {
  const patientId = req.params.id;

  try {
    const [[patient]] = await pool.query(
      `
      SELECT id, name, age, phone, email, photo_url, active, created_at
      FROM patients
      WHERE id = ?
      `,
      [patientId]
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({
      patient: patient, // 🔴 REQUIRED KEY
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch patient profile' });
  }
};


exports.getExerciseById = async (req, res) => {
  try {
    const [[exercise]] = await pool.query(
      `
      SELECT 
        e.id,
        COALESCE(e.title, '') AS title,
        COALESCE(e.description, '') AS description,
        COALESCE(e.duration_minutes, 0) AS duration_minutes,
        COALESCE(e.category, '') AS category,
        COALESCE(e.tags, '') AS tags,
        COALESCE(e.status, 'draft') AS status,
        COALESCE(e.video_s3_url, '') AS video_url,
        COALESCE(d.name, 'Unknown') AS uploaded_by,
        e.created_at
      FROM exercises e
      LEFT JOIN doctors d ON d.id = e.doctor_id
      WHERE e.id = ?
      `,
      [req.params.id]
    );

    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    res.json({ exercise });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch exercise' });
  }
};



/* =========================
   PATIENT MEDICAL HISTORY
========================= */
exports.getPatientMedicalHistory = async (req, res) => {
  const patientId = req.params.id;

  try {
    const [rows] = await pool.query(
      `
      SELECT condition_name, notes, created_at
      FROM patient_medical_history
      WHERE patient_id = ?
      ORDER BY created_at DESC
      `,
      [patientId]
    );

    res.json({ history: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch history' });
  }
};
/* =========================
   GET DOCTOR PROGRAMS
========================= */
exports.getDoctorPrograms = async (req, res) => {
  try {
    const [[doctor]] = await pool.query(
      `SELECT id FROM doctors WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    const [rows] = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        p.description,
        p.total_minutes,
        p.status,
        COUNT(pe.exercise_id) AS exercise_count
      FROM programs p
      LEFT JOIN program_exercises pe ON pe.program_id = p.id
      WHERE p.doctor_id = ?
      GROUP BY p.id
      `,
      [doctor.id]
    );

    res.json({ programs: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch programs' });
  }
};
/* =========================
   UPDATE PROGRAM STATUS
========================= */
exports.updateProgramStatus = async (req, res) => {
  const { status } = req.body;

  try {
    await pool.query(
      `UPDATE programs SET status = ? WHERE id = ?`,
      [status, req.params.id]
    );

    res.json({ message: 'Program status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update program status' });
  }
};

/* =========================
   GET DOCTOR EXERCISES
========================= */
exports.getDoctorExercises = async (req, res) => {
  try {
    const [[doctor]] = await pool.query(
      `SELECT id FROM doctors WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    const [rows] = await pool.query(
      `
      SELECT id, title, duration_minutes, category, status
      FROM exercises
      WHERE doctor_id = ?
      `,
      [doctor.id]
    );

    res.json({ exercises: rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch exercises' });
  }
};

/* =========================
   UPDATE EXERCISE STATUS
========================= */
exports.updateExerciseStatus = async (req, res) => {
  const { status } = req.body;

  await pool.query(
    `UPDATE exercises SET status = ? WHERE id = ?`,
    [status, req.params.id]
  );

  res.json({ message: 'Exercise status updated' });
};

exports.getProgramExercises = async (req, res) => {
  const [rows] = await pool.query(
    `
    SELECT e.*
    FROM exercises e
    JOIN program_exercises pe ON pe.exercise_id = e.id
    WHERE pe.program_id = ?
    `,
    [req.params.id]
  );

  res.json({ exercises: rows });
};


exports.assignExercisesToPatient = async (req, res) => {
  try {
    const { patientId, exerciseIds, assignedDate, dueDate } = req.body;

    if (!patientId || !exerciseIds?.length || !assignedDate || !dueDate) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const [[doctor]] = await pool.query(
      `SELECT id FROM doctors WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    for (const exerciseId of exerciseIds) {
      // 1️⃣ assignment table
      await pool.query(
        `
        INSERT IGNORE INTO patient_exercises
        (id, patient_id, exercise_id, assigned_by, assigned_date, due_date)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          uuidv4(),
          patientId,
          exerciseId,
          doctor.id,
          assignedDate,
          dueDate,
        ]
      );

      // 2️⃣ progress table (🔥 THIS FIXES UI)
      await pool.query(
        `
        INSERT IGNORE INTO exercise_progress
        (id, patient_id, exercise_id, completed)
        VALUES (?, ?, ?, false)
        `,
        [
          uuidv4(),
          patientId,
          exerciseId,
        ]
      );
    }

    res.json({ message: 'Exercises assigned successfully' });
  } catch (err) {
    console.error('Assign exercises error:', err);
    res.status(500).json({ message: 'Failed to assign exercises' });
  }
};
exports.updateExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    await pool.query(
      `
      UPDATE exercises
      SET title = ?, description = ?
      WHERE id = ?
      `,
      [title, description, id]
    );

    res.json({ message: 'Exercise updated successfully' });
  } catch (err) {
    console.error('UPDATE EXERCISE ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
