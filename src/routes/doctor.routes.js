



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
);


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
);


router.get(
  '/patient-program/:patientProgramId/exercises',
  verifyToken,
  allowDoctor,
  doctorController.getPatientProgramExercises
);

  router.post('/program/clone', verifyToken,allowDoctor,doctorController.cloneProgram);

  module.exports = router;




