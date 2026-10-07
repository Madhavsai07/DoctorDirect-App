import { randomUUID } from 'node:crypto';
import { pool } from './src/db/pool';
import { closeTestClients, createTestAccounts, TestAccount } from './test-support/auth';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5001/api/v1';

async function runSignupValidationTests(): Promise<void> {
  let patientIdentity: TestAccount | undefined;
  let doctorIdentity: TestAccount | undefined;
  let duplicateIdentity: TestAccount | undefined;
  const conflictUserIds: string[] = [];
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
  const post = (path: string, headers: Record<string, string>, body: Record<string, unknown>) =>
    fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  try {
    const identities = await createTestAccounts([
      { role: null },
      { role: null },
      { role: null },
    ]);
    [patientIdentity, doctorIdentity, duplicateIdentity] = identities;
    const patientAuth = identities[0];
    const doctorAuth = identities[1];
    const duplicateAuth = identities[2];
    const specRes = await pool.query<{ name: string }>(
      'SELECT name FROM specializations ORDER BY name LIMIT 1'
    );
    if (!specRes.rows[0]) throw new Error('The specialization catalog must be seeded.');
    const specialization = specRes.rows[0].name;

    for (const [description, body] of [
      ['missing required name', { lastName: 'Valid' }],
      ['name containing digits', { firstName: 'Jane123', lastName: 'Doe' }],
      ['name containing unsupported punctuation', { firstName: 'Jane', lastName: 'Doe!' }],
      ['phone containing letters', { firstName: 'Jane', lastName: 'Doe', phone: '12345abcde' }],
      ['phone shorter than minimum length', { firstName: 'Jane', lastName: 'Doe', phone: '123' }],
      ['future date of birth', { firstName: 'Jane', lastName: 'Doe', dateOfBirth: '2099-12-31' }],
      ['invalid calendar date', { firstName: 'Jane', lastName: 'Doe', dateOfBirth: '2023-02-31' }],
      ['malformed date of birth', { firstName: 'Jane', lastName: 'Doe', dateOfBirth: 'not-a-date' }],
    ] as const) {
      const response = await post('/auth/register/patient', patientAuth.headers, body);
      const responseBody: any = await response.json();
      assert(response.status === 422, `${description} is rejected with 422 (got ${response.status})`);
      assert(typeof responseBody.error === 'string', `${description} returns a readable validation message.`);
    }

    const invalidDoctorBodies: Array<[string, Record<string, unknown>]> = [
      ['negative experience', { experienceYears: -1, consultationFee: 100, licenseNumber: 'MED-123' }],
      ['non-numeric experience', { experienceYears: 'five', consultationFee: 100, licenseNumber: 'MED-123' }],
      ['experience above maximum', { experienceYears: 71, consultationFee: 100, licenseNumber: 'MED-123' }],
      ['negative consultation fee', { experienceYears: 10, consultationFee: -50, licenseNumber: 'MED-123' }],
      ['non-numeric consultation fee', { experienceYears: 10, consultationFee: 'expensive', licenseNumber: 'MED-123' }],
      ['invalid license format', { experienceYears: 10, consultationFee: 100, licenseNumber: 'LIC!@#' }],
    ];
    for (const [description, fields] of invalidDoctorBodies) {
      const response = await post('/auth/register/doctor', doctorAuth.headers, {
        firstName: 'Gregory',
        lastName: 'House',
        specializationName: specialization,
        qualification: 'MD',
        idCardUrl: `${doctorAuth.authUser.id}/test-id-card.jpg`,
        ...fields,
      });
      assert(response.status === 422, `${description} is rejected with 422 (got ${response.status})`);
    }
    const noIdCard = await post('/auth/register/doctor', doctorAuth.headers, {
      firstName: 'Gregory',
      lastName: 'House',
      specializationName: specialization,
      licenseNumber: 'MED-12345',
      experienceYears: 10,
      consultationFee: 100,
      qualification: 'MD',
    });
    assert(noIdCard.status === 422, `Doctor registration without an ID-card path is rejected (got ${noIdCard.status})`);

    const conflictUser = await pool.query<{ id: string }>(
      `INSERT INTO users (auth_user_id, email, role, first_name, last_name)
       VALUES ($1, $2, 'patient', 'Existing', 'Account') RETURNING id`,
      [randomUUID(), duplicateAuth.email]
    );
    conflictUserIds.push(conflictUser.rows[0].id);
    const duplicate = await post('/auth/register/patient', duplicateAuth.headers, {
      firstName: 'Duplicate',
      lastName: 'Account',
    });
    const duplicateBody: any = await duplicate.json();
    assert(duplicate.status === 409, `Duplicate email is rejected with 409 (got ${duplicate.status})`);
    assert(duplicateBody.error === 'An account with this email already exists. Please sign in instead.',
      'Duplicate email returns the clear sign-in guidance without database details.');

    const patientRegistration = await post('/auth/register/patient', patientAuth.headers, {
      firstName: 'Sarah',
      lastName: 'Connor',
      phone: '+14155552671',
      dateOfBirth: '1985-04-12',
      emergencyContactName: 'John Connor',
      emergencyContactPhone: '+14155559999',
    });
    const patientBody: any = await patientRegistration.json();
    assert(patientRegistration.status === 201, `Valid patient registration succeeds (got ${patientRegistration.status})`);
    assert(patientBody.user?.first_name === 'Sarah', 'Patient registration persists the supplied name.');

    const doctorRegistration = await post('/auth/register/doctor', doctorAuth.headers, {
      firstName: 'Leonard',
      lastName: 'McCoy',
      phone: '+18005550199',
      specializationName: specialization,
      licenseNumber: `MED-${doctorAuth.authUser.id}`,
      experienceYears: 15,
      consultationFee: 125.5,
      qualification: 'MD, FACP',
      bio: 'Integration test physician.',
      idCardUrl: `${doctorAuth.authUser.id}/test-id-card.jpg`,
    });
    const doctorBody: any = await doctorRegistration.json();
    assert(doctorRegistration.status === 201, `Valid doctor registration succeeds (got ${doctorRegistration.status})`);
    assert(doctorBody.user?.first_name === 'Leonard', 'Doctor registration persists the supplied name.');
    const doctorStatus = await pool.query<{ verification_status: string }>(
      'SELECT verification_status FROM doctors WHERE user_id = $1',
      [doctorBody.user.id]
    );
    assert(doctorStatus.rows[0]?.verification_status === 'pending', 'New doctor registration requires admin approval.');

    console.log(`\nSignup validation results: ${passed} passed, ${failed} failed.`);
  } finally {
    for (const userId of conflictUserIds) await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await doctorIdentity?.cleanup();
    await patientIdentity?.cleanup();
    await duplicateIdentity?.cleanup();
    await closeTestClients();
  }
  if (failed > 0) process.exitCode = 1;
}

runSignupValidationTests().catch(async (error: unknown) => {
  console.error('Signup validation setup failed:', error);
  await closeTestClients();
  process.exitCode = 1;
});
