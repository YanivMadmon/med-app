const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  getMedications,
  createMedication,
  updateMedication,
  deleteMedication,
  getTodayMedications,
} = require('../controllers/medication.controller');

router.get('/:patientId', authenticate, getMedications);
router.get('/:patientId/today', authenticate, getTodayMedications);
router.post('/', authenticate, createMedication);
router.put('/:id', authenticate, updateMedication);
router.delete('/:id', authenticate, deleteMedication);

module.exports = router;
