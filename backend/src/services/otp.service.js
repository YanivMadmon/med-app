const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
};

const sendOTP = async (phone) => {
  const otp = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore.set(phone, { otp, expiresAt });

  await client.messages.create({
    body: `Your MedApp code is: ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });

  return otp;
};

const verifyOTP = (phone, code) => {
  const record = otpStore.get(phone);

  if (!record) return { valid: false, reason: 'OTP not found' };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return { valid: false, reason: 'OTP expired' };
  }
  if (record.otp !== code) return { valid: false, reason: 'Wrong code' };

  otpStore.delete(phone);
  return { valid: true };
};

module.exports = { sendOTP, verifyOTP };
