const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/* =========================
   SUBMIT FEEDBACK
========================= */
exports.submitFeedback = async (req, res) => {
  const { exerciseId, painLevel, difficulty, notes } = req.body;

  try {
    const [[patient]] = await pool.query(
      `SELECT id FROM patients WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    const [[existing]] = await pool.query(
      `
      SELECT id FROM feedback
      WHERE patient_id = ? AND exercise_id = ?
      `,
      [patient.id, exerciseId]
    );

    await pool.query(
      `
      INSERT INTO feedback
      (id, patient_id, exercise_id, pain_level, difficulty, notes)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        pain_level = VALUES(pain_level),
        difficulty = VALUES(difficulty),
        notes = VALUES(notes)
      `,
      [uuidv4(), patient.id, exerciseId, painLevel, difficulty, notes]
    );

    if (!existing) {
      await pool.query(
        `
        UPDATE doctors d
        JOIN patients p ON p.doctor_id = d.id
        SET d.reports_submitted = d.reports_submitted + 1
        WHERE p.id = ?
        `,
        [patient.id]
      );
    }

    res.json({ message: 'Feedback submitted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Feedback failed' });
  }
};

/* =========================
   UPDATE EXERCISE PROGRESS
========================= */
exports.updateExerciseProgress = async (req, res) => {
  const { exerciseId, watchedSeconds, totalSeconds, completed } = req.body;

  try {
    const [[patient]] = await pool.query(
      `SELECT id FROM patients WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    const [[existing]] = await pool.query(
      `
      SELECT completed FROM exercise_progress
      WHERE patient_id = ? AND exercise_id = ?
      `,
      [patient.id, exerciseId]
    );

    await pool.query(
      `
      INSERT INTO exercise_progress
      (id, patient_id, exercise_id, watched_seconds, total_seconds, completed)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        watched_seconds = VALUES(watched_seconds),
        total_seconds = VALUES(total_seconds),
        completed = VALUES(completed)
      `,
      [uuidv4(), patient.id, exerciseId, watchedSeconds, totalSeconds, completed]
    );

    if (completed && !existing?.completed) {
      await pool.query(
        `
        UPDATE doctors d
        JOIN patients p ON p.doctor_id = d.id
        SET d.exercises_completed = d.exercises_completed + 1
        WHERE p.id = ?
        `,
        [patient.id]
      );
    }

    res.json({ message: 'Progress updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Progress update failed' });
  }
};

/* =========================
   PATIENT DASHBOARD
========================= */
exports.getPatientDashboard = async (req, res) => {
  try {
    // 1️⃣ Get patient
    const [[patient]] = await pool.query(
      `SELECT id, name FROM patients WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // 2️⃣ Get assigned exercises (date-based)
    const [rows] = await pool.query(
      `
      SELECT
        pr.id AS program_id,
        pr.name AS program_name,
        e.id AS exercise_id,
        e.title,
         e.video_url,
        e.duration_minutes,
        ep.completed
      FROM patient_exercises pe
      JOIN exercises e ON e.id = pe.exercise_id
      JOIN programs pr ON pr.id = pe.program_id
      LEFT JOIN exercise_progress ep
        ON ep.exercise_id = e.id AND ep.patient_id = pe.patient_id
      WHERE pe.patient_id = ?
        AND CURDATE() BETWEEN pe.assigned_date AND pe.due_date
      `,
      [patient.id]
    );

    // 3️⃣ Build Today Exercises
    const todayExercises = rows.map(r => ({
      id: r.exercise_id,
      title: r.title,
      videoUrl: r.video_url, 
      durationMinutes: r.duration_minutes,
      programName: r.program_name,
      completed: !!r.completed,
    }));

    // 4️⃣ Build Active Programs (unique)
    const programMap = {};
    for (const r of rows) {
      if (!programMap[r.program_id]) {
        programMap[r.program_id] = {
          programId: r.program_id,
          programName: r.program_name,
          totalExercises: 0,
          completedExercises: 0,
        };
      }

      programMap[r.program_id].totalExercises += 1;
      if (r.completed) {
        programMap[r.program_id].completedExercises += 1;
      }
    }

    const activePrograms = Object.values(programMap);

    // 5️⃣ Today summary
    const todayTotal = todayExercises.length;
    const todayCompleted = todayExercises.filter(e => e.completed).length;

    res.json({
      patientName: patient.name,

      todaySummary: {
        total: todayTotal,
        completed: todayCompleted,
      },

      todayExercises,
      activePrograms,
    });
  } catch (err) {
    console.error('PATIENT DASHBOARD ERROR:', err);
    res.status(500).json({ message: 'Dashboard failed' });
  }
};


exports.getExerciseVideo = async (req, res) => {
  res.json({
    message: 'Video streaming will be added via S3 later',
    exerciseId: req.params.exerciseId,
  });
};

exports.getPatientProfile = async (req, res) => {
  try {
    const [[patient]] = await pool.query(
      `
      SELECT
        name,
        phone,
        email,
        dob,
        status,
        patient_code,
        created_at
      FROM patients
      WHERE user_auth_id = ?
      `,
      [req.user.userId]
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load profile' });
  }
};

exports.updatePatientProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    await pool.query(
      `
      UPDATE patients
      SET name = ?, email = ?
      WHERE user_auth_id = ?
      `,
      [name, email, req.user.userId]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('UPDATE PROFILE ERROR:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};
exports.getPatientProgramDetail = async (req, res) => {
  try {
    const programId = req.params.programId;

    const [[patient]] = await pool.query(
      'SELECT id FROM patients WHERE user_auth_id = ?',
      [req.user.userId]
    );

    const [rows] = await pool.query(
      `
      SELECT
        e.id AS exerciseId,
        e.title,
        e.duration_minutes AS durationMinutes,
        e.video_url AS videoUrl,
        ep.completed
      FROM patient_exercises pe
      JOIN exercises e ON e.id = pe.exercise_id
      LEFT JOIN exercise_progress ep
        ON ep.exercise_id = e.id AND ep.patient_id = pe.patient_id
      WHERE pe.patient_id = ?
        AND pe.program_id = ?
      `,
      [patient.id, programId]
    );

    res.json({ exercises: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Program detail failed' });
  }
};
