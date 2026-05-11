const prisma = require('../utils/prisma');

// GET /medications/:patientId — get all medications for a patient
const getMedications = async (req, res) => {
  const { patientId } = req.params;

  try {
    const medications = await prisma.medication.findMany({
      where: { patientId, isActive: true },
      include: { schedules: true },
      orderBy: { createdAt: 'asc' },
    });

    res.json(medications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /medications — add a new medication
const createMedication = async (req, res) => {
  const { patientId, name, dosage, photoUrl, notes, schedules } = req.body;

  if (!patientId || !name || !dosage || !schedules?.length) {
    return res.status(400).json({ error: 'patientId, name, dosage, and schedules are required' });
  }

  try {
    const medication = await prisma.medication.create({
      data: {
        patientId,
        name,
        dosage,
        photoUrl,
        notes,
        schedules: {
          create: schedules.map((s) => ({
            time: s.time,
            alertDelayMinutes: s.alertDelayMinutes ?? 30,
          })),
        },
      },
      include: { schedules: true },
    });

    res.status(201).json(medication);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /medications/:id — update a medication
const updateMedication = async (req, res) => {
  const { id } = req.params;
  const { name, dosage, photoUrl, notes } = req.body;

  try {
    const medication = await prisma.medication.update({
      where: { id },
      data: { name, dosage, photoUrl, notes },
      include: { schedules: true },
    });
    res.json(medication);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /medications/:id — soft delete (set isActive = false)
const deleteMedication = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.medication.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({ message: 'Medication deactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /medications/:patientId/today — get today's doses with status
const getTodayMedications = async (req, res) => {
  const { patientId } = req.params;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const medications = await prisma.medication.findMany({
      where: { patientId, isActive: true },
      include: {
        schedules: {
          include: {
            doseLogs: {
              where: {
                scheduledAt: { gte: startOfDay, lte: endOfDay },
              },
            },
          },
        },
      },
    });

    res.json(medications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getMedications, createMedication, updateMedication, deleteMedication, getTodayMedications };
