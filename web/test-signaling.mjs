import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({
  configFile: false,
  root: new URL('.', import.meta.url).pathname,
  logLevel: 'silent',
  server: { middlewareMode: true },
  appType: 'custom',
})
const signaling = await vite.ssrLoadModule('/src/features/consultation/signaling.ts')
const { AuthenticatedSignalingSession, connectAuthenticatedSignaling } = signaling

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

test.after(async () => {
  await vite.close()
})

class FakeSocket {
  static instances = []
  readyState = 1
  sent = []

  constructor(url, protocols) {
    this.url = url
    this.protocols = protocols
    FakeSocket.instances.push(this)
  }

  send(message) {
    this.sent.push(JSON.parse(message))
  }

  close() {
    this.readyState = 3
  }

  receive(message) {
    this.onmessage?.({ data: JSON.stringify(message) })
  }
}

function createConnector(implementation) {
  const attempts = []
  const connect = async (...args) => {
    attempts.push(args)
    return implementation(...args, attempts.length)
  }
  return { attempts, connect }
}

function waitFor(predicate, message) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 1000
    const poll = () => {
      if (predicate()) return resolve()
      if (Date.now() >= deadline) return reject(new Error(message))
      setTimeout(poll, 5)
    }
    poll()
  })
}

test('authenticates, joins the requested consultation, and relays server messages', async () => {
  FakeSocket.instances = []
  globalThis.WebSocket = FakeSocket
  const received = []
  const connected = connectAuthenticatedSignaling(
    'wss://api.example.test/api/v1/signaling',
    'supabase-access-token',
    'consultation-123',
    (message) => received.push(message),
    () => undefined,
  )
  const socket = FakeSocket.instances[0]

  assert.deepEqual(socket.protocols, ['dd-auth', 'supabase-access-token'])
  socket.receive({ type: 'authenticated' })
  assert.deepEqual(socket.sent, [{ type: 'join', consultationId: 'consultation-123' }])
  socket.receive({ type: 'joined', peerPresent: true })
  const joined = await connected
  socket.receive({ type: 'offer', payload: { type: 'offer', sdp: 'sdp' } })

  assert.equal(joined.socket, socket)
  assert.equal(joined.peerPresent, true)
  assert.equal(received[0].type, 'offer')
  socket.close()
})

test('rejoins the same consultation after signaling closes', async () => {
  const sockets = []
  const { attempts, connect } = createConnector(async (...args) => {
    const socket = { readyState: 1, send() {}, close() { this.readyState = 3 } }
    sockets.push(socket)
    return { socket, peerPresent: sockets.length > 1 }
  })
  const states = []
  const session = new AuthenticatedSignalingSession({
    url: 'wss://api.example.test/api/v1/signaling',
    consultationId: 'consultation-123',
    getAccessToken: async () => 'current-token',
    refreshAccessToken: async () => null,
    onMessage: () => undefined,
    onStateChange: (state, peerPresent) => states.push({ state, peerPresent }),
    onFailure: (message) => assert.fail(message),
    connect,
    retryDelaysMs: [1, 2],
    stableConnectionMs: 100,
  })

  await session.start('initial-token')
  attempts[0][4]()
  await waitFor(() => attempts.length === 2, 'signaling did not reconnect')

  assert.equal(attempts[1][1], 'current-token')
  assert.equal(attempts[1][2], 'consultation-123')
  assert.deepEqual(states.map(({ state }) => state), ['connected', 'reconnecting', 'connected'])
  assert.equal(states.at(-1).peerPresent, true)
  session.stop(false)
})

test('stops reconnect attempts after the call ends', async () => {
  const { attempts, connect } = createConnector(async () => ({
    socket: { readyState: 1, send() {}, close() {} },
    peerPresent: false,
  }))
  const session = new AuthenticatedSignalingSession({
    url: 'wss://api.example.test/api/v1/signaling',
    consultationId: 'consultation-123',
    getAccessToken: async () => 'token',
    refreshAccessToken: async () => null,
    onMessage: () => undefined,
    onStateChange: () => undefined,
    onFailure: (message) => assert.fail(message),
    connect,
    retryDelaysMs: [20],
    stableConnectionMs: 100,
  })

  await session.start('token')
  attempts[0][4]()
  session.stop(false)
  await wait(35)

  assert.equal(attempts.length, 1)
})
