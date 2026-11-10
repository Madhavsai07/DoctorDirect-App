import assert from 'node:assert/strict';
import { createHmac } from 'crypto';
import { createTurnCredentials } from './src/services/turn-credentials.service';

const userId = '11111111-1111-1111-1111-111111111111';
const secret = 'a-server-only-shared-secret-with-at-least-32-characters';
const credentials = createTurnCredentials(userId, secret, 3600, 1_800_000_000);

assert.equal(credentials.username, `1800003600:${userId}`);
assert.equal(
  credentials.credential,
  createHmac('sha1', secret).update(credentials.username).digest('base64')
);
assert.notEqual(
  createTurnCredentials('22222222-2222-2222-2222-222222222222', secret, 3600, 1_800_000_000).credential,
  credentials.credential
);
assert.notEqual(
  createTurnCredentials(userId, `${secret}-different`, 3600, 1_800_000_000).credential,
  credentials.credential
);

console.log('Short-lived TURN credential checks passed.');
