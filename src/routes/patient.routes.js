<<<<<<< HEAD
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
=======
// const express = require('express');
// const router = express.Router();
// const { uploadPatientPhoto } = require('../middleware/upload.middleware');
// const upload = require('../middleware/upload.middleware');
// // const patientController = require('../controllers/patient.controller');
// const upload = require('../middleware/upload.middleware');


// const patientController = require('../controllers/patient.controller');
// const {
//   verifyToken,
//   allowPatient,
// } = require('../middleware/auth.middleware');

// // 🔹 DASHBOARD (Programs + Exercises)
// router.get(
//   '/dashboard',
//   verifyToken,
//   allowPatient,
//   patientController.getPatientDashboard
// );

// // 🔹 VIDEO STREAM
// router.get(
//   '/exercise/:exerciseId/video',
//   verifyToken,
//   allowPatient,
//   patientController.getExerciseVideo
// );

// // 🔹 WATCH PROGRESS
// router.post(
//   '/exercise/progress',
//   verifyToken,
//   allowPatient,
//   patientController.updateExerciseProgress
// );

// // 🔹 FEEDBACK
// router.post(
//   '/feedback',
//   verifyToken,
//   allowPatient,
//   patientController.submitFeedback
// );

// router.get(
//   '/profile',
//   verifyToken,
//   allowPatient,
//   patientController.getPatientProfile
// );

// router.put(
//   '/profile',
//   verifyToken,
//   allowPatient,
//   patientController.updatePatientProfile
// );
// router.get(
//   '/program/:programId',
//   verifyToken,
//   allowPatient,
//   patientController.getPatientProgramDetail
// );


// // 🔹 START PROGRAM DAY
// router.post(
//   '/start-program-day',
//   verifyToken,
//   allowPatient,
//   patientController.startProgramDay
// );

// // 🔹 START SESSION
// router.post(
//   '/start-session',
//   verifyToken,
//   allowPatient,
//   patientController.startSession
// );

// // 🔹 COMPLETE SESSION
// router.post(
//   '/complete-session',
//   verifyToken,
//   allowPatient,
//   patientController.completeSession
// );

// // 🔹 COMPLETE EXERCISE
// router.post(
//   '/complete-exercise',
//   verifyToken,
//   allowPatient,
//   patientController.completeExercise
// );

// router.get(
//   '/exercise/:exerciseId',
//   verifyToken,
//   allowPatient,
//   patientController.getExerciseDetail
// );
// // router.get('/patient/exercises', verifyToken,
// //     allowPatient, getPatientExercises);

// router.put(
//   '/profile/photo',
//   verifyToken,
//   allowPatient,
//   upload.single('photo'),

//   patientController.updatePatientPhoto
// );

// router.post(
//   '/patients/photo',
//   verifyToken,
//   allowPatient,
//   upload.single('photo'),
//   patientController.uploadPatientPhoto
// );


// module.exports = router;





const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload.middleware');
const patientController = require('../controllers/patient.controller');
const { verifyToken, allowPatient } = require('../middleware/auth.middleware');

// DASHBOARD
router.get('/dashboard', verifyToken, allowPatient, patientController.getPatientDashboard);

// EXERCISE
router.get('/exercise/:exerciseId/video', verifyToken, allowPatient, patientController.getExerciseVideo);
router.get('/exercise/:exerciseId', verifyToken, allowPatient, patientController.getExerciseDetail);
router.post('/exercise/progress', verifyToken, allowPatient, patientController.updateExerciseProgress);
router.post('/complete-exercise', verifyToken, allowPatient, patientController.completeExercise);

// PROGRAM
router.get('/program/:programId', verifyToken, allowPatient, patientController.getPatientProgramDetail);
router.post('/start-program-day', verifyToken, allowPatient, patientController.startProgramDay);
router.post('/start-session', verifyToken, allowPatient, patientController.startSession);
router.post('/complete-session', verifyToken, allowPatient, patientController.completeSession);

// FEEDBACK
router.post('/feedback', verifyToken, allowPatient, patientController.submitFeedback);

// PROFILE
router.get('/profile', verifyToken, allowPatient, patientController.getPatientProfile);
router.put('/profile', verifyToken, allowPatient, patientController.updatePatientProfile);
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a

// PHOTO (ONLY ONE)
router.put(
  '/profile/photo',
  verifyToken,
  allowPatient,
<<<<<<< HEAD
  uploadPatientPhoto.single('photo'),
  patientController.updatePatientPhoto
);

=======
  upload.single('photo'),
  patientController.updatePatientPhoto
);
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a

    module.exports = router;
