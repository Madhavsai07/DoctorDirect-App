import { pool } from './src/db/pool';
import { userRepository } from './src/repositories/user.repository';
import crypto from 'crypto';

const API_BASE = 'http://localhost:5001/api/v1';

async function verifyEmptyAndLifecycle() {
  console.log('=== Verifying Empty DB State & Dynamic Doctor Registration Lifecycle ===\n');

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
  const patientToken = 'Bearer dev-token-dev.patient@doctordirect.com';

  try {
    // 1. Verify Empty State
    console.log('[Step 1] Verifying that no mock doctors exist in Admin API...');
    const emptyAdminRes = await fetch(`${API_BASE}/admin/doctors`, {
      headers: { Authorization: adminToken },
    });
    const emptyAdminData: any = await emptyAdminRes.json();
    assert(emptyAdminRes.status === 200, `Admin endpoint responds 200 (got ${emptyAdminRes.status})`);
    assert(emptyAdminData.doctors.length === 0, `Admin doctors list is empty (got ${emptyAdminData.doctors.length})`);
    assert(emptyAdminData.count === 0, `Admin count is 0 (got ${emptyAdminData.count})`);

    const emptyPatientListRes = await fetch(`${API_BASE}/doctor/list`, {
      headers: { Authorization: patientToken },
    });
    const emptyPatientListData: any = await emptyPatientListRes.json();
    assert(emptyPatientListData.doctors.length === 0, `Patient doctor directory is empty (got ${emptyPatientListData.doctors.length})`);

    // 2. Register a new real doctor
    console.log('\n[Step 2] Registering a new doctor...');
    const specRes = await pool.query<{ name: string }>('SELECT name FROM specializations LIMIT 1');
    const specName = specRes.rows[0].name;

    const testEmail = `new.doctor.${Date.now()}@clinic.com`;
    const newDocUser = await userRepository.registerDoctor({
      authUserId: crypto.randomUUID(),
      email: testEmail,
      firstName: 'Samantha',
      lastName: 'Ray',
      phone: `+1800${Math.floor(1000000 + Math.random() * 9000000)}`,
      specializationName: specName,
      licenseNumber: `MED-LIC-${Date.now()}`,
      experienceYears: 8,
      consultationFee: 120.0,
      qualification: 'MBBS, MS',
      bio: 'Board-certified specialist in clinical practice.',
    });

    const docProfileRes = await pool.query<{ id: string; verification_status: string }>(
      'SELECT id, verification_status FROM doctors WHERE user_id = $1',
      [newDocUser.id]
    );
    const doctorRecord = docProfileRes.rows[0];
    assert(!!doctorRecord, 'Doctor profile record created in PostgreSQL');
    assert(
      doctorRecord.verification_status === 'pending',
      `New doctor defaults to 'pending' (actual: ${doctorRecord.verification_status})`
    );

    const docId = doctorRecord.id;

    // 3. Check Admin Pending Queue
    console.log('\n[Step 3] Checking Admin Pending Queue...');
    const pendingRes = await fetch(`${API_BASE}/admin/doctors?status=pending`, {
      headers: { Authorization: adminToken },
    });
    const pendingData: any = await pendingRes.json();
    const foundInPending = pendingData.doctors.some((d: any) => d.doctor_id === docId);
    assert(foundInPending, 'Newly registered doctor appears in Admin pending list');

    // 4. Check Patient Directory Guard (Must NOT appear)
    console.log('\n[Step 4] Verifying Patient Directory Protection...');
    const patientCheckRes = await fetch(`${API_BASE}/doctor/list`, {
      headers: { Authorization: patientToken },
    });
    const patientCheckData: any = await patientCheckRes.json();
    const foundInPatientDir = patientCheckData.doctors.some((d: any) => d.doctor_id === docId);
    assert(!foundInPatientDir, 'Pending doctor is NOT visible in Patient Directory');

    // 5. Admin Approves Doctor
    console.log('\n[Step 5] Admin Approves Doctor...');
    const approveRes = await fetch(`${API_BASE}/admin/doctors/${docId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: adminToken },
    });
    assert(approveRes.status === 200, `Admin approves doctor successfully (got ${approveRes.status})`);

    // 6. Set doctor availability to true
    await pool.query('UPDATE doctors SET is_available = TRUE WHERE id = $1', [docId]);

    // 7. Verify Patient Directory now includes approved doctor
    console.log('\n[Step 6] Verifying Patient Directory after approval...');
    const patientApprovedRes = await fetch(`${API_BASE}/doctor/list`, {
      headers: { Authorization: patientToken },
    });
    const patientApprovedData: any = await patientApprovedRes.json();
    const foundApproved = patientApprovedData.doctors.some((d: any) => d.doctor_id === docId);
    assert(foundApproved, 'Approved and available doctor NOW appears in Patient Directory');

    // 8. Cleanup test record
    console.log('\n[Step 7] Cleaning up lifecycle test record...');
    await pool.query('DELETE FROM doctors WHERE id = $1', [docId]);
    await pool.query('DELETE FROM users WHERE id = $1', [newDocUser.id]);
    console.log('Cleanup finished.');

  } catch (err) {
    console.error('Lifecycle test error:', err);
    failed++;
  } finally {
    await pool.end();
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

verifyEmptyAndLifecycle();
