const express = require('express');
const router = express.Router();

const patientController = require('../controllers/patient.controller');
const {
  verifyToken,
  allowPatient,
} = require('../middleware/auth.middleware');

// 🔹 DASHBOARD (Programs + Exercises)
router.get(
  '/dashboard',
  verifyToken,
  allowPatient,
  patientController.getPatientDashboard
);

// 🔹 VIDEO STREAM
router.get(
  '/exercise/:exerciseId/video',
  verifyToken,
  allowPatient,
  patientController.getExerciseVideo
);

// 🔹 WATCH PROGRESS
router.post(
  '/exercise/progress',
  verifyToken,
  allowPatient,
  patientController.updateProgress
);

// 🔹 FEEDBACK
router.post(
  '/feedback',
  verifyToken,
  allowPatient,
  patientController.submitFeedback
);

module.exports = router;
