import { pool } from './src/db/pool';
import { userRepository } from './src/repositories/user.repository';
import crypto from 'crypto';

const API_BASE = 'http://localhost:5001/api/v1';

async function runCompleteVerificationFlowTest() {
  console.log('=== Complete Doctor Registration & Verification Access Test ===\n');

  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, msg: string) {
    if (cond) {
      console.log(`  PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  FAIL: ${msg}`);
      failed++;
    }
  }

  const adminToken = 'Bearer dev-token-madhavsaikiran2007@gmail.com';

  try {
    // 1. Get a specialization name
    const specRes = await pool.query<{ name: string }>('SELECT name FROM specializations LIMIT 1');
    const specName = specRes.rows[0].name;

    // 2. Register a new doctor
    const testEmail = `dr.test.${Date.now()}@example.com`;
    console.log(`[Step 1] Registering test doctor: ${testEmail}...`);
    const docUser = await userRepository.registerDoctor({
      authUserId: crypto.randomUUID(),
      email: testEmail,
      firstName: 'Alan',
      lastName: 'Turing',
      phone: `+1999${Math.floor(1000000 + Math.random() * 9000000)}`,
      specializationName: specName,
      licenseNumber: `LIC-${Date.now()}`,
      experienceYears: 12,
      consultationFee: 150.0,
      qualification: 'MD, PhD',
      bio: 'Research and clinical specialist.',
    });

    const docDoctorRes = await pool.query<{ id: string; verification_status: string }>(
      'SELECT id, verification_status FROM doctors WHERE user_id = $1',
      [docUser.id]
    );
    const doctorId = docDoctorRes.rows[0].id;
    assert(docDoctorRes.rows[0].verification_status === 'pending', 'Doctor verification_status is pending upon registration');

    const doctorToken = `Bearer dev-token-${testEmail}`;

    // 3. Test /auth/me for pending doctor
    console.log('\n[Step 2] Testing /auth/me endpoint for pending doctor...');
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: doctorToken },
    });
    const meData: any = await meRes.json();
    assert(meRes.status === 200, `/auth/me responds 200 (got ${meRes.status})`);
    assert(meData.profile?.verification_status === 'pending', `Profile verification_status is 'pending' (got ${meData.profile?.verification_status})`);

    // 4. Test protected operational doctor routes for pending doctor (must return 403 DOCTOR_NOT_VERIFIED)
    console.log('\n[Step 3] Testing backend guard against pending doctor...');
    const availRes = await fetch(`${API_BASE}/doctor/me/availability`, {
      headers: { Authorization: doctorToken },
    });
    const availData: any = await availRes.json();
    assert(availRes.status === 403, `Availability route returns 403 for pending doctor (got ${availRes.status})`);
    assert(availData.code === 'DOCTOR_NOT_VERIFIED', `Response code is DOCTOR_NOT_VERIFIED (got ${availData.code})`);

    const apptRes = await fetch(`${API_BASE}/appointments/doctor`, {
      headers: { Authorization: doctorToken },
    });
    const apptData: any = await apptRes.json();
    assert(apptRes.status === 403, `Appointment route returns 403 for pending doctor (got ${apptRes.status})`);
    assert(apptData.code === 'DOCTOR_NOT_VERIFIED', `Response code is DOCTOR_NOT_VERIFIED (got ${apptData.code})`);

    // 5. Check Admin pending queue
    console.log('\n[Step 4] Checking Admin Pending Queue...');
    const adminPendingRes = await fetch(`${API_BASE}/admin/doctors?status=pending`, {
      headers: { Authorization: adminToken },
    });
    const adminPendingData: any = await adminPendingRes.json();
    const isDocPending = adminPendingData.doctors.some((d: any) => d.doctor_id === doctorId);
    assert(isDocPending, 'Pending doctor is visible in Admin pending list');

    // 6. Admin rejects doctor
    console.log('\n[Step 5] Admin rejects doctor...');
    const rejectRes = await fetch(`${API_BASE}/admin/doctors/${doctorId}/reject`, {
      method: 'PATCH',
      headers: { Authorization: adminToken },
    });
    assert(rejectRes.status === 200, `Admin reject endpoint returned 200 (got ${rejectRes.status})`);

    // 7. Verify rejected doctor still blocked
    console.log('\n[Step 6] Testing backend guard against rejected doctor...');
    const availRejectRes = await fetch(`${API_BASE}/doctor/me/availability`, {
      headers: { Authorization: doctorToken },
    });
    const availRejectData: any = await availRejectRes.json();
    assert(availRejectRes.status === 403, `Availability route returns 403 for rejected doctor (got ${availRejectRes.status})`);
    assert(availRejectData.code === 'DOCTOR_NOT_VERIFIED', `Response code is DOCTOR_NOT_VERIFIED (got ${availRejectData.code})`);

    // 8. Admin approves doctor
    console.log('\n[Step 7] Admin approves doctor...');
    const approveRes = await fetch(`${API_BASE}/admin/doctors/${doctorId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: adminToken },
    });
    assert(approveRes.status === 200, `Admin approve endpoint returned 200 (got ${approveRes.status})`);

    // 9. Approved doctor now accesses protected operational routes
    console.log('\n[Step 8] Testing approved doctor access...');
    const availApproveRes = await fetch(`${API_BASE}/doctor/me/availability`, {
      headers: { Authorization: doctorToken },
    });
    assert(availApproveRes.status === 200, `Availability route returns 200 for approved doctor (got ${availApproveRes.status})`);

    const apptApproveRes = await fetch(`${API_BASE}/appointments/doctor`, {
      headers: { Authorization: doctorToken },
    });
    assert(apptApproveRes.status === 200, `Appointment route returns 200 for approved doctor (got ${apptApproveRes.status})`);

    // 10. Clean up test record
    console.log('\n[Step 9] Cleaning up test records...');
    await pool.query('DELETE FROM notifications WHERE doctor_id = $1', [doctorId]);
    await pool.query('DELETE FROM doctors WHERE id = $1', [doctorId]);
    await pool.query('DELETE FROM users WHERE id = $1', [docUser.id]);
    console.log('Cleanup completed.');

  } catch (err) {
    console.error('Test execution failed:', err);
    failed++;
  } finally {
    await pool.end();
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runCompleteVerificationFlowTest();
