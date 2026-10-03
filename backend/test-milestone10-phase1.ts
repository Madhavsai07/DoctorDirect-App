import { pool } from './src/db/pool';
import { userRepository } from './src/repositories/user.repository';
import { doctorRepository } from './src/repositories/doctor.repository';

const API_BASE = 'http://localhost:5001/api/v1';

async function runTests() {
  console.log('=== Milestone 10 Phase 1 Verification Tests ===\n');
  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  PASS: ${msg}`);
      testsPassed++;
    } else {
      console.error(`  FAIL: ${msg}`);
      testsFailed++;
    }
  }

  try {
    // 0. Setup: Identify admin, patient, and doctor test users
    console.log('[Setup] Verifying test users in database...');
    const adminUser = await userRepository.findByEmail('madhavsaikiran2007@gmail.com');
    assert(!!adminUser, 'Admin user exists in database');
    assert(adminUser?.role === 'admin', `Admin user has role 'admin' (actual: ${adminUser?.role})`);

    // Find or pick a patient
    const patientRes = await pool.query<{ id: string; email: string; role: string }>(
      "SELECT id, email, role FROM users WHERE role = 'patient' LIMIT 1"
    );
    const patientUser = patientRes.rows[0];
    assert(!!patientUser, `Patient test user found (${patientUser?.email})`);

    // Find or pick an existing approved doctor
    const doctorRes = await pool.query<{ id: string; email: string; role: string; doctor_id: string }>(
      `SELECT u.id, u.email, u.role, d.id as doctor_id, d.verification_status 
       FROM users u 
       JOIN doctors d ON d.user_id = u.id 
       WHERE d.verification_status = 'approved' LIMIT 1`
    );
    const approvedDoctor = doctorRes.rows[0];
    assert(!!approvedDoctor, `Approved doctor test user found (${approvedDoctor?.email})`);

    const adminToken = `Bearer dev-token-${adminUser!.email}`;
    const patientToken = `Bearer dev-token-${patientUser!.email}`;
    const doctorToken = `Bearer dev-token-${approvedDoctor!.email}`;

    // 1. Authorization tests on /api/v1/admin endpoints
    console.log('\n[Test Suite 1: RBAC on Admin Endpoints]');
    
    // 1a. Unauthenticated request -> 401
    const unauthRes = await fetch(`${API_BASE}/admin/doctors`);
    assert(unauthRes.status === 401, `Unauthenticated request returns 401 (got ${unauthRes.status})`);

    // 1b. Patient request -> 403
    const patientReq = await fetch(`${API_BASE}/admin/doctors`, {
      headers: { Authorization: patientToken }
    });
    assert(patientReq.status === 403, `Patient request returns 403 Forbidden (got ${patientReq.status})`);

    // 1c. Doctor request -> 403
    const doctorReq = await fetch(`${API_BASE}/admin/doctors`, {
      headers: { Authorization: doctorToken }
    });
    assert(doctorReq.status === 403, `Doctor request returns 403 Forbidden (got ${doctorReq.status})`);

    // 1d. Admin request -> 200 OK
    const adminReq = await fetch(`${API_BASE}/admin/doctors`, {
      headers: { Authorization: adminToken }
    });
    assert(adminReq.status === 200, `Admin request returns 200 OK (got ${adminReq.status})`);
    const adminData: any = await adminReq.json();
    assert(Array.isArray(adminData.doctors), 'Admin response contains doctors array');

    // 2. Doctor verification workflow
    console.log('\n[Test Suite 2: Doctor Verification Lifecycle]');

    // Create a new doctor to test pending status
    const testDocEmail = `test.doc.${Date.now()}@example.com`;
    const specRes = await pool.query<{ name: string }>('SELECT name FROM specializations LIMIT 1');
    const specName = specRes.rows[0].name;

    const newDocUser = await userRepository.registerDoctor({
      authUserId: crypto.randomUUID(),
      email: testDocEmail,
      firstName: 'DrTest',
      lastName: 'PendingDoc',
      phone: `+1999${Math.floor(1000000 + Math.random() * 9000000)}`,
      specializationName: specName,
      licenseNumber: `LIC-${Date.now()}`,
      experienceYears: 5,
      consultationFee: 75.0,
      qualification: 'MBBS, MD',
      bio: 'Test doctor for verification flow',
    });

    const newDocRecord = await doctorRepository.findDoctorByUserId(newDocUser.id);
    assert(!!newDocRecord, 'New doctor profile created in database');
    assert(newDocRecord?.verification_status === 'pending', `New doctor defaults to 'pending' (actual: ${newDocRecord?.verification_status})`);
    assert(newDocRecord?.verified_at === null, 'verified_at is initially null');
    assert(newDocRecord?.verified_by === null, 'verified_by is initially null');

    const testDoctorId = newDocRecord!.doctor_id;

    // 2a. Admin GET /admin/doctors?status=pending includes new doctor
    const pendingRes = await fetch(`${API_BASE}/admin/doctors?status=pending`, {
      headers: { Authorization: adminToken }
    });
    const pendingData: any = await pendingRes.json();
    const foundPending = pendingData.doctors.some((d: any) => d.doctor_id === testDoctorId);
    assert(foundPending, 'Admin can list new doctor in pending list');

    // 2b. Admin GET /admin/doctors/:doctorId
    const detailRes = await fetch(`${API_BASE}/admin/doctors/${testDoctorId}`, {
      headers: { Authorization: adminToken }
    });
    assert(detailRes.status === 200, `Admin can fetch doctor details (got ${detailRes.status})`);
    const detailData: any = await detailRes.json();
    assert(detailData.doctor?.doctor_id === testDoctorId, 'Doctor detail returns correct doctor');

    // 2c. Patient protection: Pending doctor MUST NOT appear in /api/v1/doctor/list
    const patientListRes = await fetch(`${API_BASE}/doctor/list`, {
      headers: { Authorization: patientToken }
    });
    const patientListData: any = await patientListRes.json();
    const leakedInList = patientListData.doctors.some((d: any) => d.doctor_id === testDoctorId);
    assert(!leakedInList, 'Pending doctor is NOT visible in patient doctor directory');

    // 2d. Patient protection: Patient cannot view pending doctor profile
    const patientViewRes = await fetch(`${API_BASE}/doctor/${testDoctorId}/profile`, {
      headers: { Authorization: patientToken }
    });
    assert(patientViewRes.status === 404, `Patient profile view of pending doctor returns 404 (got ${patientViewRes.status})`);

    // 2e. Admin REJECTS the doctor
    const rejectRes = await fetch(`${API_BASE}/admin/doctors/${testDoctorId}/reject`, {
      method: 'PATCH',
      headers: { Authorization: adminToken }
    });
    assert(rejectRes.status === 200, `Admin can reject doctor (got ${rejectRes.status})`);
    const rejectedDoc = await doctorRepository.findDoctorById(testDoctorId);
    assert(rejectedDoc?.verification_status === 'rejected', `Doctor verification_status is 'rejected'`);
    assert(rejectedDoc?.verified_by === adminUser!.id, `Doctor verified_by is admin ID (${adminUser!.id})`);
    assert(!!rejectedDoc?.verified_at, 'Doctor verified_at is populated');

    // 2f. Admin APPROVES the doctor
    const approveRes = await fetch(`${API_BASE}/admin/doctors/${testDoctorId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: adminToken }
    });
    assert(approveRes.status === 200, `Admin can approve doctor (got ${approveRes.status})`);
    const approvedDoc = await doctorRepository.findDoctorById(testDoctorId);
    assert(approvedDoc?.verification_status === 'approved', `Doctor verification_status is 'approved'`);
    assert(approvedDoc?.verified_by === adminUser!.id, `Doctor verified_by is admin ID`);

    // 2g. Once approved and marked available, doctor appears in patient directory
    await pool.query('UPDATE doctors SET is_available = TRUE WHERE id = $1', [testDoctorId]);
    const patientListApprovedRes = await fetch(`${API_BASE}/doctor/list?search=${newDocUser.first_name}`, {
      headers: { Authorization: patientToken }
    });
    const patientListApprovedData: any = await patientListApprovedRes.json();
    const foundApproved = patientListApprovedData.doctors.some((d: any) => d.doctor_id === testDoctorId);
    assert(foundApproved, 'Approved available doctor is visible in patient doctor directory');

    // 3. Patient protection: Booking flow blocking
    console.log('\n[Test Suite 3: Booking Flow Guard]');
    
    // Create a temporary slot for an unapproved doctor
    // Set doctor back to 'pending'
    await pool.query("UPDATE doctors SET verification_status = 'pending' WHERE id = $1", [testDoctorId]);

    // Insert an available slot tomorrow for this doctor
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const slotInsert = await pool.query<{ id: string }>(
      `INSERT INTO slots (doctor_id, date, start_time, end_time, status)
       VALUES ($1, $2, '10:00:00', '10:30:00', 'available')
       RETURNING id`,
      [testDoctorId, dateStr]
    );
    const slotId = slotInsert.rows[0].id;

    // Try booking appointment with pending doctor
    const bookRes = await fetch(`${API_BASE}/appointments/book`, {
      method: 'POST',
      headers: {
        Authorization: patientToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        slotId,
        reasonForVisit: 'Testing verification guard'
      })
    });
    assert(bookRes.status === 403, `Booking with pending doctor is blocked with 403 Forbidden (got ${bookRes.status})`);
    const bookError: any = await bookRes.json();
    assert(
      bookError.error?.includes('not yet verified') || bookError.message?.includes('not yet verified'),
      `Error explains verification requirement (got: ${JSON.stringify(bookError)})`
    );

    // Now set doctor to approved and verify booking succeeds
    await pool.query("UPDATE doctors SET verification_status = 'approved' WHERE id = $1", [testDoctorId]);
    const bookApprovedRes = await fetch(`${API_BASE}/appointments/book`, {
      method: 'POST',
      headers: {
        Authorization: patientToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        slotId,
        reasonForVisit: 'Testing verification guard passed'
      })
    });
    assert(bookApprovedRes.status === 201, `Booking with approved doctor succeeds with 201 Created (got ${bookApprovedRes.status})`);

    // Cleanup test data
    console.log('\n[Cleanup] Cleaning up test records...');
    const apptRes = await pool.query<{ id: string }>('SELECT id FROM appointments WHERE slot_id = $1', [slotId]);
    if (apptRes.rows[0]) {
      await pool.query('DELETE FROM notifications WHERE appointment_id = $1', [apptRes.rows[0].id]);
    }
    await pool.query('DELETE FROM appointments WHERE slot_id = $1', [slotId]);
    await pool.query('DELETE FROM slots WHERE id = $1', [slotId]);
    await pool.query('DELETE FROM doctors WHERE id = $1', [testDoctorId]);
    await pool.query('DELETE FROM users WHERE id = $1', [newDocUser.id]);
    console.log('Cleanup completed.');

  } catch (err: any) {
    console.error('Test execution failed with error:', err);
    testsFailed++;
  } finally {
    await pool.end();
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log(`========================================\n`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests();
