import { pool } from './src/db/pool';
import { closeTestClients, createTestAccounts, TestAccount } from './test-support/auth';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5001/api/v1';

async function runMilestone10Regression(): Promise<void> {
  let admin: TestAccount | undefined;
  let patient: TestAccount | undefined;
  let doctor: TestAccount | undefined;
  let passed = 0;
  let failed = 0;
  const assert = (condition: boolean, message: string): void => {
    if (condition) {
      console.log(`  PASS: ${message}`);
      passed += 1;
    } else {
      console.error(`  FAIL: ${message}`);
      failed += 1;
    }
  };

  try {
    const accounts = await createTestAccounts([
      { role: 'admin' },
      { role: 'patient' },
      { role: 'doctor', options: { verificationStatus: 'pending' } },
    ]);
    [admin, patient, doctor] = accounts;
    const adminAccount = accounts[0];
    const patientAccount = accounts[1];
    const doctorAccount = accounts[2];
    const unauthenticated = await fetch(`${API_BASE}/admin/doctors`);
    assert(unauthenticated.status === 401, `Unauthenticated admin request is rejected (got ${unauthenticated.status})`);

    const patientAdmin = await fetch(`${API_BASE}/admin/doctors`, { headers: patientAccount.headers });
    assert(patientAdmin.status === 403, `Patient cannot access admin endpoints (got ${patientAdmin.status})`);
    const doctorAdmin = await fetch(`${API_BASE}/admin/doctors`, { headers: doctorAccount.headers });
    assert(doctorAdmin.status === 403, `Doctor cannot access admin endpoints (got ${doctorAdmin.status})`);
    const adminList = await fetch(`${API_BASE}/admin/doctors`, { headers: adminAccount.headers });
    const adminListBody: any = await adminList.json();
    assert(adminList.status === 200 && Array.isArray(adminListBody.doctors),
      'Admin can list doctors with an isolated Supabase admin session.');

    const doctorRow = await pool.query<{ verification_status: string; verified_by: string | null }>(
      'SELECT verification_status, verified_by FROM doctors WHERE id = $1',
      [doctorAccount.doctorId]
    );
    assert(doctorRow.rows[0]?.verification_status === 'pending'
      && doctorRow.rows[0]?.verified_by === null,
    'New doctor starts pending without a verifier.');

    const reject = await fetch(`${API_BASE}/admin/doctors/${doctorAccount.doctorId}/reject`, {
      method: 'PATCH',
      headers: adminAccount.headers,
    });
    assert(reject.status === 200, `Admin can reject a doctor (got ${reject.status})`);
    const rejected = await pool.query<{ verification_status: string; verified_by: string | null; verified_at: Date | null }>(
      'SELECT verification_status, verified_by, verified_at FROM doctors WHERE id = $1',
      [doctorAccount.doctorId]
    );
    assert(rejected.rows[0]?.verification_status === 'rejected'
      && rejected.rows[0]?.verified_by === adminAccount.applicationUserId
      && !!rejected.rows[0]?.verified_at,
    'Rejection stores status, admin actor, and verification timestamp.');

    const patientDirectory = await fetch(`${API_BASE}/doctor/list`, { headers: patientAccount.headers });
    const directoryBody: any = await patientDirectory.json();
    assert(patientDirectory.status === 200
      && !directoryBody.doctors.some((item: { doctor_id: string }) => item.doctor_id === doctorAccount.doctorId),
    'Rejected doctor is not exposed in the patient directory.');

    const approved = await fetch(`${API_BASE}/admin/doctors/${doctorAccount.doctorId}/approve`, {
      method: 'PATCH',
      headers: adminAccount.headers,
    });
    assert(approved.status === 200, `Admin can approve a doctor (got ${approved.status})`);

    const tomorrow = await pool.query<{ date: string }>(
      'SELECT (CURRENT_DATE + 1)::text AS date'
    );
    await pool.query(
      `INSERT INTO availability (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
       VALUES ($1, EXTRACT(DOW FROM $2::date)::smallint, '10:00:00', '10:30:00', 30, TRUE)`,
      [doctorAccount.doctorId, tomorrow.rows[0].date]
    );
    const slot = await pool.query<{ id: string }>(
      `INSERT INTO slots (doctor_id, date, start_time, end_time, status)
       VALUES ($1, $2, '10:00:00', '10:30:00', 'available') RETURNING id`,
      [doctorAccount.doctorId, tomorrow.rows[0].date]
    );

    await pool.query("UPDATE doctors SET verification_status = 'pending' WHERE id = $1", [doctorAccount.doctorId]);
    const blockedBooking = await fetch(`${API_BASE}/appointments/book`, {
      method: 'POST',
      headers: { ...patientAccount.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot_id: slot.rows[0].id, reason_for_visit: 'Verification guard regression' }),
    });
    const blockedBody: any = await blockedBooking.json();
    assert(blockedBooking.status === 403, `Booking with unapproved doctor is blocked (got ${blockedBooking.status})`);
    assert(String(blockedBody.error).toLowerCase().includes('not yet verified'),
      'Booking failure explains that doctor verification is required.');

    await pool.query("UPDATE doctors SET verification_status = 'approved' WHERE id = $1", [doctorAccount.doctorId]);
    const allowedBooking = await fetch(`${API_BASE}/appointments/book`, {
      method: 'POST',
      headers: { ...patientAccount.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot_id: slot.rows[0].id, reason_for_visit: 'Approved doctor booking regression' }),
    });
    assert(allowedBooking.status === 201, `Booking with approved doctor succeeds (got ${allowedBooking.status})`);
  } catch (error) {
    console.error('Milestone 10 regression error:', error);
    failed += 1;
  } finally {
    await doctor?.cleanup();
    await patient?.cleanup();
    await admin?.cleanup();
    await closeTestClients();
  }

  console.log(`\nMilestone 10 regression results: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

runMilestone10Regression().catch(async (error: unknown) => {
  console.error('Milestone 10 regression setup failed:', error);
  await closeTestClients();
  process.exitCode = 1;
});
