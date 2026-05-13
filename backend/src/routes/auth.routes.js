const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, googleAuth, updateFcmToken, getMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/google', googleAuth);
router.post('/update-fcm-token', authenticate, updateFcmToken);
router.get('/me', authenticate, getMe);

module.exports = router;
