import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const baseEnvironment = {
  ...process.env,
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://localhost:5432/config-check',
  DATABASE_SSL_CA: '',
  DATABASE_SSL_CA_BASE64: '',
  SUPABASE_URL: 'https://project.example.test',
  SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  TRUST_PROXY: 'true',
  WEBRTC_STUN_URLS: 'stun:stun.example.test:3478',
  WEBRTC_TURN_AUTH_MODE: '',
  WEBRTC_TURN_URLS: 'turn:turn.example.test:3478?transport=udp',
  WEBRTC_TURN_USERNAME: '',
  WEBRTC_TURN_PASSWORD: '',
  WEBRTC_TURN_SHARED_SECRET: '',
  WEBRTC_TURN_CREDENTIAL_TTL_SECONDS: '3600',
};

function loadConfig(overrides: Record<string, string>) {
  return spawnSync(
    process.execPath,
    ['-r', 'ts-node/register', '-e', "require('./src/config/env')"],
    {
      cwd: __dirname,
      encoding: 'utf8',
      env: { ...baseEnvironment, ...overrides },
    }
  );
}

const missingMode = loadConfig({});
assert.notEqual(missingMode.status, 0);
assert.match(missingMode.stderr, /WEBRTC_TURN_AUTH_MODE must be explicitly set/);

const missingIce = loadConfig({
  WEBRTC_TURN_AUTH_MODE: 'rest',
  WEBRTC_STUN_URLS: '',
  WEBRTC_TURN_URLS: '',
});
assert.notEqual(missingIce.status, 0);
assert.match(missingIce.stderr, /WEBRTC_TURN_URLS is required/);

const validStatic = loadConfig({
  WEBRTC_TURN_AUTH_MODE: 'static',
  WEBRTC_TURN_USERNAME: 'provider-user',
  WEBRTC_TURN_PASSWORD: 'provider-password',
});
assert.equal(validStatic.status, 0, validStatic.stderr);

const staticWithOptionalRestSecret = loadConfig({
  WEBRTC_TURN_AUTH_MODE: 'static',
  WEBRTC_TURN_USERNAME: 'provider-user',
  WEBRTC_TURN_PASSWORD: 'provider-password',
  WEBRTC_TURN_SHARED_SECRET: 'optional-unused-shared-secret',
});
assert.equal(staticWithOptionalRestSecret.status, 0, staticWithOptionalRestSecret.stderr);

const missingStaticUsername = loadConfig({
  WEBRTC_TURN_AUTH_MODE: 'static',
  WEBRTC_TURN_PASSWORD: 'provider-password',
});
assert.notEqual(missingStaticUsername.status, 0);
assert.match(missingStaticUsername.stderr, /WEBRTC_TURN_USERNAME is required/);

const missingStaticPassword = loadConfig({
  WEBRTC_TURN_AUTH_MODE: 'static',
  WEBRTC_TURN_USERNAME: 'provider-user',
});
assert.notEqual(missingStaticPassword.status, 0);
assert.match(missingStaticPassword.stderr, /WEBRTC_TURN_PASSWORD is required/);

const missingRestSecret = loadConfig({ WEBRTC_TURN_AUTH_MODE: 'rest' });
assert.notEqual(missingRestSecret.status, 0);
assert.match(missingRestSecret.stderr, /WEBRTC_TURN_SHARED_SECRET must be at least 32 characters/);

const restWithStaticCredentials = loadConfig({
  WEBRTC_TURN_AUTH_MODE: 'rest',
  WEBRTC_TURN_USERNAME: 'provider-user',
  WEBRTC_TURN_PASSWORD: 'provider-password',
  WEBRTC_TURN_SHARED_SECRET: 'server-only-secret-with-at-least-32-characters',
});
assert.notEqual(restWithStaticCredentials.status, 0);
assert.match(restWithStaticCredentials.stderr, /Remove static TURN credentials/);

const invalidMode = loadConfig({
  WEBRTC_TURN_AUTH_MODE: 'automatic',
  WEBRTC_TURN_SHARED_SECRET: 'server-only-secret-with-at-least-32-characters',
});
assert.notEqual(invalidMode.status, 0);
assert.match(invalidMode.stderr, /WEBRTC_TURN_AUTH_MODE must be either/);

for (const invalidTurnUrl of [
  'https://turn.example.test:3478',
  'turn:user:password@turn.example.test:3478',
  'turns:turn.example.test:5349?transport=udp',
  'turn:turn.example.test:3478?transport=invalid',
  'turn:turn..example.test:3478',
  'turn:turn.example.test:70000',
]) {
  const invalidUrl = loadConfig({
    WEBRTC_TURN_AUTH_MODE: 'static',
    WEBRTC_TURN_URLS: invalidTurnUrl,
    WEBRTC_TURN_USERNAME: 'provider-user',
    WEBRTC_TURN_PASSWORD: 'provider-password',
  });
  assert.notEqual(invalidUrl.status, 0, 'invalid TURN URL should be rejected');
  assert.match(invalidUrl.stderr, /WEBRTC_TURN_URLS must contain valid TURN or TURNS URLs/);
  assert.equal(invalidUrl.stderr.includes('provider-password'), false, 'configuration errors must not expose credentials');
}

const validRest = loadConfig({
  WEBRTC_TURN_AUTH_MODE: 'rest',
  WEBRTC_TURN_SHARED_SECRET: 'server-only-secret-with-at-least-32-characters',
  WEBRTC_TURN_URLS: 'turn:turn.example.test:3478?transport=udp,turn:turn.example.test:3478?transport=tcp,turns:turn.example.test:5349?transport=tcp',
});
assert.equal(validRest.status, 0, validRest.stderr);

console.log('Static and REST TURN configuration checks passed.');
