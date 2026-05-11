const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { linkCaregiver, getMyPatients, unlinkCaregiver } = require('../controllers/caregiver.controller');

router.post('/link', authenticate, linkCaregiver);
router.get('/patients', authenticate, getMyPatients);
router.delete('/link/:patientId', authenticate, unlinkCaregiver);

module.exports = router;
