const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { sendOTP, verifyOTP } = require('../services/otp.service');

// POST /auth/send-otp
const sendOtp = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    await sendOTP(phone);
    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Failed to send OTP:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// POST /auth/verify-otp
const verifyOtp = async (req, res) => {
  const { phone, code, name, role } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and code are required' });
  }

  const result = verifyOTP(phone, code);
  if (!result.valid) {
    return res.status(401).json({ error: result.reason });
  }

  try {
    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      if (!name || !role) {
        return res.status(400).json({ error: 'Name and role required for new users' });
      }
      user = await prisma.user.create({
        data: { phone, name, role },
      });

      // Create patient profile if role is PATIENT
      if (role === 'PATIENT') {
        await prisma.patientProfile.create({
          data: { userId: user.id },
        });
      }

      // Create free subscription if role is CAREGIVER
      if (role === 'CAREGIVER') {
        await prisma.subscription.create({
          data: { userId: user.id },
        });
      }
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ token, user });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /auth/update-fcm-token
const updateFcmToken = async (req, res) => {
  const { fcmToken } = req.body;
  const userId = req.user.id;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });
    res.json({ message: 'FCM token updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /auth/me
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { subscription: true, patientProfile: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { sendOtp, verifyOtp, updateFcmToken, getMe };
