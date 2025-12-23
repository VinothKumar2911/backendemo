const express = require('express');
const router = express.Router();
module.exports = router;

const doctorController = require('../controllers/doctor.controller');
const {
  verifyToken,
  allowDoctor,
} = require('../middleware/auth.middleware');

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

// Attach Exercise to Program
router.post(
  '/program/exercise',
  verifyToken,
  allowDoctor,
  doctorController.addExerciseToProgram
);

// Assign Program to Patient
router.post(
  '/assign-program',
  verifyToken,
  allowDoctor,
  doctorController.assignProgramToPatient
);

router.get(
  '/dashboard',
  verifyToken,
  allowDoctor,
  doctorController.getDoctorDashboard
);

