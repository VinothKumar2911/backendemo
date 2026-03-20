    const express = require('express');
    const router = express.Router();
    const {
  uploadPatientPhoto,
} = require('../middleware/upload.middleware');


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
      patientController.updateExerciseProgress
    );

    // 🔹 FEEDBACK
    router.post(
      '/feedback',
      verifyToken,
      allowPatient,
      patientController.submitFeedback
    );

    router.get(
      '/profile',
      verifyToken,
      allowPatient,
      patientController.getPatientProfile
    );

    router.put(
      '/profile',
      verifyToken,
      allowPatient,
      patientController.updatePatientProfile
    );
    router.get(
      '/program/:programId',
      verifyToken,
      allowPatient,
      patientController.getPatientProgramDetail
    );


    // 🔹 START PROGRAM DAY
    router.post(
      '/start-program-day',
      verifyToken,
      allowPatient,
      patientController.startProgramDay
    );

    // 🔹 START SESSION
    router.post(
      '/start-session',
      verifyToken,
      allowPatient,
      patientController.startSession
    );

    // 🔹 COMPLETE SESSION
    router.post(
      '/complete-session',
      verifyToken,
      allowPatient,
      patientController.completeSession
    );

    // 🔹 COMPLETE EXERCISE
    router.post(
      '/complete-exercise',
      verifyToken,
      allowPatient,
      patientController.completeExercise
    );

  router.get(
    '/exercise/:exerciseId',
    verifyToken,
    allowPatient,
    patientController.getExerciseDetail
  );

// PHOTO (ONLY ONE)
router.put(
  '/profile/photo',
  verifyToken,
  allowPatient,
  uploadPatientPhoto.single('photo'),
  patientController.updatePatientPhoto
);


    module.exports = router;
