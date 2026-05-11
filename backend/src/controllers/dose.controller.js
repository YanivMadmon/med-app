const prisma = require('../utils/prisma');

// POST /doses/confirm — patient confirms they took a dose
const confirmDose = async (req, res) => {
  const { scheduleId, scheduledAt } = req.body;

  if (!scheduleId || !scheduledAt) {
    return res.status(400).json({ error: 'scheduleId and scheduledAt are required' });
  }

  try {
    const doseLog = await prisma.doseLog.upsert({
      where: {
        // use a unique constraint on scheduleId + scheduledAt
        scheduleId_scheduledAt: {
          scheduleId,
          scheduledAt: new Date(scheduledAt),
        },
      },
      update: {
        status: 'TAKEN',
        takenAt: new Date(),
      },
      create: {
        scheduleId,
        scheduledAt: new Date(scheduledAt),
        takenAt: new Date(),
        status: 'TAKEN',
      },
    });

    res.json(doseLog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /doses/snooze — patient snoozes a dose reminder
const snoozeDose = async (req, res) => {
  const { scheduleId, scheduledAt } = req.body;

  try {
    const doseLog = await prisma.doseLog.upsert({
      where: {
        scheduleId_scheduledAt: {
          scheduleId,
          scheduledAt: new Date(scheduledAt),
        },
      },
      update: { status: 'SNOOZED' },
      create: {
        scheduleId,
        scheduledAt: new Date(scheduledAt),
        status: 'SNOOZED',
      },
    });

    res.json(doseLog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /doses/history/:patientId?days=7 — weekly adherence history
const getDoseHistory = async (req, res) => {
  const { patientId } = req.params;
  const days = parseInt(req.query.days) || 7;

  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);

  try {
    const medications = await prisma.medication.findMany({
      where: { patientId, isActive: true },
      include: {
        schedules: {
          include: {
            doseLogs: {
              where: { scheduledAt: { gte: from } },
              orderBy: { scheduledAt: 'desc' },
            },
          },
        },
      },
    });

    // Calculate adherence %
    let total = 0;
    let taken = 0;

    medications.forEach((med) => {
      med.schedules.forEach((schedule) => {
        schedule.doseLogs.forEach((log) => {
          total++;
          if (log.status === 'TAKEN') taken++;
        });
      });
    });

    const adherencePercent = total > 0 ? Math.round((taken / total) * 100) : 0;

    res.json({ medications, adherencePercent, total, taken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /doses/missed/:patientId — get all missed doses (for caregiver alerts)
const getMissedDoses = async (req, res) => {
  const { patientId } = req.params;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  try {
    const missed = await prisma.doseLog.findMany({
      where: {
        status: 'MISSED',
        scheduledAt: { gte: startOfDay },
        schedule: {
          medication: { patientId, isActive: true },
        },
      },
      include: {
        schedule: {
          include: { medication: true },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    res.json(missed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { confirmDose, snoozeDose, getDoseHistory, getMissedDoses };
