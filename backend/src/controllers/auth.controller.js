const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../utils/prisma');
const { sendOTP, verifyOTP } = require('../services/otp.service');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helper: generate JWT ─────────────────────────────────
const generateToken = (user) =>
  jwt.sign(
    { id: user.id, phone: user.phone, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

// ─── Helper: ensure subscription exists ──────────────────
const ensureSubscription = async (userId, role) => {
  if (role === 'CAREGIVER') {
    const exists = await prisma.subscription.findUnique({ where: { userId } });
    if (!exists) await prisma.subscription.create({ data: { userId } });
  }
};

// ─── Helper: ensure patient profile exists ────────────────
const ensurePatientProfile = async (userId, role) => {
  if (role === 'PATIENT') {
    const exists = await prisma.patientProfile.findUnique({ where: { userId } });
    if (!exists) await prisma.patientProfile.create({ data: { userId } });
  }
};

// ─────────────────────────────────────────────────────────
// POST /auth/send-otp
// ─────────────────────────────────────────────────────────
const sendOtp = async (req, res) => {
  const { phone } = req.body;

  if (!phone || phone.trim().length < 9) {
    return res.status(400).json({ error: 'מספר טלפון לא תקין' });
  }

  try {
    await sendOTP(phone.trim());
    res.json({ message: 'קוד נשלח בהצלחה' });
  } catch (err) {
    console.error('Failed to send OTP:', err);
    res.status(500).json({ error: 'שגיאה בשליחת הקוד. נסה שוב.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /auth/verify-otp
// ─────────────────────────────────────────────────────────
const verifyOtp = async (req, res) => {
  const { phone, code, name, role } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: 'טלפון וקוד נדרשים' });
  }

  const result = verifyOTP(phone, code);
  if (!result.valid) {
    return res.status(401).json({ error: result.reason });
  }

  try {
    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      if (!name || !role) {
        return res.status(400).json({ error: 'שם ותפקיד נדרשים למשתמש חדש' });
      }
      user = await prisma.user.create({
        data: { phone, name, role },
      });
      await ensurePatientProfile(user.id, role);
      await ensureSubscription(user.id, role);
    }

    const token = generateToken(user);
    res.json({ token, user, isNew: false });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /auth/google
// ─────────────────────────────────────────────────────────
const googleAuth = async (req, res) => {
  const { idToken, role } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'Google token נדרש' });
  }

  try {
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: avatar } = payload;

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    const isNew = !user;

    if (!user) {
      if (!role) {
        return res.status(400).json({ error: 'תפקיד נדרש להרשמה' });
      }
      user = await prisma.user.create({
        data: { googleId, email, name, avatar, role },
      });
      await ensurePatientProfile(user.id, role);
      await ensureSubscription(user.id, role);
    } else if (!user.googleId) {
      // Link Google to existing account
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, avatar },
      });
    }

    const token = generateToken(user);
    res.json({ token, user, isNew });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'אימות Google נכשל' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /auth/update-fcm-token
// ─────────────────────────────────────────────────────────
const updateFcmToken = async (req, res) => {
  const { fcmToken } = req.body;
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { fcmToken },
    });
    res.json({ message: 'FCM token עודכן' });
  } catch (err) {
    res.status(500).json({ error: 'שגיאת שרת' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /auth/me
// ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { subscription: true, patientProfile: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'שגיאת שרת' });
  }
};

module.exports = { sendOtp, verifyOtp, googleAuth, updateFcmToken, getMe };
