<<<<<<< HEAD




  const express = require('express');
  const router = express.Router();

  const doctorController = require('../controllers/doctor.controller');
  const { verifyToken, allowDoctor } = require('../middleware/auth.middleware');

  router.use(verifyToken, allowDoctor);

  router.get('/profile', doctorController.getDoctorProfile);

  router.post('/program', doctorController.createProgram);
  router.post('/exercise', doctorController.createExercise);
  router.post('/program/exercise', doctorController.addExerciseToProgram);

  const { uploadPatientPhoto } = require('../middleware/upload.middleware');

  router.post(
    '/patient',
    uploadPatientPhoto.single('photo'), // 🔥 THIS LINE FIXES EVERYTHING
    doctorController.createPatient
  );

  router.post('/assign-program', doctorController.assignProgramToPatient);

  router.get('/dashboard', doctorController.getDoctorDashboard);


  router.get(
    '/exercises',
    verifyToken,
    allowDoctor,
    doctorController.getExercises
  );

  router.get(
    '/exercise/:id',
    verifyToken,
    allowDoctor,
    doctorController.getExerciseById
  );

  router.put(
    '/exercise/:id/status',
    verifyToken,
    allowDoctor,
    doctorController.updateExerciseStatus
  );

  router.get(
    '/program-tags',
    verifyToken,
    allowDoctor,
    doctorController.getProgramTags
  );

  router.get(
    '/programs',
    verifyToken,
    allowDoctor,
    doctorController.getPrograms
  );

router.get(
  '/patient/:patientId/program-history',
 verifyToken,
    allowDoctor,
  doctorController.getPatientProgramHistory
);


  router.put(
    '/program/:id/status',
    verifyToken,
    allowDoctor,
    doctorController.updateProgramStatus
  );

  router.get(
    '/program/:programId/exercises',
    verifyToken,
    allowDoctor,
    doctorController.getProgramExercises
  );

  router.delete(
    '/program/:programId/exercise/:exerciseId',
    verifyToken,
    allowDoctor,
    doctorController.removeExerciseFromProgram
  );

  router.put(
    '/program/:id/version',
    verifyToken,
    allowDoctor,
    doctorController.bumpProgramVersion
  );

  router.post(
    '/program/full-create',
    doctorController.createProgramWithExercises
  );

  router.get(
    '/program/:id',
    verifyToken,
    allowDoctor,
    doctorController.getProgramById
  );


  // 🔹 GET patient profile (eye button)
