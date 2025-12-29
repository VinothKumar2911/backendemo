const express = require('express');
const router = express.Router();

const doctorController = require('../controllers/doctor.controller');
const { verifyToken, allowDoctor } = require('../middleware/auth.middleware');

// ✅ CREATE DOCTOR PROFILE (FIRST)
router.post(
  '/profile',
  verifyToken,
  allowDoctor,
  doctorController.createDoctorProfile
);

// ✅ CREATE PROGRAM
router.post(
  '/program',
  verifyToken,
  allowDoctor,
  doctorController.createProgram
);

// ✅ CREATE EXERCISE
router.post(
  '/exercise',
  verifyToken,
  allowDoctor,
  doctorController.createExercise
);

// ✅ ATTACH EXERCISE TO PROGRAM
router.post(
  '/program/exercise',
  verifyToken,
  allowDoctor,
  doctorController.addExerciseToProgram
);

// ✅ ASSIGN PROGRAM TO PATIENT
router.post(
  '/assign-program',
  verifyToken,
  allowDoctor,
  doctorController.assignProgramToPatient
);

// ✅ DOCTOR DASHBOARD
router.get(
  '/dashboard',
  verifyToken,
  allowDoctor,
  doctorController.getDoctorDashboard
);

router.put(
  '/profile',
  verifyToken,
  allowDoctor,
  doctorController.updateDoctorProfile
);
// ✅ GET DOCTOR PROFILE
router.get(
  '/profile',
  verifyToken,
  allowDoctor,
  doctorController.getDoctorProfile
);
const upload = require('../middleware/upload.middleware');

router.post(
  '/patient',
  verifyToken,
  allowDoctor,
  upload.single('photo'),
  doctorController.createPatient
);

router.put(
  '/patient/:id/status',
  verifyToken,
  allowDoctor,
  doctorController.updatePatientStatus
);
router.get(
  '/patient/:id',
  verifyToken,
  allowDoctor,
  doctorController.getPatientProfile
);

router.get(
  '/patient/:id/history',
  verifyToken,
  allowDoctor,
  doctorController.getPatientMedicalHistory
);
router.get(
  '/programs',
  verifyToken,
  allowDoctor,
  doctorController.getDoctorPrograms
);
router.put(
  '/program/:id/status',
  verifyToken,
  allowDoctor,
  doctorController.updateProgramStatus
);
router.get(
  '/exercises',
  verifyToken,
  allowDoctor,
  doctorController.getDoctorExercises
);

router.put(
  '/exercise/:id/status',
  verifyToken,
  allowDoctor,
  doctorController.updateExerciseStatus
);
router.get(
  '/program/:id/exercises',
  verifyToken,
  allowDoctor,
  doctorController.getProgramExercises
);
router.get(
  '/exercise/:id',
  verifyToken,
  allowDoctor,
  doctorController.getExerciseById
);


// ASSIGN EXERCISES TO PATIENT
router.post(
  '/assign-exercises',
  verifyToken,
  allowDoctor,
  doctorController.assignExercisesToPatient
);
// ✅ UPDATE EXERCISE DETAILS (TITLE, DESCRIPTION)
router.put(
  '/exercise/:id',
  verifyToken,
  allowDoctor,
  doctorController.updateExercise
);


module.exports = router;
