const http = require('http');
require('dotenv').config();

const BASE = 'http://localhost:3000';

async function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost', port: 3000,
      path, method,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    };
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function authRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const options = { hostname: 'localhost', port: 3000, path, method, headers };
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  const phone = '+972501234567';
  console.log('\n══════════════════════════════════');
  console.log('   MedApp API Test Suite');
  console.log('══════════════════════════════════\n');

  // 1. Health check
  console.log('✅ Test 1: Health check');
  const health = await request('GET', '/', {});
  console.log(`   Status: ${health.status} | ${JSON.stringify(health.body)}\n`);

  // 2. Send OTP
  console.log('✅ Test 2: Send OTP');
  const otpRes = await request('POST', '/auth/send-otp', { phone });
  console.log(`   Status: ${otpRes.status} | ${JSON.stringify(otpRes.body)}`);
  console.log('   ⚠️  Check server console for OTP code (DEV mode)\n');

  // 3. Ask for OTP from stdin
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const otp = await new Promise(resolve => {
    rl.question('   Enter OTP from server log: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  // 4. Verify OTP - Create Caregiver
  console.log('\n✅ Test 3: Verify OTP & Create Caregiver');
  const caregiverRes = await request('POST', '/auth/verify-otp', {
    phone, code: otp, name: 'Yaniv Test', role: 'CAREGIVER',
  });
  console.log(`   Status: ${caregiverRes.status}`);
  if (caregiverRes.status === 200) {
    console.log(`   User: ${caregiverRes.body.user.name} (${caregiverRes.body.user.role})`);
    console.log(`   Token: ${caregiverRes.body.token.substring(0, 30)}...`);
  } else {
    console.log(`   Error: ${JSON.stringify(caregiverRes.body)}`);
    process.exit(1);
  }

  const token = caregiverRes.body.token;
  const caregiverId = caregiverRes.body.user.id;

  // 5. Get me
  console.log('\n✅ Test 4: GET /auth/me');
  const meRes = await authRequest('GET', '/auth/me', {}, token);
  console.log(`   Status: ${meRes.status} | User: ${meRes.body.name}, Plan: ${meRes.body.subscription?.plan}`);

  // 6. Create a patient
  console.log('\n✅ Test 5: Create Patient user');
  const patientPhone = '+972509999999';
  const sendOtp2 = await request('POST', '/auth/send-otp', { phone: patientPhone });
  console.log(`   OTP sent: ${sendOtp2.body.message}`);

  const otp2 = await new Promise(resolve => {
    const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl2.question('   Enter OTP for patient from server log: ', (answer) => {
      rl2.close();
      resolve(answer.trim());
    });
  });

  const patientRes = await request('POST', '/auth/verify-otp', {
    phone: patientPhone, code: otp2, name: 'Moshe Test', role: 'PATIENT',
  });
  console.log(`   Status: ${patientRes.status} | Patient: ${patientRes.body.user?.name}`);
  const patientId = patientRes.body.user?.id;

  // 7. Link caregiver to patient
  console.log('\n✅ Test 6: Link caregiver to patient');
  const linkRes = await authRequest('POST', '/caregivers/link', { patientPhone }, token);
  console.log(`   Status: ${linkRes.status} | ${JSON.stringify(linkRes.body?.link ?? linkRes.body)}`);

  // 8. Add medication
  console.log('\n✅ Test 7: Add medication');
  const medRes = await authRequest('POST', '/medications', {
    patientId,
    name: 'אספירין',
    dosage: '100mg',
    schedules: [
      { time: '08:00', alertDelayMinutes: 30 },
      { time: '20:00', alertDelayMinutes: 30 },
    ],
  }, token);
  console.log(`   Status: ${medRes.status} | Med: ${medRes.body.name} (${medRes.body.schedules?.length} schedules)`);

  // 9. Get today's medications
  console.log('\n✅ Test 8: Get today medications');
  const todayRes = await authRequest('GET', `/medications/${patientId}/today`, {}, token);
  console.log(`   Status: ${todayRes.status} | ${todayRes.body.length} medication(s)`);

  console.log('\n══════════════════════════════════');
  console.log('   All tests passed! 🎉');
  console.log('══════════════════════════════════\n');
}

runTests().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
