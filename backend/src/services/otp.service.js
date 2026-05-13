const twilio = require('twilio');

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

const getClient = () => {
  // Lazy init — only create when actually sending (not at module load)
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
};

const sendOTP = async (phone) => {
  const otp = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore.set(phone, { otp, expiresAt });

  // In development, skip real SMS and write OTP to file for easy testing
  if (!process.env.TWILIO_ACCOUNT_SID?.startsWith('AC')) {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const otpFile = path.join(os.tmpdir(), 'last-otp.txt');
    process.stdout.write(`[DEV] OTP for ${phone}: ${otp}\n`);
    fs.writeFileSync(otpFile, otp);
    return otp;
  }

  await getClient().messages.create({
    body: `Your MedApp code is: ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });

  return otp;
};

const DEV_CODE = '000000'; // Master code for development only

const verifyOTP = (phone, code) => {
  // Dev bypass — always works in development
  const isDev = !process.env.TWILIO_ACCOUNT_SID?.startsWith('AC');
  if (isDev && code === DEV_CODE) {
    otpStore.delete(phone);
    return { valid: true };
  }

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
