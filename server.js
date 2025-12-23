const pool = require('./src/config/db');

const { v4: uuidv4 } = require('uuid');

/* =========================
   CREATE PROGRAM
========================= */
exports.createProgram = async (req, res) => {
  try {
    const { name, description, totalMinutes } = req.body;

    const [doctorRows] = await pool.query(
      'SELECT id FROM doctors WHERE user_auth_id = ?',
      [req.user.userId]
    );

    if (doctorRows.length === 0) {
      return res.status(403).json({ message: 'Doctor profile not found' });
    }

    const doctorId = doctorRows[0].id;
    const programId = uuidv4();

    await pool.query(
      `INSERT INTO programs
       (id, doctor_id, name, description, total_minutes, status)
       VALUES (?, ?, ?, ?, ?, 'published')`,
      [programId, doctorId, name, description || null, totalMinutes]
    );

    res.status(201).json({
      message: 'Program created successfully',
      programId
    });
  } catch (err) {
    console.error('CREATE PROGRAM ERROR:', err);
    res.status(500).json({ message: 'Failed to create program' });
  }
};

/* =========================
   CREATE EXERCISE
========================= */
exports.createExercise = async (req, res) => {
  try {
    const { title, description, videoUrl, duration, category } = req.body;

    if (!title || !videoUrl || !duration || !category) {
      return res.status(400).json({
        message: 'title, videoUrl, duration, category are required'
      });
    }

    const [doctorRows] = await pool.query(
      'SELECT id FROM doctors WHERE user_auth_id = ?',
      [req.user.userId]
    );

    if (doctorRows.length === 0) {
      return res.status(403).json({ message: 'Doctor profile not found' });
    }

    const doctorId = doctorRows[0].id;
    const exerciseId = uuidv4();

    await pool.query(
      `INSERT INTO exercises
       (id, doctor_id, title, description, video_s3_url,
        duration_minutes, category, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
      [
        exerciseId,
        doctorId,
        title,
        description || null,
        videoUrl,
        duration,
        category
      ]
    );

    res.status(201).json({
      message: 'Exercise created successfully',
      exerciseId
    });
  } catch (err) {
    console.error('CREATE EXERCISE ERROR:', err);
    res.status(500).json({
      message: 'Failed to create exercise'
    });
  }
};

/* =========================
   ATTACH EXERCISE TO PROGRAM
========================= */
exports.addExerciseToProgram = async (req, res) => {
  try {
    const { programId, exerciseId } = req.body;

    const [programRows] = await pool.query(
      `SELECT p.id
       FROM programs p
       JOIN doctors d ON p.doctor_id = d.id
       WHERE p.id = ? AND d.user_auth_id = ?`,
      [programId, req.user.userId]
    );

    if (programRows.length === 0) {
      return res.status(403).json({
        message: 'Program not found or not owned by doctor'
      });
    }

    await pool.query(
      `INSERT IGNORE INTO program_exercises
       (id, program_id, exercise_id)
       VALUES (?, ?, ?)`,
      [uuidv4(), programId, exerciseId]
    );

    res.json({ message: 'Exercise attached to program successfully' });
  } catch (err) {
    console.error('ATTACH EXERCISE ERROR:', err);
    res.status(500).json({ message: 'Failed to attach exercise' });
  }
};

/* =========================
   ASSIGN PROGRAM TO PATIENT
========================= */
exports.assignProgramToPatient = async (req, res) => {
  try {
    const { patientId, programId } = req.body;

    const [programRows] = await pool.query(
      `SELECT p.id
       FROM programs p
       JOIN doctors d ON p.doctor_id = d.id
       WHERE p.id = ? AND d.user_auth_id = ?`,
      [programId, req.user.userId]
    );

    if (programRows.length === 0) {
      return res.status(403).json({
        message: 'Program not found or not owned by doctor'
      });
    }

    await pool.query(
      `INSERT IGNORE INTO patient_programs
       (id, patient_id, program_id, assigned_by, start_date)
       VALUES (?, ?, ?, ?, CURDATE())`,
      [uuidv4(), patientId, programId, programRows[0].id]
    );

    res.json({ message: 'Program assigned to patient successfully' });
  } catch (err) {
    console.error('ASSIGN PROGRAM ERROR:', err);
    res.status(500).json({ message: 'Failed to assign program' });
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
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const [rows] = await pool.query(
      `
      SELECT
        p.id AS patient_id,
        p.name AS patient_name,
        pr.id AS program_id,
        pr.name AS program_name,
        COUNT(e.id) AS total_exercises,
        SUM(CASE WHEN ep.completed = true THEN 1 ELSE 0 END) AS completed_exercises
      FROM programs pr
      JOIN patient_programs pp ON pp.program_id = pr.id
      JOIN patients p ON p.id = pp.patient_id
      JOIN program_exercises pe ON pe.program_id = pr.id
      JOIN exercises e ON e.id = pe.exercise_id
      LEFT JOIN exercise_progress ep
        ON ep.exercise_id = e.id AND ep.patient_id = p.id
      WHERE pr.doctor_id = ?
      GROUP BY p.id, pr.id
      `,
      [doctor.id]
    );

    res.json({
      patients: rows.map(r => ({
        patientId: r.patient_id,
        patientName: r.patient_name,
        programId: r.program_id,
        programName: r.program_name,
        totalExercises: r.total_exercises,
        completedExercises: Number(r.completed_exercises),
        completionPercentage:
          r.total_exercises === 0
            ? 0
            : Math.round((r.completed_exercises / r.total_exercises) * 100)
      }))
    });
  } catch (err) {
    console.error('DOCTOR DASHBOARD ERROR:', err);
    res.status(500).json({ message: 'Failed to load doctor dashboard' });
  }
};
require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
