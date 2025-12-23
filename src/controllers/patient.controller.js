// src/controllers/patient.controller.js
const pool = require('../config/db');
const { getSignedVideoUrl } = require('../config/s3');

exports.getExerciseVideo = async (req, res) => {
  const { exerciseId } = req.params;

  const [[exercise]] = await pool.query(
    `SELECT video_s3_url FROM exercises WHERE id=?`,
    [exerciseId]
  );

  const signedUrl = await getSignedVideoUrl(exercise.video_s3_url);
  res.json({ url: signedUrl });
};

exports.updateProgress = async (req, res) => {


  const { exerciseId, watched, total } = req.body;
  const completed = watched >= total * 0.95;

  const [[existing]] = await pool.query(
  `SELECT completed FROM exercise_progress
   WHERE patient_id=? AND exercise_id=?`,
  [req.user.userId, exerciseId]
);

if (existing?.completed) {
  return res.status(400).json({
    message: 'Exercise already completed. Progress locked.'
  });
}


  await pool.query(
    `INSERT INTO exercise_progress
     (id, patient_id, exercise_id, watched_seconds, total_seconds, completed)
     VALUES (UUID(), ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     watched_seconds=?, completed=?`,
    [
      req.user.userId, exerciseId, watched, total, completed,
      watched, completed
    ]
  );
  // Check if all exercises completed
const [[result]] = await pool.query(
  `
  SELECT 
    COUNT(e.id) AS total,
    SUM(ep.completed) AS completed
  FROM program_exercises pe
  JOIN exercises e ON e.id = pe.exercise_id
  JOIN patient_programs pp ON pp.program_id = pe.program_id
  LEFT JOIN exercise_progress ep
    ON ep.exercise_id = e.id AND ep.patient_id = pp.patient_id
  WHERE pp.patient_id = ? AND e.id = ?
  `,
  [req.user.userId, exerciseId]
);

if (result.total === result.completed) {
  await pool.query(
    `
    UPDATE patient_programs
    SET status='completed', completed_at=NOW()
    WHERE patient_id=? AND program_id=(
      SELECT program_id FROM program_exercises WHERE exercise_id=?
    )
    `,
    [req.user.userId, exerciseId]
  );
}


  res.json({ completed });
};

exports.submitFeedback = async (req, res) => {
  const { programId, exerciseId, pain, difficulty, notes } = req.body;
  const [[existing]] = await pool.query(
  `SELECT id FROM feedback WHERE patient_id=? AND exercise_id=?`,
  [req.user.userId, exerciseId]
);

if (existing) {
  return res.status(400).json({ message: 'Feedback already submitted' });
}


  const [[progress]] = await pool.query(
    `SELECT completed FROM exercise_progress
     WHERE patient_id=? AND exercise_id=?`,
    [req.user.userId, exerciseId]
  );

  if (!progress?.completed) {
    return res.status(400).json({ message: 'Complete exercise first' });
  }

  await pool.query(
    `INSERT INTO feedback
     (id, patient_id, program_id, exercise_id, pain_level, difficulty, notes)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
    [req.user.userId, programId, exerciseId, pain, difficulty, notes]
  );

  res.json({ message: 'Feedback submitted' });
};
exports.getPatientDashboard = async (req, res) => {
  try {
    // 1️⃣ Map auth user → patient
    const [[patient]] = await pool.query(
      `SELECT id FROM patients WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    if (!patient) {
      return res.status(404).json({
        message: 'Patient profile not found'
      });
    }

    // 2️⃣ Fetch dashboard data
    const [rows] = await pool.query(
      `
      SELECT
        pr.id AS program_id,
        pr.name AS program_name,
        pr.total_minutes,

        e.id AS exercise_id,
        e.title AS exercise_title,
        e.duration_minutes,

        ep.watched_seconds,
        ep.total_seconds,
        ep.completed,

        CASE 
          WHEN f.id IS NULL THEN false
          ELSE true
        END AS feedback_given

      FROM patient_programs pp
      JOIN programs pr ON pr.id = pp.program_id
      JOIN program_exercises pe ON pe.program_id = pr.id
      JOIN exercises e ON e.id = pe.exercise_id
      LEFT JOIN exercise_progress ep
        ON ep.exercise_id = e.id AND ep.patient_id = pp.patient_id
      LEFT JOIN feedback f
        ON f.exercise_id = e.id AND f.patient_id = pp.patient_id
      WHERE pp.patient_id = ?
      ORDER BY pr.created_at, e.title
      `,
      [patient.id]
    );

    // 3️⃣ Transform rows → grouped structure
    const dashboard = {};

    for (const row of rows) {
      if (!dashboard[row.program_id]) {
        dashboard[row.program_id] = {
          programId: row.program_id,
          programName: row.program_name,
          totalMinutes: row.total_minutes,
          exercises: []
        };
      }

      dashboard[row.program_id].exercises.push({
        exerciseId: row.exercise_id,
        title: row.exercise_title,
        durationMinutes: row.duration_minutes,
        watchedSeconds: row.watched_seconds || 0,
        totalSeconds: row.total_seconds || row.duration_minutes * 60,
        completed: !!row.completed,
        feedbackGiven: !!row.feedback_given
      });
    }

    // 4️⃣ Compute program completion %
    const result = Object.values(dashboard).map(program => {
      const total = program.exercises.length;
      const completed = program.exercises.filter(e => e.completed).length;

      return {
        ...program,
        completionPercentage:
          total === 0 ? 0 : Math.round((completed / total) * 100)
      };
    });

    res.json({
      programs: result
    });
  } catch (err) {
    console.error('PATIENT DASHBOARD ERROR:', err);
    res.status(500).json({
      message: 'Failed to load dashboard'
    });
  }
};