router.get(
  '/patient/:id',
  verifyToken,
  allowDoctor,
  doctorController.getPatientById
=======




//     const express = require('express');
//     const router = express.Router();
//     const upload = require('../middleware/upload.middleware');


//     const doctorController = require('../controllers/doctor.controller');
//     const { verifyToken, allowDoctor } = require('../middleware/auth.middleware');

//     router.use(verifyToken, allowDoctor);

//     router.get('/profile', doctorController.getDoctorProfile);

//     router.post('/program', doctorController.createProgram);
//     router.post('/exercise', doctorController.createExercise);
//     router.post('/program/exercise', doctorController.addExerciseToProgram);
//   router.get('/patient/exercises',doctorController.getPatientExercises);

//     // const { uploadPatientPhoto } = require('../middleware/upload.middleware');

//     router.post(
//   '/patients/:patientId/photo',
//   verifyToken,
//   allowDoctor,
//   upload.single('photo'),
//   doctorController.uploadPatientPhoto
// );


//     router.post('/assign-program', doctorController.assignProgramToPatient);

//     router.get('/dashboard', doctorController.getDoctorDashboard);
 

//     router.get(
//       '/exercises',
//       verifyToken,
//       allowDoctor,
//       doctorController.getExercises
//     );

//     router.get(
//       '/exercise/:id',
//       verifyToken,
//       allowDoctor,
//       doctorController.getExerciseById
//     );

//     // router.put(
//     //   '/exercise/:id/status',
//     //   verifyToken,
//     //   allowDoctor,
//     //   doctorController.updateExerciseStatus
//     // );


    
//     router.get(
//       '/program-tags',
//       verifyToken,
//       allowDoctor,
//       doctorController.getProgramTags
//     );

//     router.get(
//       '/programs',
//       verifyToken,
//       allowDoctor,
//       doctorController.getPrograms
//     );

//   router.get(
//     '/patient/:patientId/program-history',
//   verifyToken,
//       allowDoctor,
//     doctorController.getPatientProgramHistory
//   );


//     router.put(
//       '/program/:id/status',
//       verifyToken,
//       allowDoctor,
//       doctorController.updateProgramStatus
//     );

//     router.get(
//       '/program/:programId/exercises',
//       verifyToken,
//       allowDoctor,
//       doctorController.getProgramExercises
//     );

//     router.delete(
//       '/program/:programId/exercise/:exerciseId',
//       verifyToken,
//       allowDoctor,
//       doctorController.removeExerciseFromProgram
//     );

//     router.put(
//       '/program/:id/version',
//       verifyToken,
//       allowDoctor,
//       doctorController.bumpProgramVersion
//     );

//     router.post(
//       '/program/full-create',
//       doctorController.createProgramWithExercises
//     );

//     router.get(
//       '/program/:id',
//       verifyToken,
//       allowDoctor,
//       doctorController.getProgramById
//     );


//     // 🔹 GET patient profile (eye button)
//   router.get(
//     '/patient/:id',
//     verifyToken,
//     allowDoctor,
//     doctorController.getPatientById
//   );


//   // 🔹 UPDATE patient active/inactive
//   router.put(
//     '/patient/:id/status',
//     verifyToken,
//     allowDoctor,
//     doctorController.updatePatientStatus
//   );


//   // const { uploadDoctorPhoto } = require('../middleware/upload.middleware');

// router.put(
//   '/profile',
//   verifyToken,
//     allowDoctor,  
//   upload.single('photo'),
//   doctorController.uploadDoctorPhoto
// );
// router.post(
//   '/patients/:patientId/photo',
//   verifyToken,
//     allowDoctor,  
//   upload.single('photo'),
//   doctorController.uploadPatientPhotoByDoctor
// );


//   router.post(
//     '/program/clone-with-exercises',
//     verifyToken,
//     allowDoctor,
//     doctorController.cloneProgramWithExercises
//   );


//   router.get(
//     '/patient-program/:patientProgramId/exercises',
//     verifyToken,
//     allowDoctor,
//     doctorController.getPatientProgramExercises
//   );

//     router.post('/program/clone', verifyToken,allowDoctor,doctorController.cloneProgram);

//     module.exports = router;





const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload.middleware');
const doctorController = require('../controllers/doctor.controller');
const { verifyToken, allowDoctor } = require('../middleware/auth.middleware');

/* =========================
   AUTH MIDDLEWARE
========================= */
router.use(verifyToken, allowDoctor);

/* =========================
   DOCTOR PROFILE
========================= */
router.get('/profile', doctorController.getDoctorProfile);

router.put(
  '/profile',
  upload.single('photo'),
  doctorController.updateDoctorProfile
);

/* =========================
   PATIENT
========================= */

router.post(
  '/patients',
  verifyToken,
  allowDoctor, // or allowAdmin
  upload.single('photo'),
  doctorController.createPatient
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
);
router.get('/patient/:id', doctorController.getPatientById);

<<<<<<< HEAD

// 🔹 UPDATE patient active/inactive
router.put(
  '/patient/:id/status',
  verifyToken,
  allowDoctor,
  doctorController.updatePatientStatus
);


const { uploadDoctorPhoto } = require('../middleware/upload.middleware');

router.put(
  '/profile',
  verifyToken,
  allowDoctor,
  uploadDoctorPhoto.single('photo'),
  doctorController.updateDoctorProfile
);

router.post(
  '/program/clone-with-exercises',
  verifyToken,
  allowDoctor,
  doctorController.cloneProgramWithExercises
=======
router.put('/patient/:id/status', doctorController.updatePatientStatus);
// router.get('program_tags',doctorController,doctorController.getProgramTags);

router.post(
  '/patients/:patientId/photo',
  upload.single('photo'),
  doctorController.uploadPatientPhoto
);

/* =========================
   PROGRAM TAGS
========================= */
router.get('/program-tags', doctorController.getProgramTags);

/* =========================
   PROGRAM
========================= */
router.post('/program', doctorController.createProgram);

router.post(
  '/program-with-exercises',
  doctorController.createProgramWithExercises
);

router.get('/programs', doctorController.getPrograms);

router.get('/program/:id', doctorController.getProgramById);

router.put('/program/:id/status', doctorController.updateProgramStatus);

router.put('/program/:id/bump-version', doctorController.bumpProgramVersion);

router.post('/program/clone', doctorController.cloneProgram);

router.post(
  '/program/clone-with-exercises',
  doctorController.cloneProgramWithExercises
);

/* =========================
   PROGRAM EXERCISES
========================= */
router.post('/program/exercise', doctorController.addExerciseToProgram);

router.get(
  '/program/:programId/exercises',
  doctorController.getProgramExercises
);

router.delete(
  '/program/:programId/exercise/:exerciseId',
  doctorController.removeExerciseFromProgram
);

/* =========================
   EXERCISE
========================= */
router.post('/exercise', doctorController.createExercise);

router.get('/exercises', doctorController.getExercises);

router.get('/exercise/:id', doctorController.getExerciseById);

/* =========================
   ASSIGN PROGRAM
========================= */
router.post(
  '/assign-program',
  doctorController.assignProgramToPatient
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
);

/* =========================
   PATIENT PROGRAM
========================= */
router.get(
  '/patient-program/:patientProgramId/exercises',
  doctorController.getPatientProgramExercises
);
router.get('/published-exercises', doctorController.getPublishedExercises);

router.get(
  '/patient/:patientId/program-history',
  doctorController.getPatientProgramHistory
);

/* =========================
   DASHBOARD
========================= */
router.get('/dashboard', doctorController.getDoctorDashboard);

/* =========================
   PATIENT SIDE (SHARED)
========================= */
router.get(
  '/patient-exercises',
  doctorController.getPatientExercises
);

router.get(
  '/patient-program/:patientProgramId/exercises',
  verifyToken,
  allowDoctor,
  doctorController.getPatientProgramExercises
);

  router.post('/program/clone', verifyToken,allowDoctor,doctorController.cloneProgram);

  module.exports = router;




