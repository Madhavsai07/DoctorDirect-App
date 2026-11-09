import assert from 'node:assert/strict';
import { resolveApplicationUser, ApplicationUserLookup } from './src/services/application-user.service';
import { DbUser } from './src/repositories/user.repository';

const existingUser: DbUser = {
  id: 'existing-user-id',
  auth_user_id: null,
  email: 'legacy@example.invalid',
  phone: null,
  role: 'admin',
  first_name: 'Legacy',
  last_name: 'Admin',
  avatar_url: null,
  is_active: true,
  created_at: new Date(0),
  updated_at: new Date(0),
};

function testRepository(unlinkedUser: DbUser | null) {
  let linkAttempts = 0;
  const repository: ApplicationUserLookup = {
    async findByAuthUserId() {
      return null;
    },
    async findUnlinkedByEmail() {
      return unlinkedUser;
    },
    async linkAuthUserByVerifiedEmail() {
      linkAttempts += 1;
      return existingUser;
    },
  };
  return { repository, getLinkAttempts: () => linkAttempts };
}

async function run(): Promise<void> {
  const verified = testRepository(existingUser);
  const linkedUser = await resolveApplicationUser(
    { id: 'verified-identity', email: existingUser.email, email_confirmed_at: '2026-01-01T00:00:00.000Z' },
    verified.repository
  );
  assert.equal(linkedUser, existingUser);
  assert.equal(verified.getLinkAttempts(), 1);
  console.log('PASS: verified email can link an existing application account.');

  const unverified = testRepository(existingUser);
  await assert.rejects(
    resolveApplicationUser(
      { id: 'unverified-identity', email: existingUser.email, email_confirmed_at: null },
      unverified.repository
    ),
    (error: unknown) =>
      error instanceof Error &&
      'code' in error &&
      error.code === 'EMAIL_VERIFICATION_REQUIRED' &&
      'status' in error &&
      error.status === 403
  );
  assert.equal(unverified.getLinkAttempts(), 0);
  console.log('PASS: unverified email cannot link an existing application account.');

  const newAccount = testRepository(null);
  assert.equal(
    await resolveApplicationUser(
      { id: 'new-unverified-identity', email: 'new@example.invalid', email_confirmed_at: null },
      newAccount.repository
    ),
    null
  );
  assert.equal(newAccount.getLinkAttempts(), 0);
  console.log('PASS: unverified identity without a matching account is not linked.');
}

run().catch((error: unknown) => {
  console.error('Account-linking tests failed:', error);
  process.exitCode = 1;
});
