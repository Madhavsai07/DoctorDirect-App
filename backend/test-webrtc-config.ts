import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const baseEnvironment = {
  ...process.env,
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://localhost:5432/config-check',
  DATABASE_SSL_CA: '',
  DATABASE_SSL_CA_BASE64: '',
  WEBRTC_STUN_URLS: '',
  WEBRTC_TURN_URLS: '',
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

const missingIce = loadConfig({});
assert.notEqual(missingIce.status, 0);
assert.match(missingIce.stderr, /Configure both WEBRTC_STUN_URLS and WEBRTC_TURN_URLS/);

const missingSharedSecret = loadConfig({
  WEBRTC_STUN_URLS: 'stun:stun.example.test:3478',
  WEBRTC_TURN_URLS: 'turns:turn.example.test:5349',
});
assert.notEqual(missingSharedSecret.status, 0);
assert.match(missingSharedSecret.stderr, /WEBRTC_TURN_SHARED_SECRET must be at least 32 characters/);

const embeddedCredentials = loadConfig({
  WEBRTC_STUN_URLS: 'stun:stun.example.test:3478',
  WEBRTC_TURN_URLS: 'turn:user:password@turn.example.test:3478',
  WEBRTC_TURN_SHARED_SECRET: 'server-only-secret-with-at-least-32-characters',
});
assert.notEqual(embeddedCredentials.status, 0);
assert.match(embeddedCredentials.stderr, /WEBRTC_TURN_URLS must contain only TURN or TURNS URLs without embedded credentials/);

const queryCredentials = loadConfig({
  WEBRTC_STUN_URLS: 'stun:stun.example.test:3478',
  WEBRTC_TURN_URLS: 'turns:turn.example.test:5349?username=inline&credential=inline',
  WEBRTC_TURN_SHARED_SECRET: 'server-only-secret-with-at-least-32-characters',
});
assert.notEqual(queryCredentials.status, 0);
assert.match(queryCredentials.stderr, /WEBRTC_TURN_URLS must contain only TURN or TURNS URLs without embedded credentials/);

const invalidTtl = loadConfig({
  WEBRTC_STUN_URLS: 'stun:stun.example.test:3478',
  WEBRTC_TURN_URLS: 'turns:turn.example.test:5349',
  WEBRTC_TURN_SHARED_SECRET: 'server-only-secret-with-at-least-32-characters',
  WEBRTC_TURN_CREDENTIAL_TTL_SECONDS: '30',
});
assert.notEqual(invalidTtl.status, 0);
assert.match(invalidTtl.stderr, /WEBRTC_TURN_CREDENTIAL_TTL_SECONDS must be an integer/);

const validIce = loadConfig({
  WEBRTC_STUN_URLS: 'stun:stun.example.test:3478,stuns:stun.example.test:5349',
  WEBRTC_TURN_URLS: 'turn:turn.example.test:3478?transport=udp,turns:turn.example.test:5349?transport=tcp',
  WEBRTC_TURN_SHARED_SECRET: 'server-only-secret-with-at-least-32-characters',
});
assert.equal(validIce.status, 0, validIce.stderr);

console.log('Production ICE configuration checks passed.');
