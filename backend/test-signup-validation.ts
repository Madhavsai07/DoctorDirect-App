import { pool } from './src/db/pool';
import crypto from 'crypto';

const API_BASE = 'http://localhost:5001/api/v1';

async function runSignupValidationTests() {
  console.log('=== Running Signup Form Validation Tests (Patient & Doctor) ===\n');

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

  const createdUserIds: string[] = [];

  try {
    const specRes = await pool.query<{ name: string }>('SELECT name FROM specializations LIMIT 1');
    const validSpec = specRes.rows[0]?.name || 'Cardiology';

    // ── 1. Email Validation Tests ───────────────────────────────────────────
    console.log('[Test 1] Email Format Validations...');

    // Invalid email: "doctorsdf"
    const invalidEmailRes = await fetch(`${API_BASE}/auth/register/patient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer dev-token-doctorsdf',
      },
      body: JSON.stringify({
        firstName: 'Jane',
        lastName: 'Doe',
      }),
    });
    assert(invalidEmailRes.status === 422, `Invalid email 'doctorsdf' rejected with 422 (got ${invalidEmailRes.status})`);

    // Invalid email: "invalid@domain"
    const missingTldRes = await fetch(`${API_BASE}/auth/register/patient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer dev-token-invalid@domain',
      },
      body: JSON.stringify({
        firstName: 'Jane',
        lastName: 'Doe',
      }),
    });
    assert(missingTldRes.status === 422, `Invalid email 'invalid@domain' rejected with 422 (got ${missingTldRes.status})`);

    // ── 2. Name Validation Tests ────────────────────────────────────────────
    console.log('\n[Test 2] Name Format Validations...');

    // Invalid name with numbers
    const numNameEmail = `val.test.${Date.now()}@clinic.com`;
    const numNameRes = await fetch(`${API_BASE}/auth/register/patient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${numNameEmail}`,
      },
      body: JSON.stringify({
        firstName: 'Jane123',
        lastName: 'Doe',
      }),
    });
    assert(numNameRes.status === 422, `First name with numbers rejected with 422 (got ${numNameRes.status})`);

    // Invalid name with symbols
    const symNameRes = await fetch(`${API_BASE}/auth/register/patient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${numNameEmail}`,
      },
      body: JSON.stringify({
        firstName: 'Jane',
        lastName: 'Doe!@#',
      }),
    });
    assert(symNameRes.status === 422, `Last name with symbols rejected with 422 (got ${symNameRes.status})`);

    // ── 3. Phone Number Validation Tests ────────────────────────────────────
    console.log('\n[Test 3] Phone Number Validations...');

    // Phone with letters
    const letterPhoneRes = await fetch(`${API_BASE}/auth/register/patient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${numNameEmail}`,
      },
      body: JSON.stringify({
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '12345abcde',
      }),
    });
    assert(letterPhoneRes.status === 422, `Phone with letters rejected with 422 (got ${letterPhoneRes.status})`);

    // Phone too short
    const shortPhoneRes = await fetch(`${API_BASE}/auth/register/patient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${numNameEmail}`,
      },
      body: JSON.stringify({
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '123',
      }),
    });
    assert(shortPhoneRes.status === 422, `Short phone rejected with 422 (got ${shortPhoneRes.status})`);

    // ── 4. Date of Birth Validation Tests ───────────────────────────────────
    console.log('\n[Test 4] Date of Birth Validations...');

    // Future date of birth
    const futureDobRes = await fetch(`${API_BASE}/auth/register/patient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${numNameEmail}`,
      },
      body: JSON.stringify({
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: '2099-12-31',
      }),
    });
    assert(futureDobRes.status === 422, `Future date of birth rejected with 422 (got ${futureDobRes.status})`);

    // Invalid calendar date
    const invalidCalDobRes = await fetch(`${API_BASE}/auth/register/patient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${numNameEmail}`,
      },
      body: JSON.stringify({
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: '2023-02-31',
      }),
    });
    assert(invalidCalDobRes.status === 422, `Invalid calendar date '2023-02-31' rejected with 422 (got ${invalidCalDobRes.status})`);

    // Arbitrary text date
    const arbitraryDobRes = await fetch(`${API_BASE}/auth/register/patient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${numNameEmail}`,
      },
      body: JSON.stringify({
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: 'twenty-five-years-old',
      }),
    });
    assert(arbitraryDobRes.status === 422, `Arbitrary text date of birth rejected with 422 (got ${arbitraryDobRes.status})`);

    // ── 5. Doctor Numeric & License Field Validations ───────────────────────
    console.log('\n[Test 5] Doctor Fields (Experience, Fee, License) Validations...');

    const docTestEmail = `doc.val.${Date.now()}@clinic.com`;

    // Negative experience
    const negExpRes = await fetch(`${API_BASE}/auth/register/doctor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${docTestEmail}`,
      },
      body: JSON.stringify({
        firstName: 'Gregory',
        lastName: 'House',
        specializationName: validSpec,
        licenseNumber: 'MED-12345',
        experienceYears: -5,
        consultationFee: 100,
        qualification: 'MD',
      }),
    });
    assert(negExpRes.status === 422, `Negative experience years rejected with 422 (got ${negExpRes.status})`);

    // Non-numeric experience
    const strExpRes = await fetch(`${API_BASE}/auth/register/doctor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${docTestEmail}`,
      },
      body: JSON.stringify({
        firstName: 'Gregory',
        lastName: 'House',
        specializationName: validSpec,
        licenseNumber: 'MED-12345',
        experienceYears: 'five',
        consultationFee: 100,
        qualification: 'MD',
      }),
    });
    assert(strExpRes.status === 422, `Non-numeric experience years rejected with 422 (got ${strExpRes.status})`);

    // Negative consultation fee
    const negFeeRes = await fetch(`${API_BASE}/auth/register/doctor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${docTestEmail}`,
      },
      body: JSON.stringify({
        firstName: 'Gregory',
        lastName: 'House',
        specializationName: validSpec,
        licenseNumber: 'MED-12345',
        experienceYears: 10,
        consultationFee: -50,
        qualification: 'MD',
      }),
    });
    assert(negFeeRes.status === 422, `Negative consultation fee rejected with 422 (got ${negFeeRes.status})`);

    // Invalid license format
    const invalidLicRes = await fetch(`${API_BASE}/auth/register/doctor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${docTestEmail}`,
      },
      body: JSON.stringify({
        firstName: 'Gregory',
        lastName: 'House',
        specializationName: validSpec,
        licenseNumber: 'LIC!@#$%',
        experienceYears: 10,
        consultationFee: 100,
        qualification: 'MD',
      }),
    });
    assert(invalidLicRes.status === 422, `Invalid license format rejected with 422 (got ${invalidLicRes.status})`);

    // ── 6. Successful Patient Registration with Valid Data ───────────────────
    console.log('\n[Test 6] Successful Patient Registration with Validated Fields...');

    const validPatientEmail = `patient.valid.${Date.now()}@health.org`;
    const validPatientRes = await fetch(`${API_BASE}/auth/register/patient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${validPatientEmail}`,
      },
      body: JSON.stringify({
        firstName: 'Sarah',
        lastName: 'Connor',
        phone: '+14155552671',
        dateOfBirth: '1985-04-12',
        emergencyContactName: 'John Connor',
        emergencyContactPhone: '+14155559999',
      }),
    });
    const validPatientData: any = await validPatientRes.json();
    assert(validPatientRes.status === 201, `Valid patient registration responds 201 (got ${validPatientRes.status})`);
    assert(validPatientData.user?.first_name === 'Sarah', 'Patient first name saved correctly');
    if (validPatientData.user?.id) createdUserIds.push(validPatientData.user.id);

    // ── 7. Successful Doctor Registration with Valid Data ────────────────────
    console.log('\n[Test 7] Successful Doctor Registration with Validated Fields...');

    const validDoctorEmail = `doctor.valid.${Date.now()}@medical.org`;
    const validDoctorRes = await fetch(`${API_BASE}/auth/register/doctor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${validDoctorEmail}`,
      },
      body: JSON.stringify({
        firstName: 'Leonard',
        lastName: 'McCoy',
        phone: '+18005550199',
        specializationName: validSpec,
        licenseNumber: `MED-${Date.now()}`,
        experienceYears: 15,
        consultationFee: 125.5,
        qualification: 'MD, FACP',
        bio: 'Senior consultant physician in active practice.',
      }),
    });
    const validDoctorData: any = await validDoctorRes.json();
    assert(validDoctorRes.status === 201, `Valid doctor registration responds 201 (got ${validDoctorRes.status})`);
    assert(validDoctorData.user?.first_name === 'Leonard', 'Doctor first name saved correctly');
    if (validDoctorData.user?.id) createdUserIds.push(validDoctorData.user.id);

    // Verify doctor is pending
    const docRow = await pool.query<{ id: string; verification_status: string }>(
      'SELECT id, verification_status FROM doctors WHERE user_id = $1',
      [validDoctorData.user?.id]
    );
    assert(docRow.rows[0]?.verification_status === 'pending', "Newly registered doctor defaults to 'pending'");

    // ── 8. Cleanup ──────────────────────────────────────────────────────────
    console.log('\n[Cleanup] Cleaning up created test records...');
    for (const uid of createdUserIds) {
      const doc = await pool.query<{ id: string }>('SELECT id FROM doctors WHERE user_id = $1', [uid]);
      if (doc.rows[0]) {
        await pool.query('DELETE FROM notifications WHERE doctor_id = $1', [doc.rows[0].id]);
        await pool.query('DELETE FROM doctors WHERE id = $1', [doc.rows[0].id]);
      }
      await pool.query('DELETE FROM patients WHERE user_id = $1', [uid]);
      await pool.query('DELETE FROM users WHERE id = $1', [uid]);
    }
    console.log('Cleanup finished.');

  } catch (err) {
    console.error('Validation test error:', err);
    failed++;
  } finally {
    await pool.end();
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runSignupValidationTests();
