import { pool } from './src/db/pool';
import { closeTestClients, createTestAccounts, TestAccount } from './test-support/auth';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5001/api/v1';

async function runCompleteVerificationFlowTest(): Promise<void> {
  let admin: TestAccount | undefined;
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
      { role: 'doctor', options: { verificationStatus: 'pending' } },
    ]);
    [admin, doctor] = accounts;
    const adminAccount = accounts[0];
    const doctorAccount = accounts[1];
    const me = await fetch(`${API_BASE}/auth/me`, { headers: doctorAccount.headers });
    const meData: any = await me.json();
    assert(me.status === 200, `Pending doctor /auth/me returns 200 (got ${me.status})`);
    assert(meData.profile?.verification_status === 'pending', 'Profile reports pending verification.');

    for (const endpoint of ['/doctor/me/availability', '/appointments/doctor']) {
      const response = await fetch(`${API_BASE}${endpoint}`, { headers: doctorAccount.headers });
      const body: any = await response.json();
      assert(response.status === 403, `${endpoint} blocks pending doctor (got ${response.status})`);
      assert(body.code === 'DOCTOR_NOT_VERIFIED', `${endpoint} reports DOCTOR_NOT_VERIFIED.`);
    }

    const pending = await fetch(`${API_BASE}/admin/doctors?status=pending`, { headers: adminAccount.headers });
    const pendingData: any = await pending.json();
    assert(pending.status === 200, `Admin pending list returns 200 (got ${pending.status})`);
    assert(pendingData.doctors.some((item: { doctor_id: string }) => item.doctor_id === doctorAccount.doctorId),
      'Pending doctor is visible in the isolated admin queue.');

    const reject = await fetch(`${API_BASE}/admin/doctors/${doctorAccount.doctorId}/reject`, {
      method: 'PATCH',
      headers: adminAccount.headers,
    });
    assert(reject.status === 200, `Admin rejects doctor (got ${reject.status})`);

    const rejectedAvailability = await fetch(`${API_BASE}/doctor/me/availability`, { headers: doctorAccount.headers });
    const rejectedBody: any = await rejectedAvailability.json();
    assert(rejectedAvailability.status === 403 && rejectedBody.code === 'DOCTOR_NOT_VERIFIED',
      'Rejected doctor remains blocked from availability.');

    const approve = await fetch(`${API_BASE}/admin/doctors/${doctorAccount.doctorId}/approve`, {
      method: 'PATCH',
      headers: adminAccount.headers,
    });
    assert(approve.status === 200, `Admin approves doctor (got ${approve.status})`);

    for (const endpoint of ['/doctor/me/availability', '/appointments/doctor']) {
      const response = await fetch(`${API_BASE}${endpoint}`, { headers: doctorAccount.headers });
      assert(response.status === 200, `Approved doctor can access ${endpoint} (got ${response.status})`);
    }
  } catch (error) {
    console.error('Doctor verification flow error:', error);
    failed += 1;
  } finally {
    await doctor?.cleanup();
    await admin?.cleanup();
    await closeTestClients();
  }

  console.log(`\nDoctor verification integration results: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

runCompleteVerificationFlowTest().catch(async (error: unknown) => {
  console.error('Doctor verification setup failed:', error);
  await closeTestClients();
  process.exitCode = 1;
});
