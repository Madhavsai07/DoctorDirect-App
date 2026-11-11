import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { WebSocket } from 'ws';
import { createSignalingServer, isSecureSignalingUpgrade, SignalingDependencies } from './src/signaling';
import { DbUser } from './src/repositories/user.repository';

const patient: DbUser = {
  id: '11111111-1111-1111-1111-111111111111', auth_user_id: 'auth-patient',
  email: 'patient@example.test', phone: null, role: 'patient', first_name: 'Pat', last_name: 'Ient',
  avatar_url: null, is_active: true, created_at: new Date(), updated_at: new Date(),
};

function dependencies(overrides: Partial<SignalingDependencies> = {}): SignalingDependencies {
  return {
    authenticateSignalingToken: async (token) => {
      // Keep authentication asynchronous so the test client can subscribe before
      // the server acknowledges the WebSocket handshake.
      await new Promise((resolve) => setTimeout(resolve, 5));
      if (token !== 'valid-token') throw new Error('Invalid token');
      return patient;
    },
    authorizeSignalingJoin: async () => ({ consultation: {} as any, role: 'patient' }),
    ...overrides,
  };
}

async function withServer(deps: SignalingDependencies, run: (url: string) => Promise<void>) {
  const server = http.createServer();
  const signaling = createSignalingServer(deps);
  server.on('upgrade', (req, socket, head) => {
    if (!signaling.handleUpgrade(req, socket, head)) socket.destroy();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address !== 'string');
  try {
    await run(`ws://127.0.0.1:${address.port}/api/v1/signaling`);
  } finally {
    signaling.close();
    server.close();
    await once(server, 'close');
  }
}

function open(url: string, protocols?: string[]) {
  return new Promise<WebSocket>((resolve, reject) => {
    const socket = new WebSocket(url, protocols);
    socket.once('open', () => resolve(socket));
    socket.once('error', reject);
  });
}

function nextMessage(socket: WebSocket) {
  return new Promise<any>((resolve, reject) => {
    socket.once('message', (raw) => resolve(JSON.parse(raw.toString())));
    socket.once('error', reject);
  });
}

async function closes(socket: WebSocket) {
  return new Promise<number>((resolve) => {
    socket.once('close', (code) => resolve(code));
    // A server is allowed to reset a missing-token upgrade before the WebSocket
    // handshake completes, which ws reports as an error instead of a close frame.
    socket.once('error', () => resolve(1006));
  });
}

async function close(socket: WebSocket) {
  const done = closes(socket);
  socket.close();
  await done;
}

async function testMissingToken() {
  let authenticateCalls = 0;
  await withServer(dependencies({ authenticateSignalingToken: async () => { authenticateCalls += 1; return patient; } }), async (url) => {
    const socket = new WebSocket(url);
    socket.on('error', () => undefined);
    await closes(socket);
  });
  assert.equal(authenticateCalls, 0, 'missing protocol token must not reach token verification');
}

async function testInvalidToken() {
  await withServer(dependencies(), async (url) => {
    const socket = await open(url, ['dd-auth', 'invalid-token']);
    assert.equal(await closes(socket), 4401);
  });
}

async function testSuccessfulHandshake() {
  await withServer(dependencies(), async (url) => {
    const socket = await open(url, ['dd-auth', 'valid-token']);
    assert.deepEqual(await nextMessage(socket), { type: 'authenticated' });
    socket.send(JSON.stringify({ type: 'join', consultationId: '22222222-2222-2222-2222-222222222222' }));
    const joined = await nextMessage(socket);
    assert.equal(joined.type, 'joined');
    assert.equal(joined.role, 'patient');
    await close(socket);
  });
}

async function testUnauthorizedParticipant() {
  await withServer(dependencies({
    authorizeSignalingJoin: async () => { throw new Error('You are not a participant in this consultation.'); },
  }), async (url) => {
    const socket = await open(url, ['dd-auth', 'valid-token']);
    await nextMessage(socket);
    socket.send(JSON.stringify({ type: 'join', consultationId: '33333333-3333-3333-3333-333333333333' }));
    const response = await nextMessage(socket);
    assert.deepEqual(response, { type: 'error', fatal: true, error: 'You are not a participant in this consultation.' });
    await close(socket);
  });
}

async function testSessionRevokedAfterConnection() {
  let tokenValid = true;
  await withServer(dependencies({
    sessionRevalidationIntervalMs: 20,
    authorizeSignalingJoin: async () => ({ consultation: {} as any, role: 'patient' }),
    authenticateSignalingToken: async (token) => {
      if (token !== 'valid-token' || !tokenValid) throw new Error('Invalid or revoked session');
      return patient;
    },
  }), async (url) => {
    const socket = await open(url, ['dd-auth', 'valid-token']);
    await nextMessage(socket);
    socket.send(JSON.stringify({ type: 'join', consultationId: '22222222-2222-2222-2222-222222222222' }));
    assert.equal((await nextMessage(socket)).type, 'joined');
    tokenValid = false;
    assert.equal(await closes(socket), 4401);
  });
}

function testSecureUpgradePolicy() {
  const request = (encrypted: boolean, forwarded?: string) => ({
    socket: { encrypted },
    headers: forwarded ? { 'x-forwarded-proto': forwarded } : {},
  }) as any;
  assert.equal(isSecureSignalingUpgrade(request(false), 'production', false), false);
  assert.equal(isSecureSignalingUpgrade(request(false, 'https'), 'production', false), false);
  assert.equal(isSecureSignalingUpgrade(request(false, 'https'), 'production', true), true);
  assert.equal(isSecureSignalingUpgrade(request(false, 'http, https'), 'production', true), false);
  assert.equal(isSecureSignalingUpgrade(request(true), 'production', false), true);
  assert.equal(isSecureSignalingUpgrade(request(false), 'development', false), true);
}

void (async () => {
  testSecureUpgradePolicy();
  await testMissingToken();
  await testInvalidToken();
  await testSuccessfulHandshake();
  await testUnauthorizedParticipant();
  await testSessionRevokedAfterConnection();
  console.log('Signaling authentication checks passed.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
