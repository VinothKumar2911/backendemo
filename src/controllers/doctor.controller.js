
  const pool = require('../config/db');
  const { generateCustomId } = require('../utils/idGenerator');
const upload = require('../middleware/upload.middleware');


  // const { uploadToS3, getSignedUrl } = require('../config/s3');
  const {
  uploadToS3,
  getSignedUrl,
  deleteFromS3
} = require('../config/s3');

function getCreatorType(createdById) {
  if (!createdById) return null;

  if (createdById.startsWith('DOC')) return 'Doctor';
  if (createdById.startsWith('ADM')) return 'Admin';

  return 'Unknown';
}


  /* =========================
    GET DOCTOR PROFILE
    (NO AUTO CREATE)
  ========================= */
  exports.getDoctorProfile = async (req, res) => {
    const [[doctor]] = await pool.query(
      `SELECT * FROM doctors WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor profile not found. Please register first.',
      });
    }

    res.json({ doctor });
  };

  function formatPhone(phone, countryCode = '+91') {
    if (!phone) return null;

    let cleaned = phone.toString().replace(/\s+/g, '');

    // If already has country code
    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    // Remove leading 0 if exists
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    return `${countryCode}${cleaned}`;
  }

  /* =========================
    CREATE PROGRAM
  ========================= */
  exports.createProgram = async (req, res) => {
    const { name, description, tagIds = [] } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description required' });
    }
    const getDoctorId = async (userId) => {
      const [[doctor]] = await pool.query(
        `SELECT doctor_id FROM doctors WHERE user_auth_id = ?`,
        [userId]
      );
      return doctor?.doctor_id || null;
    };

    const doctorId = await getDoctorId(req.user.userId);
    if (!doctorId) {
      return res.status(403).json({ message: 'Doctor profile not found' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const programId = await generateCustomId('PROGRAM');

    await conn.query(
    `INSERT INTO programs
    (program_id, name, description, created_by_id, status)
    VALUES (?, ?, ?, ?, 'draft')`,
    [programId, name, description, doctorId]
  );


      if (tagIds.length) {
        for (const tagId of tagIds) {
          await conn.query(
            `INSERT INTO program_tag_map (program_id, program_tag_id)
            VALUES (?, ?)`,
            [programId, tagId]
          );
        }
      }

      await conn.commit();

      res.json({ message: 'Program created successfully', programId });
    } catch (err) {
      await conn.rollback();
      console.error('CREATE PROGRAM ERROR:', err);
      res.status(500).json({ message: 'Failed to create program' });
    } finally {
      conn.release();
    }
  };


  exports.uploadPatientPhoto = async (req, res) => {
  const { patientId } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const s3Key = await uploadToS3(req.file, 'patients');
const [[patient]] = await pool.query(
  `
  SELECT patient_id
  FROM patients
  WHERE patient_id = ? AND assigned_doctor_id = (
    SELECT doctor_id FROM doctors WHERE user_auth_id = ?
  )
  `,
  [patientId, req.user.userId]
);

if (!patient) {
  return res.status(403).json({ message: 'Unauthorized patient' });
}

  await pool.query(
    `UPDATE patients SET photo_url=? WHERE patient_id=?`,
    [s3Key, patientId]
  );

  res.json({ message: 'Photo uploaded', s3Key });
};



  /* =========================
    CREATE EXERCISE
  ========================= */
exports.createExercise = async (req, res) => {
  const {
    title,
    description,
    video_s3_url,
    default_sets = 0,
    default_reps = 0,
    duration_minutes = 0,
    category,
    tag_ids = []   // 🔥 ARRAY
  } = req.body;

  if (
  !title ||
  !description ||
  !category ||
  !duration_minutes ||
  !Array.isArray(tag_ids) ||
  tag_ids.length === 0
) {
  return res.status(400).json({
    message: 'Missing required exercise fields'
  });
}


  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [[doctor]] = await conn.query(
      `SELECT doctor_id FROM doctors WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    if (!doctor) {
      await conn.rollback();
      return res.status(403).json({ message: 'Doctor not found' });
    }

    const exerciseId = await generateCustomId('EXERCISE');

    // 1️⃣ Insert exercise
    await conn.query(
      `
      INSERT INTO exercises (
        exercise_id,
        title,
        description,
        category,
        video_s3_url,
        default_sets,
        default_reps,
        duration_minutes,
        created_by_id,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
      `,
      [
        exerciseId,
        title,
        description,
        category || null,
        video_s3_url || null,
        default_sets,
        default_reps,
        duration_minutes,
        doctor.doctor_id
      ]
    );

    // 2️⃣ Insert tag mappings
    for (const tagId of tag_ids) {
      await conn.query(
        `
        INSERT INTO exercise_tag_map (exercise_id, program_tag_id)
        VALUES (?, ?)
        `,
        [exerciseId, tagId]
      );
    }

    await conn.commit();

    res.json({
      message: 'Exercise created successfully',
      exerciseId
    });

  } catch (err) {
    await conn.rollback();
    console.error('CREATE EXERCISE ERROR:', err);
    res.status(500).json({ message: 'Failed to create exercise' });
  } finally {
    conn.release();
  }
};



  // exports.createExercise = async (req, res) => {
  //   const { title, description, video_s3_url, default_sets, default_reps, tagIds = [] } = req.body;

  //   if (!title || !description) {
  //     return res.status(400).json({ message: 'Title and description required' });
  //   }
  //   const getDoctorId = async (userId) => {
  //     const [[doctor]] = await pool.query(
  //       `SELECT doctor_id FROM doctors WHERE user_auth_id = ?`,
  //       [userId]
  //     );
  //     return doctor?.doctor_id || null;
  //   };

  //   const doctorId = await getDoctorId(req.user.userId);
  //   if (!doctorId) {
  //     return res.status(403).json({ message: 'Doctor profile not found' });
  //   }

  //   const conn = await pool.getConnection();

  

  //   try {
  //     await conn.beginTransaction();

  //     const exerciseId = await generateCustomId('EXERCISE');
  // if (!Array.isArray(tagIds) || tagIds.length === 0) {
  //   await conn.rollback();
  //   return res.status(400).json({ message: 'At least one tag is required' });
  // }
  //     await conn.query(
  //       `INSERT INTO exercises
  //       (exercise_id, title, description, video_s3_url,
  //         default_sets, default_reps, created_by_id, status)
  //       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
  //       [
  //         exerciseId,
  //         title,
  //         description,
  //         video_s3_url || null,
  //         default_sets || 0,
  //         default_reps || 0,
  //         doctorId
  //       ]
  //     );

  //     for (const tagId of tagIds) {
  //       await conn.query(
  //         `INSERT INTO exercise_tag_map (exercise_id, program_tag_id)
  //         VALUES (?, ?)`,
  //         [exerciseId, tagId]
  //       );
  //     }

  //     await conn.commit();

  //     res.json({ message: 'Exercise created successfully', exerciseId });
  //   } catch (err) {
  //     await conn.rollback();
  //     console.error('CREATE EXERCISE ERROR:', err);
  //     res.status(500).json({ message: 'Failed to create exercise' });
  //   } finally {
  //     conn.release();
  //   }
  // };


  /* =========================
    ADD EXERCISE TO PROGRAM
    (also used for admin default cloning)
  ========================= */
  exports.addExerciseToProgram = async (req, res) => {
    const { programId, exerciseId, orderNo } = req.body;

    if (!programId || !exerciseId) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    try {
      const programExerciseId = await generateCustomId('PROGRAM_EXERCISE');

      const [[exercise]] = await pool.query(
    `SELECT status FROM exercises WHERE exercise_id = ?`,
    [exerciseId]
  );

  if (!exercise || exercise.status !== 'published') {
    return res.status(403).json({
      message: 'Only published exercises can be added to programs'
    });
  }

      await pool.query(
        `INSERT INTO program_exercises
        (program_exercise_id, program_id, exercise_id, order_no)
        VALUES (?, ?, ?, ?)`,
        [programExerciseId, programId, exerciseId, orderNo || 1]
      );

      res.json({ message: 'Exercise added to program' });
    } catch (err) {
      console.error('ADD EXERCISE ERROR:', err);
      res.status(500).json({ message: 'Failed to add exercise' });
    }
  };



  /* =========================
    CREATE PATIENT
    (Doctor creates BOTH auth + profile)
  ========================= */
  exports.createPatient = async (req, res) => {
  const body = req.body || {};

  const {
    name,
    phone,
    dob,
    gender,
    age,
  } = body;
  if (!name || !phone || !dob || !gender) {
    return res.status(400).json({
      message: 'Missing required fields',
    });
  }

  let photoUrl = null;
if (req.file) {
  photoUrl = await uploadToS3(req.file, 'patients');
}



    // if (!name || !phone || !dob || !gender) {
    //   return res.status(400).json({ message: 'Missing required fields' });
    // }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

    const [[doctor]] = await conn.query(
    `SELECT doctor_id FROM doctors WHERE user_auth_id = ?`,
    [req.user.userId]
  );



      if (!doctor) {
        await conn.rollback();
        return res.status(403).json({ message: 'Doctor profile not found' });
      }


    const phoneWithCountry = formatPhone(phone, '+91');

      const [[existing]] = await conn.query(
    `SELECT id FROM users_auth WHERE phone = ?`,
    [phoneWithCountry]
  );


      if (existing) {
        await conn.rollback();
        return res.status(409).json({ message: 'Patient already exists' });
      }

      const userAuthId = await generateCustomId('USER_AUTH');
      const patientId = await generateCustomId('PATIENT');

    await conn.query(
    `INSERT INTO users_auth (id, phone, role, is_verified)
    VALUES (?, ?, 'patient', 1)`,
    [userAuthId, phoneWithCountry]
  );


    await conn.query(
    `INSERT INTO patients
    (patient_id, user_auth_id, assigned_doctor_id,
      name, phone, dob, gender, age, photo_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [
      patientId,
      userAuthId,
      doctor.doctor_id,
      name,
      phoneWithCountry,
      dob,
      gender,
      age || null,
      photoUrl
    ]
  );



      await conn.commit();
      res.json({ message: 'Patient created successfully', patientId });
    } catch (err) {
      await conn.rollback();
      console.error('CREATE PATIENT ERROR:', err);
      res.status(500).json({ message: 'Failed to create patient' });
    } finally {
      conn.release();
    }
  };


    // exports.listPublishedVideos = async (req, res) => {
    //   try {
    //     const [rows] = await pool.query(
    //       `
    //       SELECT
    //         exercise_id,
    //         title,
    //         duration,
    //         category,
    //         description,
    //         video_url,
    //         created_at
    //       FROM exercises
    //       WHERE status = 'published'
    //       ORDER BY created_at DESC
    //       `
    //     );

    //     res.json(rows);
    //   } catch (err) {
    //     console.error('LIST PUBLISHED VIDEOS ERROR:', err);
    //     res.status(500).json({ message: 'Failed to load videos' });
    //   }
    // };

  /* =========================
    ASSIGN PROGRAM TO PATIENT
    (VERSION SNAPSHOT)
  ========================= */
  exports.assignProgramToPatient = async (req, res) => {
    const {
      patient_id,
      program_id,
      sessions,
      total_program_days,
      start_date,
      exercise_ids,
      override
    } = req.body;

    if (!patient_id || !program_id || !total_program_days) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [[program]] = await conn.query(
        `SELECT version FROM programs
  WHERE program_id = ? AND status = 'published'`,
        [program_id]
      );
  if (!program) {
    await conn.rollback();
    return res.status(403).json({
      message: 'Program is not published and cannot be assigned'
    });
  }

    
      const [[doctor]] = await conn.query(
        `SELECT doctor_id FROM doctors WHERE user_auth_id = ?`,
        [req.user.userId]
      );

      if (!doctor) {
        await conn.rollback();
        return res.status(403).json({ message: 'Doctor not found' });
      }

      const [tags] = await conn.query(
        `
        SELECT pt.name
        FROM program_tag_map ptm
        JOIN program_tags pt ON pt.program_tag_id = ptm.program_tag_id
        WHERE ptm.program_id = ?
        `,
        [program_id]
      );

      const tagNames = tags.map(t => t.name).join(',');

      const startDate = start_date ? new Date(start_date) : new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + total_program_days - 1);

      const patientProgramId = await generateCustomId('PATIENT_PROGRAM');

      const [[patient]] = await conn.query(
  `
  SELECT patient_id
  FROM patients
  WHERE patient_id = ? AND assigned_doctor_id = ?
  `,
  [patient_id, doctor.doctor_id]
);

if (!patient) {
  await conn.rollback();
  return res.status(403).json({ message: 'Unauthorized patient' });
}


      // 1️⃣ patient_programs
      await conn.query(
        `
        INSERT INTO patient_programs
        (
          patient_program_id,
          patient_id,
          program_id,
          version,
          tags,
          assigned_by_doctor_id,
          start_date,
          end_date,
          sessions_per_day,
          sessions,
          total_program_days,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `,
        [
          patientProgramId,
          patient_id,
          program_id,
          program.version,
          tagNames,
          doctor.doctor_id,
          startDate,
          endDate,
          sessions?.length || 1,
          JSON.stringify(sessions || []),
          total_program_days
        ]
      );

      // 2️⃣ overridden exercises
      if (override === true && Array.isArray(exercise_ids)) {
        let order = 1;
        for (const exId of exercise_ids) {
          await conn.query(
            `
            INSERT INTO patient_program_exercises
            (patient_program_exercise_id, patient_program_id, exercise_id, order_no)
            VALUES (?, ?, ?, ?)
            `,
            [
              await generateCustomId('PATIENT_PROGRAM_EX'),
              patientProgramId,
              exId,
              order++
            ]
          );
        }
      }

      // 3️⃣ audit log (INSIDE TX)
      await conn.query(
        `
        INSERT INTO doctor_audit_logs
        (audit_id, doctor_id, patient_id, action, entity_type, entity_id, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          await generateCustomId('AUDIT'),
          doctor.doctor_id,
          patient_id,
          override ? 'ASSIGN_PROGRAM_WITH_OVERRIDE' : 'ASSIGN_PROGRAM',
          'program',
          program_id,
          JSON.stringify({
            overridden: override === true,
            exercises: exercise_ids || [],
            sessions,
            total_program_days,
            start_date
          })
        ]
      );

      await conn.commit();

      return res.json({
        message: 'Program assigned successfully',
        patient_program_id: patientProgramId
      });

    } catch (err) {
      await conn.rollback();
      console.error('ASSIGN PROGRAM ERROR:', err);
      return res.status(500).json({ message: 'Failed to assign program' });
    } finally {
      conn.release();
    }
  };



  /* =========================
    DOCTOR DASHBOARD (CURRENT DB)
  ========================= */
  exports.getDoctorDashboard = async (req, res) => {
    try {
      // 1️⃣ Get doctor_id
      const [[doctor]] = await pool.query(
        `SELECT doctor_id FROM doctors WHERE user_auth_id = ?`,
        [req.user.userId]
      );

      if (!doctor) {
        return res.json({ patients: [] });
      }

      const [patients] = await pool.query(
  `
  SELECT
    p.patient_id,
    p.name AS patient_name,
    p.gender,
    p.age,
    p.photo_url,
    IF(p.status='active',1,0) AS active,

    pp.patient_program_id,
    pp.program_id,
    pr.name AS program_name,

    COUNT(DISTINCT pe.exercise_id) AS total_exercises,
    COUNT(DISTINCT pex.exercise_id) AS completed_exercises

  FROM patients p

  LEFT JOIN patient_programs pp
    ON pp.patient_id = p.patient_id
   AND pp.status = 'active'

  LEFT JOIN programs pr
    ON pr.program_id = pp.program_id

  LEFT JOIN program_exercises pe
    ON pe.program_id = pp.program_id

  LEFT JOIN exercises e
    ON e.exercise_id = pe.exercise_id

  LEFT JOIN patient_exercises pex
    ON pex.patient_id = p.patient_id
   AND pex.program_id = pp.program_id
   AND pex.completed = 1

  WHERE p.assigned_doctor_id = ?
    AND (
      e.exercise_id IS NULL
      OR e.status = 'published'
      OR e.created_by_id = ?
    )

  GROUP BY p.patient_id
  ORDER BY p.created_at DESC
  `,
  [doctor.doctor_id, doctor.doctor_id]
);


      const patientsWithPhotos = await Promise.all(
  patients.map(async p => ({
    ...p,
    photo_url: p.photo_url
      ? await getSignedUrl(p.photo_url)
      : null,
  }))
);

res.json({ patients: patientsWithPhotos });

    } catch (err) {
      console.error('DOCTOR DASHBOARD ERROR:', err);
      res.status(500).json({ message: 'Failed to fetch dashboard' });
    }
  };


  exports.getExercises = async (req, res) => {
  const doctorId = req.user.userId;

  const [rows] = await pool.query(
    `
    SELECT
      e.exercise_id,
      e.title,
      e.description,
      e.video_s3_url,
      e.default_sets,
      e.default_reps,
      e.duration_minutes,
      e.category,  
      e.status,
      e.created_by_id,
      GROUP_CONCAT(pt.name) AS tags
    FROM exercises e
    LEFT JOIN exercise_tag_map etm
      ON etm.exercise_id = e.exercise_id
    LEFT JOIN program_tags pt
      ON pt.program_tag_id = etm.program_tag_id
    WHERE (
      e.created_by_id = ?
      OR e.created_by_id LIKE 'ADM%'
    )
    GROUP BY e.exercise_id
    ORDER BY e.created_at DESC
    `,
    [doctorId]
  );

  res.json({ exercises: rows });
};






  // exports.getExercises = async (req, res) => {
  //   const [[doctor]] = await pool.query(
  //     `SELECT doctor_id FROM doctors WHERE user_auth_id = ?`,
  //     [req.user.userId]
  //   );

  //   const [rows] = await pool.query(
  //     `
  //     SELECT
  //       e.exercise_id,
  //       e.title,
  //       e.description,
  //       e.video_s3_url,
  //       e.default_sets,
  //       e.default_reps,
  //       e.status,
  //       e.created_by_id,

  //       -- 🔥 TAGS
  //       GROUP_CONCAT(pt.name) AS tags,

  //       -- 🔥 DURATION (same logic you used in detail API)
  //       e.duration_minutes

  //     FROM exercises e
  //     LEFT JOIN exercise_tag_map etm
  //       ON etm.exercise_id = e.exercise_id
  //     LEFT JOIN program_tags pt
  //       ON pt.program_tag_id = etm.program_tag_id

  //     WHERE
  // (
  //   e.created_by_id IS NULL
  //   OR e.created_by_id = ?
  // )
  // AND e.status = 'published'



  //     GROUP BY e.exercise_id
  //     ORDER BY e.created_at DESC
  //     `,
  //     [doctor.doctor_id]
  //   );

  //   res.json({ exercises: rows });
  // };

 exports.getProgramTags = async (req, res) => {
  try {
    const [tags] = await pool.query(
      `SELECT program_tag_id, name FROM program_tags ORDER BY name`
    );

    res.json({ tags });

  } catch (err) {
    console.error('GET TAGS ERROR:', err);
    res.status(500).json({ message: 'Failed to load tags' });
  }
};


//   exports.getExerciseById = async (req, res) => {
//     const { id } = req.params;

//     const [[exercise]] = await pool.query(
//       `
//       SELECT
//         e.exercise_id,
//         e.title,
//         e.description,
//         e.video_s3_url,
//         e.default_sets,
//         e.default_reps,
//         e.status,
//         e.created_at,

//         d.name AS uploaded_by,

//         GROUP_CONCAT(pt.name) AS tags
//       FROM exercises e
//       LEFT JOIN doctors d ON d.doctor_id = e.created_by_id
//       LEFT JOIN exercise_tag_map etm ON etm.exercise_id = e.exercise_id
//       LEFT JOIN program_tags pt ON pt.program_tag_id = etm.program_tag_id
//       WHERE e.exercise_id = ?
//       GROUP BY e.exercise_id
//       `,
//       [id]
//     );

//     if (!exercise) {
//       return res.status(404).json({ message: 'Exercise not found' });
//     }

//  res.json({
//   exercise: {
//     ...exercise,
//     videoUrl: await getSignedUrl(exercise.video_s3_url),
//     duration_minutes: exercise.duration_minutes ?? 0,
//     uploaded_on: exercise.created_at,
//   },
// });


//   };


exports.getExerciseById = async (req, res) => {
  const { id } = req.params;

  const [[exercise]] = await pool.query(
    `
   SELECT
  e.exercise_id,
  e.title,
  e.description,
  e.video_s3_url,
  e.default_sets,
  e.default_reps,
  e.duration_minutes,
  e.category,
  e.status,
  e.created_at,
  e.created_by_id,

  -- 🔥 Doctor Name
  d.name AS uploaded_by_name,

  GROUP_CONCAT(pt.name) AS tags
FROM exercises e
LEFT JOIN doctors d
  ON d.doctor_id = e.created_by_id
LEFT JOIN exercise_tag_map etm
  ON etm.exercise_id = e.exercise_id
LEFT JOIN program_tags pt
  ON pt.program_tag_id = etm.program_tag_id
WHERE e.exercise_id = ?
GROUP BY e.exercise_id;

    `,
    [id]
  );

 if (!exercise) {
  return res.status(404).json({ message: 'Exercise not found' });
}

let createdBy = getCreatorType(exercise.created_by_id);
let uploadedByName = createdBy;

if (createdBy === 'Doctor') {
  const [[doctor]] = await pool.query(
    `SELECT name FROM doctors WHERE doctor_id = ?`,
    [exercise.created_by_id]
  );

  uploadedByName = doctor?.name || 'Doctor';
}


res.json({
  exercise: {
    ...exercise,
    created_by: createdBy,            // Doctor / Admin
    uploaded_by_name: uploadedByName, // Doctor name OR Admin
    uploaded_on: exercise.created_at, // Date
    videoUrl: await getSignedUrl(exercise.video_s3_url),
  }
});

};


  // exports.updateExerciseStatus = async (req, res) => {
  //   const { id } = req.params;
  //   const { status } = req.body;

  //   if (!status) {
  //     return res.status(400).json({ message: 'Status is required' });
  //   }

  //   await pool.query(
  //     `
  //     UPDATE exercises
  //     SET status = ?
  //     WHERE exercise_id = ?
  //     `,
  //     [status, id]
  //   );

  //   res.json({ message: 'Exercise status updated', status });
  // };

  exports.getPrograms = async (req, res) => {
    const patientId = req.query.patient_id || null;

    const [[doctor]] = await pool.query(
      `SELECT doctor_id FROM doctors WHERE user_auth_id = ?`,
      [req.user.userId]
    );

    const [programs] = await pool.query(
  `
  SELECT
    p.program_id,
    p.name,
    p.description,
    p.status,
    p.created_by_id,

    -- 🔹 TAG NAMES
    GROUP_CONCAT(DISTINCT pt.name) AS tags,

    -- 🔹 TAG IDS
    GROUP_CONCAT(DISTINCT pt.program_tag_id) AS tag_ids,

    -- 🔹 TOTAL EXERCISES
    COUNT(DISTINCT pe.exercise_id) AS total_exercises,

    -- 🔥 VERY IMPORTANT
    CASE
      WHEN ppa.patient_program_id IS NOT NULL THEN 1
      ELSE 0
    END AS is_assigned

  FROM programs p

  LEFT JOIN program_tag_map ptm ON ptm.program_id = p.program_id
  LEFT JOIN program_tags pt ON pt.program_tag_id = ptm.program_tag_id
  LEFT JOIN program_exercises pe ON pe.program_id = p.program_id

  -- 🔥 JOIN patient_programs ONLY FOR THIS PATIENT
  LEFT JOIN patient_programs ppa
    ON ppa.program_id = p.program_id
  AND ppa.patient_id = ?
  AND ppa.status = 'active'

  WHERE
(
  p.created_by_id LIKE 'ADM%'
  OR p.created_by_id = ?
)
AND p.status IN ('draft', 'published')



  GROUP BY p.program_id
  ORDER BY p.created_at DESC


  `,
  [patientId, doctor.doctor_id]
  );


    res.json({ programs });
  };


  exports.getPublishedExercises = async (req, res) => {
  const [[doctor]] = await pool.query(
    `SELECT doctor_id FROM doctors WHERE user_auth_id = ?`,
    [req.user.userId]
  );

  const [rows] = await pool.query(
    `
    SELECT
      e.exercise_id,
      e.title,
      e.duration_minutes,
      e.category,
      GROUP_CONCAT(pt.name) AS tags,
      GROUP_CONCAT(pt.program_tag_id) AS tag_ids
    FROM exercises e
    LEFT JOIN exercise_tag_map etm
      ON etm.exercise_id = e.exercise_id
    LEFT JOIN program_tags pt
      ON pt.program_tag_id = etm.program_tag_id
    WHERE
      e.status = 'published'
      AND (
        e.created_by_id LIKE 'ADM%'
        OR e.created_by_id = ?
      )
    GROUP BY e.exercise_id
    ORDER BY e.created_at DESC
    `,
    [doctor.doctor_id]
  );

  res.json({ exercises: rows });
};



  exports.getProgramExercises = async (req, res) => {
    const { programId } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
  e.exercise_id,
  e.title,
  e.description,
  e.status,
  pt.name AS tag_name,
  (e.default_sets * e.default_reps) AS duration_minutes
FROM program_exercises pe
JOIN exercises e
  ON e.exercise_id = pe.exercise_id
 AND e.status = 'published'
JOIN programs p
  ON p.program_id = pe.program_id
 AND p.status IN ('draft', 'published')

LEFT JOIN program_tags pt
  ON pt.program_tag_id = e.tag_id
WHERE pe.program_id = ?
ORDER BY pe.order_no

      `,
      [programId]
    );

    res.json({ exercises: rows });
  };

  exports.updateProgramStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status required' });
    }

    await pool.query(
      `
      UPDATE programs
      SET status = ?
      WHERE program_id = ?
      `,
      [status, id]
    );

    res.json({ message: 'Program status updated', status });
  };

  exports.removeExerciseFromProgram = async (req, res) => {
    const { programId, exerciseId } = req.params;

    await pool.query(
      `DELETE FROM program_exercises
      WHERE program_id = ? AND exercise_id = ?`,
      [programId, exerciseId]
    );

    await pool.query(
      `UPDATE programs
      SET version = version + 1
      WHERE program_id = ?`,
      [programId]
    );

    res.json({ message: 'Video removed' });
  };

  /* =========================
    BUMP PROGRAM VERSION
  ========================= */
  exports.bumpProgramVersion = async (req, res) => {
    const { id } = req.params;

    try {
      await pool.query(
        `
        UPDATE programs
        SET version = version + 1
        WHERE program_id = ?
        `,
        [id]
      );

      res.json({ message: 'Program version updated' });
    } catch (err) {
      console.error('BUMP VERSION ERROR:', err);
      res.status(500).json({ message: 'Failed to update version' });
    }
  };


  exports.cloneProgram = async (req, res) => {
    const { programId, newName } = req.body;

    if (!programId || !newName) {
      return res.status(400).json({
        message: 'programId and newName are required',
      });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      /* 1️⃣ Fetch original program */
      const [[program]] = await conn.query(
        `SELECT *
  FROM programs
  WHERE program_id = ?
  AND status = 'published'
  `,
        [programId]
      );

      if (!program) {
        await conn.rollback();
        return res.status(404).json({ message: 'Program not found' });
      }

      /* 2️⃣ Check name uniqueness */
      const [[exists]] = await conn.query(
        `SELECT 1 FROM programs WHERE name = ? LIMIT 1`,
        [newName]
      );

      if (exists) {
        await conn.rollback();
        return res.status(409).json({
          message: 'Program name already exists',
        });
      }

      /* 3️⃣ Create new program */
      const newProgramId = await generateCustomId('PROGRAM');

      await conn.query(
        `
        INSERT INTO programs
        (program_id, name, description, created_by_id, status, version)
        VALUES (?, ?, ?, ?, 'draft', 1)
        `,
        [
          newProgramId,
          newName,
          program.description,
          program.created_by_id,
        ]
      );

      /* 4️⃣ COPY TAGS (🔥 THIS WAS MISSING BEFORE) */
      await conn.query(
        `
        INSERT INTO program_tag_map (program_id, program_tag_id)
        SELECT ?, program_tag_id
        FROM program_tag_map
        WHERE program_id = ?
        `,
        [newProgramId, programId]
      );

      /* 5️⃣ COPY EXERCISES WITH NEW IDS */
      const [exercises] = await conn.query(
        `
        SELECT exercise_id, order_no
        FROM program_exercises
        WHERE program_id = ?
        ORDER BY order_no
        `,
        [programId]
      );

      for (const ex of exercises) {
        await conn.query(
          `
          INSERT INTO program_exercises
          (program_exercise_id, program_id, exercise_id, order_no)
          VALUES (?, ?, ?, ?)
          `,
          [
            await generateCustomId('PROGRAM_EXERCISE'),
            newProgramId,
            ex.exercise_id,
            ex.order_no,
          ]
        );
      }

      await conn.commit();

      return res.json({ programId: newProgramId });
    } catch (err) {
      await conn.rollback();
      console.error('CLONE PROGRAM ERROR:', err);

      return res.status(500).json({
        message: err.message || 'Clone failed',
      });
    } finally {
      conn.release();
    }
  };



  exports.createProgramWithExercises = async (req, res) => {
    const { name, description, tagIds = [], exerciseIds = [] } = req.body;

    // 🔴 BASIC VALIDATION
    if (!name || !exerciseIds.length) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // 🔐 GET DOCTOR
      const [[doctor]] = await conn.query(
        `SELECT doctor_id FROM doctors WHERE user_auth_id = ?`,
        [req.user.userId]
      );

      if (!doctor) {
        await conn.rollback();
        return res.status(403).json({ message: 'Doctor not found' });
      }

      // 🔐 UNIQUE PROGRAM NAME
      const [[exists]] = await conn.query(
        `SELECT 1 FROM programs WHERE name = ? LIMIT 1`,
        [name]
      );

      if (exists) {
        await conn.rollback();
        return res.status(409).json({ message: 'Program name already exists' });
      }

      // ✅ VALIDATE ALL EXERCISES ARE PUBLISHED
      const [invalidExercises] = await conn.query(
        `
        SELECT exercise_id
        FROM exercises
        WHERE exercise_id IN (?)
        AND status != 'published'
        `,
        [exerciseIds]
      );

      if (invalidExercises.length) {
        await conn.rollback();
        return res.status(403).json({
          message: 'Only published exercises can be added to a program',
        });
      }

      // 🆔 CREATE PROGRAM
      const programId = await generateCustomId('PROGRAM');

      await conn.query(
        `
        INSERT INTO programs
        (program_id, name, description, created_by_id, status, version)
        VALUES (?, ?, ?, ?, 'draft', 1)
        `,
        [programId, name, description, doctor.doctor_id]
      );

      // 🏷 TAGS
      for (const tagId of tagIds) {
        await conn.query(
          `
          INSERT INTO program_tag_map (program_id, program_tag_id)
          VALUES (?, ?)
          `,
          [programId, tagId]
        );
      }

      // 🎥 EXERCISES (ORDERED)
      let orderNo = 1;
      for (const exerciseId of exerciseIds) {
        await conn.query(
          `
          INSERT INTO program_exercises
          (program_exercise_id, program_id, exercise_id, order_no)
          VALUES (?, ?, ?, ?)
          `,
          [
            await generateCustomId('PROGRAM_EXERCISE'),
            programId,
            exerciseId,
            orderNo++,
          ]
        );
      }

      await conn.commit();

      return res.json({
        message: 'Program created successfully',
        programId,
      });

    } catch (err) {
      await conn.rollback();
      console.error('CREATE PROGRAM WITH EXERCISES ERROR:', err);
      return res.status(500).json({ message: 'Create failed' });
    } finally {
      conn.release();
    }
  };


  exports.getProgramById = async (req, res) => {
    try {
      const { id } = req.params; // program_id
      const patientId = req.query.patient_id || null;

      const [[program]] = await pool.query(
        `
        SELECT
          p.program_id,
          p.name,
          p.description,
          p.version,
          p.created_by_id,
          p.status,
          GROUP_CONCAT(DISTINCT pt.name) AS tags,

          CASE
            WHEN pp.patient_program_id IS NOT NULL THEN 1
            ELSE 0
          END AS is_assigned

        FROM programs p

        LEFT JOIN program_tag_map ptm
          ON ptm.program_id = p.program_id
        LEFT JOIN program_tags pt
          ON pt.program_tag_id = ptm.program_tag_id

        LEFT JOIN patient_programs pp
          ON pp.program_id = p.program_id
        AND pp.patient_id = ?
        AND pp.status = 'active'

        WHERE p.program_id = ?
  AND p.status IN ('draft', 'published')


        GROUP BY p.program_id
        `,
        [patientId, id]
      );

      if (!program) {
        return res.status(404).json({ message: 'Program not found' });
      }

      res.json({ program });
    } catch (err) {
      console.error('GET PROGRAM BY ID ERROR:', err);
      res.status(500).json({ message: 'Failed to load program' });
    }
  };


  exports.getPatientById = async (req, res) => {
    const { id } = req.params;

    try {
      const [[patient]] = await pool.query(
        `
        SELECT
          p.patient_id AS id,
          p.name,
          p.phone,
          p.gender,
          p.age,
          p.dob,
          p.photo_url,
          IF(p.status = 'active', 1, 0) AS active,
          p.created_at
        FROM patients p
        WHERE p.patient_id = ?
        `,
        [id]
      );

      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      const photoUrl = patient.photo_url
  ? await getSignedUrl(patient.photo_url)
  : null;

res.json({
  patient: {
    ...patient,
    photo_url: photoUrl, // 🔥 SIGNED URL
  },
});

    } catch (err) {
      console.error('GET PATIENT ERROR:', err);
      res.status(500).json({ message: 'Failed to fetch patient' });
    }
  };



  exports.updatePatientStatus = async (req, res) => {
    const { id } = req.params;
    const { active } = req.body; // 1 or 0

    if (active !== 0 && active !== 1) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
      await pool.query(
        `
        UPDATE patients
        SET status = ?
        WHERE patient_id = ?
        `,
        [active ? 'active' : 'inactive', id]
      );

      res.json({ message: 'Patient status updated', active });
    } catch (err) {
      console.error('UPDATE PATIENT STATUS ERROR:', err);
      res.status(500).json({ message: 'Failed to update status' });
    }
  };

  exports.updateDoctorProfile = async (req, res) => {
    const { name, phone, email, experience } = req.body;
    let photoUrl = null;
if (req.file) {
  photoUrl = await uploadToS3(req.file, 'doctors');
}



    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [[doctor]] = await conn.query(
        `SELECT doctor_id, phone, user_auth_id FROM doctors WHERE user_auth_id = ?`,
        [req.user.userId]
      );

      if (!doctor) {
        await conn.rollback();
        return res.status(404).json({ message: 'Doctor not found' });
      }

      // 🔹 Update doctors table
      await conn.query(
        `
        UPDATE doctors
        SET
          name = ?,
          phone = ?,
          email = ?,
          experience = ?,
          photo_url = COALESCE(?, photo_url)
        WHERE doctor_id = ?
        `,
        [name, phone, email, experience, photoUrl, doctor.doctor_id]
      );

      // 🔹 If phone changed → update users_auth also
      if (phone && phone !== doctor.phone) {
        await conn.query(
          `UPDATE users_auth SET phone = ? WHERE id = ?`,
          [phone, doctor.user_auth_id]
        );
      }

      await conn.commit();
      res.json({ message: 'Profile updated successfully' });
    } catch (err) {
      await conn.rollback();
      console.error('UPDATE DOCTOR PROFILE ERROR:', err);
      res.status(500).json({ message: 'Failed to update profile' });
    } finally {
      conn.release();
    }
  };


  /* =========================
    CLONE PROGRAM WITH SELECTED EXERCISES
  ========================= */
  exports.cloneProgramWithExercises = async (req, res) => {
    const { program_id, exercise_ids, new_name } = req.body;

    if (!program_id || !exercise_ids?.length || !new_name) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // 1️⃣ Fetch original program
      const [[program]] = await conn.query(
        `SELECT * FROM programs
  WHERE program_id = ?
  AND status = 'published'`,
        [program_id]
      );

      if (!program) {
        await conn.rollback();
        return res.status(404).json({ message: 'Program not found' });
      }

      // 2️⃣ Create new program
      const newProgramId = await generateCustomId('PROGRAM');

      await conn.query(
        `
        INSERT INTO programs
        (program_id, name, description, created_by_id, status, version)
        VALUES (?, ?, ?, ?, 'draft', 1)
        `,
        [
          newProgramId,
          new_name,
          program.description,
          program.created_by_id,
        ]
      );

      // 3️⃣ Copy tags
      await conn.query(
        `
        INSERT INTO program_tag_map (program_id, program_tag_id)
        SELECT ?, program_tag_id
        FROM program_tag_map
        WHERE program_id = ?
        `,
        [newProgramId, program_id]
      );

      // 4️⃣ Add selected exercises only
      let order = 1;
      for (const exId of exercise_ids) {
        await conn.query(
          `
          INSERT INTO program_exercises
          (program_exercise_id, program_id, exercise_id, order_no)
          VALUES (?, ?, ?, ?)
          `,
          [
            await generateCustomId('PROGRAM_EXERCISE'),
            newProgramId,
            exId,
            order++,
          ]
        );
      }

      await conn.commit();

      res.json({
        message: 'Program cloned successfully',
        program_id: newProgramId,
      });

    } catch (err) {
      await conn.rollback();
      console.error('CLONE PROGRAM WITH EXERCISES ERROR:', err);
      res.status(500).json({ message: 'Clone failed' });
    } finally {
      conn.release();
    }
  };

  exports.getPatientProgramExercises = async (req, res) => {
  const { patientProgramId } = req.params;

  const [overrides] = await pool.query(
    `
    SELECT e.*
    FROM patient_program_exercises ppe
    JOIN exercises e
      ON e.exercise_id = ppe.exercise_id
     AND e.status = 'published'
    WHERE ppe.patient_program_id = ?
    ORDER BY ppe.order_no
    `,
    [patientProgramId]
  );

  if (overrides.length) {
    const withUrls = await Promise.all(
      overrides.map(async e => ({
        ...e,
        videoUrl: await getSignedUrl(e.video_s3_url),
      }))
    );

    return res.json({ exercises: withUrls, source: 'override' });
  }

  const [defaultExercises] = await pool.query(
    `
    SELECT e.*
    FROM program_exercises pe
    JOIN exercises e
      ON e.exercise_id = pe.exercise_id
     AND e.status = 'published'
    WHERE pe.program_id = (
      SELECT program_id
      FROM patient_programs
      WHERE patient_program_id = ?
    )
    ORDER BY pe.order_no
    `,
    [patientProgramId]
  );

  const withUrls = await Promise.all(
    defaultExercises.map(async e => ({
      ...e,
      videoUrl: await getSignedUrl(e.video_s3_url),
    }))
  );

  res.json({ exercises: withUrls, source: 'default' });
};

  /* =========================
    GET PATIENT PROGRAM HISTORY
  ========================= */

  function parseSessions(value) {
    if (!value) return [];

    // Already array
    if (Array.isArray(value)) return value;

    // If JSON string
    if (typeof value === 'string') {
      const trimmed = value.trim();

      // JSON array string
      if (trimmed.startsWith('[')) {
        try {
          return JSON.parse(trimmed);
        } catch {
          return [];
        }
      }

      // Comma-separated string (old data)
      return trimmed.split(',').map(s => s.trim());
    }

    return [];
  }


  /* =========================
    GET PATIENT PROGRAM HISTORY
  ========================= */
  exports.getPatientProgramHistory = async (req, res) => {
    const { patientId } = req.params;

    try {
      const [rows] = await pool.query(
        `
        SELECT
          pp.patient_program_id,
          pp.program_id,
          p.name AS program_name,

          pp.start_date,
          pp.end_date,
          pp.total_program_days,
          pp.sessions_per_day,
          pp.sessions,
          pp.status,

          pp.created_at AS assigned_at

        FROM patient_programs pp
        JOIN programs p ON p.program_id = pp.program_id

        WHERE pp.patient_id = ?
        ORDER BY pp.created_at DESC
        `,
        [patientId]
      );

      res.json({
        programs: rows.map(p => ({
          ...p,
          sessions: parseSessions(p.sessions),
        })),
      });

    } catch (err) {
      console.error('PROGRAM HISTORY ERROR:', err);
      res.status(500).json({ message: 'Failed to fetch program history' });
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

