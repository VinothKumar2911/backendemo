const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { verifyToken, allowAdmin } = require('../middleware/auth.middleware');

// DASHBOARD
router.get('/dashboard', verifyToken, allowAdmin, adminController.getAdminDashboard);

// DOCTORS
router.post('/doctors', verifyToken, allowAdmin, adminController.createDoctor);
router.get('/doctors', verifyToken, allowAdmin, adminController.listDoctors);
router.patch('/doctors/:id/status', verifyToken, allowAdmin, adminController.updateDoctorStatus);

// PATIENTS
router.get('/patients', verifyToken, allowAdmin, adminController.listPatients);

// VIDEOS
router.get('/videos', verifyToken, allowAdmin, adminController.listVideos);

// SUPPORT
router.get('/support', verifyToken, allowAdmin, adminController.listSupportRequests);

// ANALYTICS
router.get('/analytics', verifyToken, allowAdmin, adminController.getAnalytics);

// PROFILE
router.get('/profile', verifyToken, allowAdmin, adminController.getAdminProfile);
router.put('/profile', verifyToken, allowAdmin, adminController.updateAdminProfile);

module.exports = router;
