


const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');

// AUTH
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);

// SUPPORT
router.post('/support/create', authController.createSupportRequest);

module.exports = router;
