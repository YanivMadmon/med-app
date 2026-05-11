const prisma = require('../utils/prisma');

// POST /caregivers/link — link a caregiver to a patient
const linkCaregiver = async (req, res) => {
  const caregiverId = req.user.id;
  const { patientPhone } = req.body;

  if (!patientPhone) {
    return res.status(400).json({ error: 'patientPhone is required' });
  }

  try {
    const patient = await prisma.user.findUnique({ where: { phone: patientPhone } });

    if (!patient || patient.role !== 'PATIENT') {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const link = await prisma.caregiverPatient.upsert({
      where: {
        caregiverId_patientId: { caregiverId, patientId: patient.id },
      },
      update: {},
      create: { caregiverId, patientId: patient.id, isOwner: true },
    });

    res.status(201).json({ link, patient });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /caregivers/patients — get all patients linked to this caregiver
const getMyPatients = async (req, res) => {
  const caregiverId = req.user.id;

  try {
    const links = await prisma.caregiverPatient.findMany({
      where: { caregiverId },
      include: {
        patient: {
          include: {
            medications: {
              where: { isActive: true },
              include: { schedules: true },
            },
          },
        },
      },
    });

    const patients = links.map((l) => l.patient);
    res.json(patients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /caregivers/link/:patientId — unlink a patient
const unlinkCaregiver = async (req, res) => {
  const caregiverId = req.user.id;
  const { patientId } = req.params;

  try {
    await prisma.caregiverPatient.delete({
      where: { caregiverId_patientId: { caregiverId, patientId } },
    });
    res.json({ message: 'Patient unlinked' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { linkCaregiver, getMyPatients, unlinkCaregiver };
