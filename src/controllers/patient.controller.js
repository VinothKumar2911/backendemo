
const pool = require('../config/db');
const { generateCustomId } = require('../utils/idGenerator');
<<<<<<< HEAD
=======
const { uploadToS3, getSignedUrl } = require('../config/s3');
const upload = require('../middleware/upload.middleware');
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a


/* =========================
   SUBMIT FEEDBACK
========================= */
exports.submitFeedback = async (req, res) => {
  const { exerciseId, painLevel, difficulty, notes } = req.body;
  const feedbackId = await generateCustomId('feedback');

  try {
    const [[patient]] = await pool.query(
      `SELECT patient_id FROM patients WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    const [[existing]] = await pool.query(
      `
      SELECT feedback_id FROM feedback
      WHERE patient_id = ? AND exercise_id = ?
      `,
      [patient.patient_id, exerciseId]
    );

    await pool.query(
      `
      INSERT INTO feedback
      (feedback_id, patient_id, exercise_id, pain_level, difficulty, notes)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        pain_level = VALUES(pain_level),
        difficulty = VALUES(difficulty),
        notes = VALUES(notes)
      `,
      [feedbackId, patient.patient_id, exerciseId, painLevel, difficulty, notes]

    );

    if (!existing) {
      await pool.query(
        `
        UPDATE doctors d
        JOIN patients p ON p.assigned_doctor_id = d.doctor_id
        SET d.reports_submitted = d.reports_submitted + 1
        WHERE p.patient_id = ?
        `,
        [patient.patient_id]
      );
    }

    res.json({ message: 'Feedback submitted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Feedback failed' });
  }
};


// exports.uploadPatientPhoto = async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: 'No file uploaded' });
//   }

//   const s3Key = await uploadToS3(req.file, 'patients');

//   const [[patient]] = await pool.query(
//   `SELECT patient_id FROM patients WHERE user_auth_id = ?`,
//   [req.user.userId]
// );
// if (!patient) {
//   return res.status(404).json({ message: 'Patient not found' });
// }

// await pool.query(
//   `UPDATE patients SET photo_url=? WHERE patient_id=?`,
//   [s3Key, patient.patient_id]
// );


//   res.json({ message: 'Photo uploaded', s3Key });
// };

/* =========================
   UPDATE EXERCISE PROGRESS
========================= */
exports.updateExerciseProgress = async (req, res) => {
  const { exerciseId, watchedSeconds, totalSeconds, completed } = req.body;
  const progressId = await generateCustomId('exercise_progress');

  try {
    const [[patient]] = await pool.query(
      `SELECT patient_id FROM patients
 WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    const [[existing]] = await pool.query(
      `
      SELECT completed FROM exercise_progress
      WHERE patient_id = ? AND exercise_id = ?
      `,
      [patient.patient_id, exerciseId]
    );

    await pool.query(
      `
      INSERT INTO exercise_progress
      (exercise_progress_id, patient_id, exercise_id, watched_seconds, total_seconds, completed)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        watched_seconds = VALUES(watched_seconds),
        total_seconds = VALUES(total_seconds),
        completed = VALUES(completed)
      `,
      [progressId, patient.patient_id, exerciseId, watchedSeconds, totalSeconds, completed]

    );

    if (completed && !existing?.completed) {
      await pool.query(
        `
        UPDATE doctors d
        JOIN patients p ON p.assigned_doctor_id = d.doctor_id
        SET d.exercises_completed = d.exercises_completed + 1
        WHERE p.patient_id = ?
        `,
        [patient.patient_id]
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
<<<<<<< HEAD
=======
    // =========================
    // 0️⃣ GET PATIENT
    // =========================
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
    const [[patient]] = await pool.query(
      `SELECT patient_id, name FROM patients WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

<<<<<<< HEAD
  



    // 🔹 1. Fetch all active programs
const [activeProgramsRows] = await pool.query(
  `
  SELECT
    pp.patient_program_id,
    pp.program_id,
    pr.name AS program_name,
    pp.total_program_days,
    COUNT(ppd.id) AS attempted_days,
    COALESCE(SUM(ppd.status = 'completed'), 0) AS completed_days
  FROM patient_programs pp
  JOIN programs pr ON pr.program_id = pp.program_id
  LEFT JOIN patient_program_days ppd
    ON ppd.patient_program_id = pp.patient_program_id
  WHERE pp.patient_id = ?
    AND pp.status = 'active'
  GROUP BY pp.patient_program_id
  `,
  [patient.patient_id]
);

if (activeProgramsRows.length === 0) {
  return res.json({
    patientName: patient.name,
    session: null,
    todaySummary: { total: 0, completed: 0 },
    todayExercises: [],
    activePrograms: [],
  });
}
const [[programDay]] = await pool.query(
  `
  SELECT *
  FROM patient_program_days
  WHERE patient_program_id = ?
    AND status = 'in_progress'
  ORDER BY created_at DESC
  LIMIT 1
  `,
  [activeProgramsRows[0].patient_program_id]
);
let session = null;

if (programDay) {
  [[session]] = await pool.query(
    `
    SELECT *
    FROM patient_sessions
    WHERE patient_program_day_id = ?
      AND status = 'started'
    ORDER BY started_at DESC
    LIMIT 1
    `,
    [programDay.id]
  );
}

const [exerciseRows] = await pool.query(
  `
  SELECT
  e.exercise_id,
  e.title,
  e.video_s3_url,
  e.duration_minutes,
  pe.order_no,
  CASE
    WHEN px.patient_exercise_id IS NOT NULL THEN 1
    ELSE 0
  END AS completed
FROM program_exercises pe
JOIN exercises e ON e.exercise_id = pe.exercise_id
LEFT JOIN patient_exercises px
  ON px.exercise_id = e.exercise_id
 AND px.session_id = ?
WHERE pe.program_id = ?
ORDER BY pe.order_no

  `,
  [session?.session_id || null, activeProgramsRows[0].program_id]
);

   res.json({
  patientName: patient.name,

  programDayId: programDay?.id || null,

  session: session
    ? {
        sessionId: session.session_id,
        sessionNumber: session.session_number,
      }
    : null,

  todaySummary: {
    total: exerciseRows.length,
    completed: exerciseRows.filter(e => e.completed).length,
  },

todayExercises: exerciseRows.map(e => ({
  id: e.exercise_id,
  program_id: activeProgramsRows[0].program_id,
   program_name: activeProgramsRows[0].program_name, 
  title: e.title,
  videoUrl: e.video_s3_url,
  completed: !!e.completed,
  duration: e.duration_minutes
}))

,

  activePrograms: activeProgramsRows,
});

=======
    // =========================
    // 1️⃣ GET ACTIVE PROGRAMS
    // =========================
    const [activePrograms] = await pool.query(
      `
      SELECT
        pp.patient_program_id,
        pp.program_id,
        pr.name AS program_name,
        pp.total_program_days
      FROM patient_programs pp
      JOIN programs pr ON pr.program_id = pp.program_id
      WHERE pp.patient_id = ?
        AND pp.status = 'active'
      `,
      [patient.patient_id]
    );

    // 🔹 NO ACTIVE PROGRAM
    if (activePrograms.length === 0) {
      return res.json({
        patientName: patient.name,
        programDayId: null,
        session: null,
        todaySummary: { total: 0, completed: 0 },
        todayExercises: [],
        activePrograms: [],
      });
    }

    // =========================
    // 2️⃣ PICK CURRENT PROGRAM
    // =========================
    const program = activePrograms[0];

    // =========================
    // 3️⃣ GET ACTIVE PROGRAM DAY
    // =========================
    let [[programDay]] = await pool.query(
      `
     SELECT *
FROM patient_program_days
WHERE patient_program_id = ?
ORDER BY created_at DESC
LIMIT 1;

      `,
      [program.patient_program_id]
    );

    // =========================
    // 4️⃣ AUTO-START DAY (IF NONE)
    // =========================
    if (!programDay) {
      const fakeReq = {
        body: { patient_program_id: program.patient_program_id },
        user: req.user,
      };

      const fakeRes = {
        json: (d) => d,
        status: () => fakeRes,
      };

      const day = await exports.startProgramDay(fakeReq, fakeRes);

      if (!day || !day.program_day_id) {
        return res.json({
          patientName: patient.name,
          programDayId: null,
          session: null,
          todaySummary: { total: 0, completed: 0 },
          todayExercises: [],
          activePrograms,
        });
      }

      [[programDay]] = await pool.query(
        `SELECT * FROM patient_program_days WHERE id = ?`,
        [day.program_day_id]
      );
    }

    // 🔹 FINAL SAFETY CHECK
    if (!programDay || !programDay.id) {
      return res.json({
        patientName: patient.name,
        programDayId: null,
        session: null,
        todaySummary: { total: 0, completed: 0 },
        todayExercises: [],
        activePrograms,
      });
    }

    // =========================
    // 5️⃣ GET ACTIVE SESSION
    // =========================
    const [[session]] = await pool.query(
      `
      SELECT *
      FROM patient_sessions
      WHERE patient_program_day_id = ?
        AND status = 'started'
      ORDER BY started_at DESC
      LIMIT 1
      `,
      [programDay.id]
    );

    // =========================
    // 6️⃣ LOAD EXERCISES (ONLY IF SESSION EXISTS)
    // =========================
    let exerciseRows = [];

    if (session) {
      const [rows] = await pool.query(
        `
        SELECT
          e.exercise_id,
          e.title,
          e.video_s3_url,
          e.duration_minutes,
          pe.order_no,
          CASE
            WHEN px.patient_exercise_id IS NOT NULL THEN TRUE
            ELSE FALSE
          END AS completed
        FROM program_exercises pe
        JOIN exercises e ON e.exercise_id = pe.exercise_id
        LEFT JOIN patient_exercises px
          ON px.exercise_id = e.exercise_id
         AND px.session_id = ?
        WHERE pe.program_id = ?
        ORDER BY pe.order_no
        `,
        [session.session_id, program.program_id]
      );

     exerciseRows = await Promise.all(
  rows.map(async e => ({
    id: e.exercise_id,
    program_id: program.program_id,
    program_name: program.program_name,
    title: e.title,
    videoUrl: await getSignedUrl(e.video_s3_url),
    completed: e.completed,
    duration: e.duration_minutes,
  }))
);

    }

    // =========================
    // 7️⃣ FINAL RESPONSE
    // =========================
    return res.json({
      patientName: patient.name,
      programDayId: programDay.id,
      session: session
        ? {
            sessionId: session.session_id,
            sessionNumber: session.session_number,
          }
        : null,
      todaySummary: {
        total: exerciseRows.length,
        completed: exerciseRows.filter(e => e.completed).length,
      },
      todayExercises: exerciseRows,
      activePrograms,
    });
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a

  } catch (err) {
    console.error('DASHBOARD ERROR:', err);
    return res.status(500).json({ message: 'Dashboard failed' });
  }
};



<<<<<<< HEAD
=======


>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
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
  patient_id,
  name,
  phone,
  gender,
  dob,
  status,
  user_auth_id,
  created_at
FROM patients
WHERE user_auth_id = ?

      `,
      [req.user.userId]
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

<<<<<<< HEAD
res.json({
  patient_id: patient.patient_id, // 👈 ADD THIS
  name: patient.name,
  phone: patient.phone,
  gender: patient.gender,
  dob: patient.dob,
  user_auth_id: patient.user_auth_id,
  photo_url: patient.photo_url,
  status: patient.status,
  created_at: patient.created_at,
});
=======
    res.json({
      patient_id: patient.patient_id, // 👈 ADD THIS
      name: patient.name,
      phone: patient.phone,
      gender: patient.gender,
      dob: patient.dob,
      user_auth_id: patient.user_auth_id,
      photo_url: patient.photo_url,
      status: patient.status,
      created_at: patient.created_at,
    });
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a



  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load profile' });
  }
};

exports.updatePatientProfile = async (req, res) => {
  try {
    const { gender, dob } = req.body;

    await pool.query(
      `
      UPDATE patients
      SET gender = ?, dob = ?
      WHERE user_auth_id = ?
      `,
      [gender, dob, req.user.userId]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('UPDATE PROFILE ERROR:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};


exports.getPatientProgramDetail = async (req, res) => {
  try {
    const { programId } = req.params;

    // Optional safety check: verify patient exists
    const [[patient]] = await pool.query(
      `SELECT patient_id FROM patients WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Fetch static program exercises
    const [rows] = await pool.query(
      `
      SELECT
        e.exercise_id,
        e.title,
        e.video_s3_url
      FROM program_exercises pe
      JOIN exercises e ON e.exercise_id = pe.exercise_id
      WHERE pe.program_id = ?
      ORDER BY pe.order_no
      `,
      [programId]
    );

<<<<<<< HEAD
    res.json({ exercises: rows });
=======
    const exercises = await Promise.all(
      rows.map(async e => ({
        exercise_id: e.exercise_id,
        title: e.title,
        videoUrl: await getSignedUrl(e.video_s3_url),
      }))
    );

    res.json({ exercises });
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a

  } catch (err) {
    console.error('PROGRAM DETAIL ERROR:', err);
    res.status(500).json({ message: 'Program detail failed' });
  }
};













<<<<<<< HEAD
=======

>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
exports.startProgramDay = async (req, res) => {
  const { patient_program_id } = req.body;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

<<<<<<< HEAD
    // 1️⃣ Get last program day
=======
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
    const [[lastDay]] = await conn.query(
      `
      SELECT *
      FROM patient_program_days
      WHERE patient_program_id = ?
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [patient_program_id]
    );
<<<<<<< HEAD

    const today = new Date().toISOString().slice(0, 10);

    // 2️⃣ If last day is today AND still in progress → reuse it
    if (
      lastDay &&
      lastDay.calendar_date.toISOString().slice(0, 10) === today &&
      lastDay.status === 'in_progress'
    ) {
      return res.json({
        program_day_id: lastDay.id,
        program_day: lastDay.program_day,
      });
    }

    // 3️⃣ Get program config
=======
const [[todayDay]] = await conn.query(
  `
  SELECT *
  FROM patient_program_days
  WHERE patient_program_id = ?
  AND calendar_date = CURDATE()
  LIMIT 1
  `,
  [patient_program_id]
);

if (todayDay) {
  await conn.rollback();
  return todayDay; // 🔥 IMPORTANT
}

>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
    const [[pp]] = await conn.query(
      `
      SELECT sessions_per_day, total_program_days
      FROM patient_programs
      WHERE patient_program_id = ?
      `,
      [patient_program_id]
    );

    if (!pp) {
<<<<<<< HEAD
      return res.status(404).json({ message: 'Patient program not found' });
    }

    // 4️⃣ If program already completed
    if (
      lastDay &&
      lastDay.status === 'completed' &&
      lastDay.program_day >= pp.total_program_days
    ) {
      return res.status(400).json({ message: 'Program already completed' });
    }

    // 5️⃣ Decide next day number
=======
      await conn.rollback();
      return res.status(404).json({ message: 'Program not found' });
    }

    if (lastDay && lastDay.status === 'completed' && lastDay.program_day >= pp.total_program_days) {
      await conn.rollback();
      return res.status(400).json({ message: 'Program completed' });
    }

>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
    const programDay = lastDay
      ? lastDay.status === 'completed'
        ? lastDay.program_day + 1
        : lastDay.program_day
      : 1;

<<<<<<< HEAD
    // 6️⃣ Create new day
=======
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
    const programDayId = await generateCustomId('PROGRAM_DAY');

    await conn.query(
      `
      INSERT INTO patient_program_days
<<<<<<< HEAD
      (
        id,
        patient_program_id,
        program_day,
        calendar_date,
        required_sessions,
        completed_sessions,
        status
      )
=======
      (id, patient_program_id, program_day, calendar_date, required_sessions, completed_sessions, status)
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
      VALUES (?, ?, ?, CURDATE(), ?, 0, 'in_progress')
      `,
      [programDayId, patient_program_id, programDay, pp.sessions_per_day]
    );

    await conn.commit();
<<<<<<< HEAD

    res.json({
      program_day_id: programDayId,
      program_day: programDay,
    });

  } catch (err) {
    await conn.rollback();
    console.error('START PROGRAM DAY ERROR:', err);
=======
   const response = { program_day_id: programDayId, program_day: programDay };

if (res && typeof res.json === 'function') {
  res.json(response);
}
return response;



  } catch (err) {
    await conn.rollback();
    console.error(err);
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
};


<<<<<<< HEAD

exports.startSession = async (req, res) => {
  const { patient_program_day_id, session_type } = req.body;
  // session_type = 'M' | 'A' | 'E' | 'N'

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();



    // Prevent duplicate session
    const [[exists]] = await conn.query(
      `
      SELECT session_id FROM patient_sessions
      WHERE patient_program_day_id = ? AND session_number = ?
      `,
      [patient_program_day_id, session_type]
    );

    if (exists) {
      return res.status(400).json({ message: 'Session already started' });
=======
exports.startSession = async (req, res) => {
  const { patient_program_day_id } = req.body;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [[day]] = await conn.query(
      `
      SELECT completed_sessions, required_sessions
      FROM patient_program_days
      WHERE id = ?
      `,
      [patient_program_day_id]
    );
if (!day) {
  await conn.rollback();
  return res.status(404).json({ message: 'Program day not found' });
}

    const nextSessionNumber = day.completed_sessions + 1;
    if (nextSessionNumber > day.required_sessions) {
      await conn.rollback();
      return res.status(400).json({ message: 'All sessions completed' });
    }

    const [[active]] = await conn.query(
      `
      SELECT session_id FROM patient_sessions
      WHERE patient_program_day_id = ? AND status = 'started'
      `,
      [patient_program_day_id]
    );

    if (active) {
      await conn.rollback();
      return res.status(400).json({ message: 'Complete current session first' });
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
    }

    const sessionId = await generateCustomId('SESSION');

    await conn.query(
      `
      INSERT INTO patient_sessions
      (session_id, patient_program_day_id, session_number, status, started_at)
      VALUES (?, ?, ?, 'started', NOW())
      `,
<<<<<<< HEAD
      [sessionId, patient_program_day_id, session_type]
    );

    await conn.commit();
    res.json({ session_id: sessionId });

  } catch (err) {
    console.error('START SESSION ERROR:', err);
    try {
      await conn.rollback();
    } catch (e) { }
    res.status(500).json({
      message: err.message,
      code: err.code
    });
  }
  finally {
=======
      [sessionId, patient_program_day_id, nextSessionNumber]
    );

    await conn.commit();
    res.json({ session_id: sessionId, session_number: nextSessionNumber });

  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: err.message });
  } finally {
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
    conn.release();
  }
};


exports.completeExercise = async (req, res) => {
  const { program_id, exercise_id, session_id, assigned_sets, assigned_reps } = req.body;

  try {
    const [[patient]] = await pool.query(
      `SELECT patient_id FROM patients WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const [[session]] = await pool.query(
      `SELECT session_id, status FROM patient_sessions WHERE session_id = ?`,
      [session_id]
    );

    if (!session || session.status !== 'started') {
      return res.status(400).json({ message: 'Invalid or completed session' });
    }

    const [[existing]] = await pool.query(
      `
      SELECT patient_exercise_id
      FROM patient_exercises
      WHERE session_id = ? AND exercise_id = ?
      `,
      [session_id, exercise_id]
    );

    if (existing) {
      return res.status(400).json({ message: 'Exercise already completed' });
    }

    const patientExerciseId = await generateCustomId('PATIENT_EX');

    await pool.query(
      `
      INSERT INTO patient_exercises
      (
        patient_exercise_id,
        patient_id,
        program_id,
        exercise_id,
        session_id,
        assigned_sets,
        assigned_reps,
        completed,
        completed_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())
      `,
      [
        patientExerciseId,
        patient.patient_id,
        program_id,
        exercise_id,
        session_id,
        assigned_sets || 0,
        assigned_reps || 0,
      ]
    );

    res.json({ message: 'Exercise completed' });

  } catch (err) {
    console.error('COMPLETE EXERCISE ERROR:', err);
    res.status(500).json({ message: err.message });
  }
};







exports.completeSession = async (req, res) => {
  const { session_id, patient_program_day_id } = req.body;
<<<<<<< HEAD

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

=======
  const conn = await pool.getConnection();


  try {
    await conn.beginTransaction();

    const [[session]] = await conn.query(
      `
      SELECT ps.session_id, pp.program_id
      FROM patient_sessions ps
      JOIN patient_program_days ppd ON ppd.id = ps.patient_program_day_id
      JOIN patient_programs pp ON pp.patient_program_id = ppd.patient_program_id
      WHERE ps.session_id = ?
      `,
      [session_id]
    );
    if (!session) {
      await conn.rollback();
      return res.status(404).json({ message: 'Session not found' });
    }
    const [[done]] = await conn.query(
      `SELECT COUNT(*) AS done FROM patient_exercises WHERE session_id = ?`,
      [session_id]
    );

    const [[required]] = await conn.query(
      `SELECT COUNT(*) AS total FROM program_exercises WHERE program_id = ?`,
      [session.program_id]
    );

    if (done.done < required.total) {
      await conn.rollback();
      return res.status(400).json({ message: 'Complete all exercises first' });
    }

>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
    await conn.query(
      `
      UPDATE patient_sessions
      SET status = 'completed', completed_at = NOW()
      WHERE session_id = ?
      `,
      [session_id]
    );

    await conn.query(
      `
      UPDATE patient_program_days
      SET completed_sessions = completed_sessions + 1
      WHERE id = ?
      `,
      [patient_program_day_id]
    );

<<<<<<< HEAD
    // Check if day is completed
=======
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
    await conn.query(
      `
      UPDATE patient_program_days
      SET status = 'completed'
      WHERE id = ?
<<<<<<< HEAD
      AND completed_sessions >= required_sessions
=======
        AND completed_sessions >= required_sessions
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
      `,
      [patient_program_day_id]
    );

    await conn.commit();
    res.json({ message: 'Session completed' });

  } catch (err) {
    await conn.rollback();
<<<<<<< HEAD
    res.status(500).json({ message: 'Failed to complete session' });
=======
    console.error(err);
    res.status(500).json({ message: err.message });
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
  } finally {
    conn.release();
  }
};


<<<<<<< HEAD
=======


>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
exports.getExerciseDetail = async (req, res) => {
  try {
    const { exerciseId } = req.params;

<<<<<<< HEAD
=======
    /* 1️⃣ Get patient */
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
    const [[patient]] = await pool.query(
      `SELECT patient_id FROM patients WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

<<<<<<< HEAD
    const [[exercise]] = await pool.query(
      `
    SELECT
  e.exercise_id,
  e.title,
  e.video_s3_url,
  e.description,
  e.updated_at,
  d.name AS updated_by,
  ppd.calendar_date AS assigned_date,
  pp.total_program_days
FROM exercises e
JOIN program_exercises pe ON pe.exercise_id = e.exercise_id
JOIN patient_programs pp ON pp.program_id = pe.program_id
JOIN patients p ON p.patient_id = pp.patient_id
JOIN patient_program_days ppd ON ppd.patient_program_id = pp.patient_program_id
LEFT JOIN doctors d ON d.doctor_id = p.assigned_doctor_id
WHERE e.exercise_id = ?
ORDER BY ppd.created_at DESC
LIMIT 1


      `,
      [exerciseId]
    );

    let tags = [];

try {
  const [rows] = await pool.query(
    `
    SELECT t.tag_name
    FROM exercise_tags et
    JOIN tags t ON t.tag_id = et.tag_id
    WHERE et.exercise_id = ?
    `,
    [exerciseId]
  );

  tags = rows.map(r => r.tag_name);
} catch (err) {
  // Table doesn't exist OR no tags — that's OK
  console.warn('exercise_tags table missing or empty');
}

res.json({
  exerciseId: exercise.exercise_id,
  title: exercise.title,
  videoUrl: exercise.video_s3_url,
  description: exercise.description,
  assignedDate: exercise.assigned_date,
  updatedBy: exercise.updated_by,
  updatedOn: exercise.assigned_date, // 👈 same date
  totalProgramDays: exercise.total_program_days,
  tags
});


  } catch (err) {
    console.error(err);
=======
    /* 2️⃣ Fetch exercise + tag (tag_id based) */
    const [[exercise]] = await pool.query(
      `
      SELECT
        e.exercise_id,
        e.title,
        e.video_s3_url,
        e.description,
        e.updated_at,
        pt.name AS tag_name,
        d.name AS updated_by,
        ppd.calendar_date AS assigned_date,
        pp.total_program_days
      FROM exercises e

      JOIN program_exercises pe
        ON pe.exercise_id = e.exercise_id

      JOIN patient_programs pp
        ON pp.program_id = pe.program_id

      JOIN patients p
        ON p.patient_id = pp.patient_id

      JOIN patient_program_days ppd
        ON ppd.patient_program_id = pp.patient_program_id

      LEFT JOIN program_tags pt
        ON pt.program_tag_id = e.tag_id

      LEFT JOIN doctors d
        ON d.doctor_id = p.assigned_doctor_id

      WHERE e.exercise_id = ?
        AND p.patient_id = ?

      ORDER BY ppd.created_at DESC
      LIMIT 1
      `,
      [exerciseId, patient.patient_id]
    );

    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    /* 3️⃣ Response */
    res.json({
      exerciseId: exercise.exercise_id,
      title: exercise.title,
      description: exercise.description,
      tag: exercise.tag_name || null,
      videoUrl: await getSignedUrl(exercise.video_s3_url),
      assignedDate: exercise.assigned_date,
      updatedBy: exercise.updated_by,
      updatedOn: exercise.assigned_date,
      totalProgramDays: exercise.total_program_days
    });

  } catch (err) {
    console.error('GET EXERCISE DETAIL ERROR:', err);
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
    res.status(500).json({ message: 'Failed to load exercise detail' });
  }
};

<<<<<<< HEAD
=======

// exports.getExerciseDetail = async (req, res) => {
//   try {
//     const { exerciseId } = req.params;

//     const [[patient]] = await pool.query(
//       `SELECT patient_id FROM patients WHERE user_auth_id = ?`,
//       [req.user.userId]
//     );

//     if (!patient) {
//       return res.status(404).json({ message: 'Patient not found' });
//     }

//     const [[exercise]] = await pool.query(
//       `
//     SELECT
//   e.exercise_id,
//   e.title,
//   e.video_s3_url,
//   e.description,
//   e.updated_at,
//   d.name AS updated_by,
//   ppd.calendar_date AS assigned_date,
//   pp.total_program_days
// FROM exercises e
// JOIN program_exercises pe ON pe.exercise_id = e.exercise_id
// JOIN patient_programs pp ON pp.program_id = pe.program_id
// JOIN patients p ON p.patient_id = pp.patient_id
// JOIN patient_program_days ppd ON ppd.patient_program_id = pp.patient_program_id
// LEFT JOIN doctors d ON d.doctor_id = p.assigned_doctor_id
// WHERE e.exercise_id = ?
// AND p.patient_id = ?

// ORDER BY ppd.created_at DESC
// LIMIT 1


//       `,
//       [exerciseId, patient.patient_id]
//     );

//     let tags = [];

//     try {
//       const [rows] = await pool.query(
//         `
//     SELECT t.tag_name
//     FROM exercise_tags et
//     JOIN tags t ON t.tag_id = et.tag_id
//     WHERE et.exercise_id = ?
//     `,
//         [exerciseId]
//       );

//       tags = rows.map(r => r.tag_name);
//     } catch (err) {
//       // Table doesn't exist OR no tags — that's OK
//       console.warn('exercise_tags table missing or empty');
//     }
// if (!exercise) {
//   return res.status(404).json({ message: 'Exercise not found' });
// }

//     res.json({
//       exerciseId: exercise.exercise_id,
//       title: exercise.title,
//       videoUrl: await getSignedUrl(exercise.video_s3_url),

//       description: exercise.description,
//       assignedDate: exercise.assigned_date,
//       updatedBy: exercise.updated_by,
//       updatedOn: exercise.assigned_date, // 👈 same date
//       totalProgramDays: exercise.total_program_days,
//       tags
//     });


//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Failed to load exercise detail' });
//   }
// };

>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
exports.updatePatientPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

<<<<<<< HEAD
    const photoUrl = `/uploads/patients/${req.file.filename}`;

    await pool.query(
      `
      UPDATE patients
      SET photo_url = ?
      WHERE user_auth_id = ?
      `,
      [photoUrl, req.user.userId]
=======
    const s3Key = await uploadToS3(req.file, 'patients');

    await pool.query(
      `UPDATE patients SET photo_url = ? WHERE user_auth_id = ?`,
      [s3Key, req.user.userId]
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
    );

    res.json({
      message: 'Photo updated',
<<<<<<< HEAD
      photo: photoUrl,
=======
      photo_url: s3Key,
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Photo update failed' });
  }
};
<<<<<<< HEAD
=======






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
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
