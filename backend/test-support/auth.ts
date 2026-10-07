import { randomUUID } from 'node:crypto';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import config from '../src/config/env';
import { pool } from '../src/db/pool';
import { userRepository } from '../src/repositories/user.repository';

const testPassword = `Dd-${randomUUID()}-Aa9!`;
let testClientsClosed = false;

export interface TestAccount {
  authUser: User;
  email: string;
  password: string;
  accessToken: string;
  headers: Record<string, string>;
  applicationUserId?: string;
  patientId?: string;
  doctorId?: string;
  cleanup: () => Promise<void>;
}

function getSupabaseConfig(): { url: string; publishableKey: string; serviceRoleKey: string } {
  const url = config.supabaseUrl;
  const publishableKey = config.supabasePublishableKey;
  const serviceRoleKey = config.supabaseServiceRoleKey;
  if (!url || !publishableKey || !serviceRoleKey) {
    throw new Error('Integration tests require SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return { url, publishableKey, serviceRoleKey };
}

function testClients(): { publicClient: SupabaseClient; adminClient: SupabaseClient } {
  const { url, publishableKey, serviceRoleKey } = getSupabaseConfig();
  return {
    publicClient: createClient(url, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
    adminClient: createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
  };
}

export async function createTestAccount(
  role: 'patient' | 'doctor' | 'admin' | null,
  options: { verificationStatus?: 'pending' | 'approved' | 'rejected'; available?: boolean } = {}
): Promise<TestAccount> {
  const { publicClient, adminClient } = testClients();
  const id = randomUUID();
  const email = `doctordirect-test-${id}@example.invalid`;
  const password = testPassword;
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    throw createError ?? new Error('Supabase did not return the test identity.');
  }

  let applicationUserId: string | undefined;
  let patientId: string | undefined;
  let doctorId: string | undefined;
  const cleanup = async (): Promise<void> => {
    const cleanupErrors: unknown[] = [];
    try {
      if (applicationUserId) {
        await pool.query('DELETE FROM users WHERE id = $1', [applicationUserId]);
      } else {
        await pool.query('DELETE FROM users WHERE auth_user_id = $1', [created.user.id]);
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      const { error } = await adminClient.auth.admin.deleteUser(created.user.id);
      if (error && error.code !== 'user_not_found') cleanupErrors.push(error);
    } catch (error) {
      cleanupErrors.push(error);
    }
    if (cleanupErrors.length > 0) {
      throw new AggregateError(cleanupErrors, `Could not completely clean up test account ${email}.`);
    }
  };

  try {
    const { data: sessionData, error: signInError } = await publicClient.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError || !sessionData.session) {
      throw signInError ?? new Error('Supabase did not issue a test access token.');
    }

    if (role === 'patient') {
      const user = await userRepository.registerPatient({
        authUserId: created.user.id,
        email,
        firstName: 'Integration',
        lastName: 'Patient',
        phone: null,
        dateOfBirth: null,
        gender: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
      });
      applicationUserId = user.id;
      const patient = await pool.query<{ id: string }>(
        'SELECT id FROM patients WHERE user_id = $1',
        [user.id]
      );
      patientId = patient.rows[0]?.id;
    } else if (role === 'doctor') {
      const specialization = await pool.query<{ name: string }>(
        'SELECT name FROM specializations ORDER BY name LIMIT 1'
      );
      if (!specialization.rows[0]) throw new Error('The specialization catalog must be seeded for integration tests.');
      const user = await userRepository.registerDoctor({
        authUserId: created.user.id,
        email,
        firstName: 'Integration',
        lastName: 'Doctor',
        phone: null,
        specializationName: specialization.rows[0].name,
        licenseNumber: `TEST-${id}`,
        experienceYears: 5,
        consultationFee: 100,
        qualification: 'MD',
        bio: null,
        idCardUrl: `${created.user.id}/test-id-card.jpg`,
      });
      applicationUserId = user.id;
      const doctor = await pool.query<{ id: string }>(
        `UPDATE doctors
         SET verification_status = $2, is_available = $3
         WHERE user_id = $1
         RETURNING id`,
        [user.id, options.verificationStatus ?? 'approved', options.available ?? true]
      );
      doctorId = doctor.rows[0]?.id;
    } else if (role === 'admin') {
      const user = await pool.query<{ id: string }>(
        `INSERT INTO users (auth_user_id, email, role, first_name, last_name)
         VALUES ($1, $2, 'admin', 'Integration', 'Admin')
         RETURNING id`,
        [created.user.id, email]
      );
      applicationUserId = user.rows[0].id;
    }

    return {
      authUser: created.user,
      email,
      password,
      accessToken: sessionData.session.access_token,
      headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      applicationUserId,
      patientId,
      doctorId,
      cleanup,
    };
  } catch (error) {
    try {
      await cleanup();
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        `Test account setup failed and account cleanup was incomplete for ${email}.`
      );
    }
    throw error;
  }
}

export async function createTestIdentity(): Promise<TestAccount> {
  return createTestAccount(null);
}

export async function createTestAccounts(
  specs: Array<{
    role: 'patient' | 'doctor' | 'admin' | null;
    options?: { verificationStatus?: 'pending' | 'approved' | 'rejected'; available?: boolean };
  }>
): Promise<TestAccount[]> {
  const accounts: TestAccount[] = [];
  try {
    for (const spec of specs) {
      accounts.push(await createTestAccount(spec.role, spec.options));
    }
    return accounts;
  } catch (error) {
    const cleanupErrors: unknown[] = [];
    for (const account of accounts.reverse()) {
      try {
        await account.cleanup();
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
    }
    if (cleanupErrors.length > 0) {
      throw new AggregateError(
        [error, ...cleanupErrors],
        'Test account setup failed and one or more created accounts could not be cleaned up.'
      );
    }
    throw error;
  }
}

export async function closeTestClients(): Promise<void> {
  if (testClientsClosed) return;
  testClientsClosed = true;
  await pool.end();
}
