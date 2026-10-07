import { pool } from './src/db/pool';
import { closeTestClients, createTestAccounts, TestAccount } from './test-support/auth';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5001/api/v1';

async function verifyDoctorRegistrationLifecycle(): Promise<void> {
  let admin: TestAccount | undefined;
  let patient: TestAccount | undefined;
  let doctorIdentity: TestAccount | undefined;
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
      { role: null },
    ]);
    [admin, patient, doctorIdentity] = accounts;
    const adminAccount = accounts[0];
    const patientAccount = accounts[1];
    const doctorAuth = accounts[2];
    const specialization = await pool.query<{ name: string }>(
      'SELECT name FROM specializations ORDER BY name LIMIT 1'
    );
    if (!specialization.rows[0]) throw new Error('The specialization catalog must be seeded.');

    const registration = await fetch(`${API_BASE}/auth/register/doctor`, {
      method: 'POST',
      headers: { ...doctorAuth.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Integration',
        lastName: 'NewDoctor',
        phone: '+18005550198',
        specializationName: specialization.rows[0].name,
        licenseNumber: `TEST-${doctorAuth.authUser.id}`,
        experienceYears: 8,
        consultationFee: 120,
        qualification: 'MBBS, MD',
        idCardUrl: `${doctorAuth.authUser.id}/test-id-card.jpg`,
      }),
    });
    const registrationData: {
      user?: { id?: string };
      error?: string;
      message?: string;
    } = await registration.json() as {
      user?: { id?: string };
      error?: string;
      message?: string;
    };
    assert(registration.status === 201, `Doctor registration succeeds (got ${registration.status})`);
    if (!registrationData.user?.id) throw new Error(`Doctor registration did not return a user: ${JSON.stringify(registrationData)}`);

    const doctorRow = await pool.query<{ id: string; verification_status: string }>(
      'SELECT id, verification_status FROM doctors WHERE user_id = $1',
      [registrationData.user.id]
    );
    const doctorId = doctorRow.rows[0]?.id;
    assert(!!doctorId && doctorRow.rows[0].verification_status === 'pending',
      'New doctor profile is pending.');

    const pending = await fetch(`${API_BASE}/admin/doctors?status=pending`, { headers: adminAccount.headers });
    const pendingBody: any = await pending.json();
    assert(pending.status === 200 && pendingBody.doctors.some((item: { doctor_id: string }) => item.doctor_id === doctorId),
      'Isolated admin sees the newly registered doctor in the pending queue.');

    const patientBeforeApproval = await fetch(`${API_BASE}/doctor/list`, { headers: patientAccount.headers });
    const patientBeforeBody: any = await patientBeforeApproval.json();
    assert(patientBeforeApproval.status === 200
      && !patientBeforeBody.doctors.some((item: { doctor_id: string }) => item.doctor_id === doctorId),
    'Pending doctor is hidden from the patient directory.');

    const approve = await fetch(`${API_BASE}/admin/doctors/${doctorId}/approve`, {
      method: 'PATCH',
      headers: adminAccount.headers,
    });
    assert(approve.status === 200, `Admin approves the doctor (got ${approve.status})`);
    await pool.query('UPDATE doctors SET is_available = TRUE WHERE id = $1', [doctorId]);

    const patientAfterApproval = await fetch(`${API_BASE}/doctor/list`, { headers: patientAccount.headers });
    const patientAfterBody: any = await patientAfterApproval.json();
    assert(patientAfterApproval.status === 200
      && patientAfterBody.doctors.some((item: { doctor_id: string }) => item.doctor_id === doctorId),
    'Approved and available doctor appears in the patient directory.');
  } catch (error) {
    console.error('Doctor registration lifecycle error:', error);
    failed += 1;
  } finally {
    await doctorIdentity?.cleanup();
    await patient?.cleanup();
    await admin?.cleanup();
    await closeTestClients();
  }

  console.log(`\nDoctor registration lifecycle results: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

verifyDoctorRegistrationLifecycle().catch(async (error: unknown) => {
  console.error('Doctor registration lifecycle setup failed:', error);
  await closeTestClients();
  process.exitCode = 1;
});
