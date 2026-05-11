const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { confirmDose, snoozeDose, getDoseHistory, getMissedDoses } = require('../controllers/dose.controller');

router.post('/confirm', authenticate, confirmDose);
router.post('/snooze', authenticate, snoozeDose);
router.get('/history/:patientId', authenticate, getDoseHistory);
router.get('/missed/:patientId', authenticate, getMissedDoses);

module.exports = router;
