const express = require('express');
const router = express.Router();
module.exports = router;

const patientController = require('../controllers/patient.controller');
const {
  verifyToken,
  allowPatient,
} = require('../middleware/auth.middleware');


router.get(
  '/exercise/:exerciseId/video',
  verifyToken,
  allowPatient,
  patientController.getExerciseVideo
);

router.post(
  '/exercise/progress',
  verifyToken,
  allowPatient,
  patientController.updateProgress
);

router.post(
  '/feedback',
  verifyToken,
  allowPatient,
  patientController.submitFeedback
);

router.get(
  '/dashboard',
  verifyToken,
  allowPatient,
  patientController.getPatientDashboard
);
