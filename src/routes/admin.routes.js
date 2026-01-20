// const express = require('express');
// const router = express.Router();


// const adminController = require('../controllers/admin.controller');
// const { verifyToken, allowAdmin } = require('../middleware/auth.middleware');

// // DASHBOARD
// router.get('/dashboard', verifyToken, allowAdmin, adminController.getAdminDashboard);

// // DOCTORS
// router.post('/doctors', verifyToken, allowAdmin, adminController.createDoctor);
// router.get('/doctors', verifyToken, allowAdmin, adminController.listDoctors);
// router.patch('/doctors/:id/status', verifyToken, allowAdmin, adminController.updateDoctorStatus);

// // PATIENTS
// router.get('/patients', verifyToken, allowAdmin, adminController.listPatients);
// // PATIENTS (ADMIN)
// router.post('/patients', verifyToken, allowAdmin, adminController.createPatient);
// // router.get('/patients', verifyToken, allowAdmin, adminController.listPatients);
// router.get('/patients/:id', verifyToken, allowAdmin, adminController.getPatientById);
// router.patch('/patients/:id/status', verifyToken, allowAdmin, adminController.updatePatientStatus);

// // VIDEOS
// router.get('/videos', verifyToken, allowAdmin, adminController.listVideos);


// // ANALYTICS
// router.get('/analytics', verifyToken, allowAdmin, adminController.getAnalytics);
// router.patch(
//   '/doctors/:id/status',
//   verifyToken,
//   allowAdmin,
//   adminController.updateDoctorStatus
// );


// router.get(
//   '/support',
//   verifyToken,
//   allowAdmin,
//   adminController.listSupportRequests
// );

// // VIDEOS
// router.get('/videos', verifyToken, allowAdmin, adminController.listVideos);
// router.post('/videos', verifyToken, allowAdmin, adminController.createVideo);
// router.put('/videos/:id', verifyToken, allowAdmin, adminController.updateVideo);
// router.patch('/videos/:id/status', verifyToken, allowAdmin, adminController.updateVideoStatus);


// module.exports = router;


const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { verifyToken, allowAdmin } = require('../middleware/auth.middleware');

/* =========================
   DASHBOARD
========================= */
router.get(
  '/dashboard',
  verifyToken,
  allowAdmin,
  adminController.getAdminDashboard
);

/* =========================
   DOCTORS
========================= */
router.post(
  '/doctors',
  verifyToken,
  allowAdmin,
  adminController.createDoctor
);

router.get(
  '/doctors',
  verifyToken,
  allowAdmin,
  adminController.listDoctors
);

router.patch(
  '/doctors/:id/status',
  verifyToken,
  allowAdmin,
  adminController.updateDoctorStatus
);

/* =========================
   PATIENTS
========================= */
router.post(
  '/patients',
  verifyToken,
  allowAdmin,
  adminController.createPatient
);

router.get(
  '/patients',
  verifyToken,
  allowAdmin,
  adminController.listPatients
);

router.get(
  '/patients/:id',
  verifyToken,
  allowAdmin,
  adminController.getPatientById
);

router.patch(
  '/patients/:id/status',
  verifyToken,
  allowAdmin,
  adminController.updatePatientStatus
);

/* =========================
   VIDEOS (ADMIN – ALL)
========================= */
router.get(
  '/videos',
  verifyToken,
  allowAdmin,
  adminController.listVideos
);

router.post(
  '/videos',
  verifyToken,
  allowAdmin,
  adminController.createVideo
);

router.put(
  '/videos/:id',
  verifyToken,
  allowAdmin,
  adminController.updateVideo
);

router.patch(
  '/videos/:id/status',
  verifyToken,
  allowAdmin,
  adminController.updateVideoStatus
);

/* =========================
   SUPPORT REQUESTS
========================= */
router.get(
  '/support',
  verifyToken,
  allowAdmin,
  adminController.listSupportRequests
);

/* =========================
   ANALYTICS
========================= */
router.get(
  '/analytics',
  verifyToken,
  allowAdmin,
  adminController.getAnalytics
);
// admin.routes.js
router.patch(
  '/programs/:id/status',
  verifyToken,
  allowAdmin,
  adminController.updateProgramStatus
);
// router.get('/patient/exercises',verifyToken,
//   allowAdmin,getPatientExercises);

module.exports = router;
