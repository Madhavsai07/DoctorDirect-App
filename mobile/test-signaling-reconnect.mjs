import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const signalingSource = await readFile(new URL('./src/services/consultations/signaling.ts', import.meta.url), 'utf8')
const signalingModule = ts.transpile(signalingSource, {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
})
const { AuthenticatedSignalingSession, SignalingAuthenticationError } = await import(
  `data:text/javascript;base64,${Buffer.from(signalingModule).toString('base64')}`
)

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

class FakeSocket {
  readyState = 1
  sent = []
  closeCount = 0

  send(message) {
    this.sent.push(message)
  }

  close() {
    this.closeCount += 1
    this.readyState = 3
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

test('rejoins the same consultation after signaling closes', async () => {
  const sockets = []
  const callbacks = []
  const { attempts, connect } = createConnector(async (...args) => {
    const socket = new FakeSocket()
    sockets.push(socket)
    callbacks.push({ onMessage: args[3], onClose: args[4] })
    return { socket, peerPresent: sockets.length > 1 }
  })
  const states = []
  const session = new AuthenticatedSignalingSession({
    url: 'wss://signaling.example.test',
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
  callbacks[0].onClose({})
  await waitFor(() => attempts.length === 2, 'signaling did not reconnect')

  assert.equal(attempts[1][0], 'wss://signaling.example.test')
  assert.equal(attempts[1][1], 'current-token')
  assert.equal(attempts[1][2], 'consultation-123')
  assert.deepEqual(states.map(({ state }) => state), ['connected', 'reconnecting', 'connected'])
  assert.equal(states.at(-1).peerPresent, true)

  session.stop(false)
  assert.equal(sockets[1].closeCount, 1)
})

test('stops retrying after bounded exponential attempts', async () => {
  let failure
  const attemptTimes = []
  const { attempts, connect } = createConnector(async (_url, _token, _id, _onMessage, _onClose, _onError, attempt) => {
    attemptTimes.push(Date.now())
    if (attempt > 1) throw new Error('temporary network failure')
    return { socket: new FakeSocket(), peerPresent: false }
  })
  const session = new AuthenticatedSignalingSession({
    url: 'wss://signaling.example.test',
    consultationId: 'consultation-123',
    getAccessToken: async () => 'token',
    refreshAccessToken: async () => null,
    onMessage: () => undefined,
    onStateChange: () => undefined,
    onFailure: (message) => { failure = message },
    connect,
    retryDelaysMs: [15, 30, 60],
    stableConnectionMs: 100,
  })

  await session.start('token')
  attempts[0][4]({})
  await waitFor(() => Boolean(failure), 'session did not report exhausted retries')

  assert.equal(attempts.length, 4)
  assert.ok(attemptTimes[1] - attemptTimes[0] >= 10)
  assert.ok(attemptTimes[2] - attemptTimes[1] >= 25)
  assert.ok(attemptTimes[3] - attemptTimes[2] >= 50)
  assert.match(failure, /could not be restored/i)
  session.stop(false)
})

test('refreshes an expired token and rejoins the same consultation', async () => {
  const { attempts, connect } = createConnector(async (...args) => {
    if (args[1] === 'expired-token') throw new SignalingAuthenticationError()
    return { socket: new FakeSocket(), peerPresent: true }
  })
  const session = new AuthenticatedSignalingSession({
    url: 'wss://signaling.example.test',
    consultationId: 'consultation-123',
    getAccessToken: async () => 'expired-token',
    refreshAccessToken: async () => 'refreshed-token',
    onMessage: () => undefined,
    onStateChange: () => undefined,
    onFailure: (message) => assert.fail(message),
    connect,
    retryDelaysMs: [1],
    stableConnectionMs: 100,
  })

  await session.start('initial-token')
  attempts[0][4]({})
  await waitFor(() => attempts.length === 3, 'session did not retry with a refreshed token')

  assert.equal(attempts[1][2], 'consultation-123')
  assert.equal(attempts[2][1], 'refreshed-token')
  assert.equal(attempts[2][2], 'consultation-123')
  session.stop(false)
})

test('does not open another socket after the call is stopped during backoff', async () => {
  const { attempts, connect } = createConnector(async () => ({
    socket: new FakeSocket(),
    peerPresent: false,
  }))
  const session = new AuthenticatedSignalingSession({
    url: 'wss://signaling.example.test',
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
  attempts[0][4]({})
  session.stop(false)
  await wait(35)

  assert.equal(attempts.length, 1)
})

test('coalesces repeated close notifications into one reconnect', async () => {
  const { attempts, connect } = createConnector(async () => ({
    socket: new FakeSocket(),
    peerPresent: false,
  }))
  const session = new AuthenticatedSignalingSession({
    url: 'wss://signaling.example.test',
    consultationId: 'consultation-123',
    getAccessToken: async () => 'token',
    refreshAccessToken: async () => null,
    onMessage: () => undefined,
    onStateChange: () => undefined,
    onFailure: (message) => assert.fail(message),
    connect,
    retryDelaysMs: [1, 2],
    stableConnectionMs: 100,
  })

  await session.start('token')
  attempts[0][4]({})
  attempts[0][4]({})
  await waitFor(() => attempts.length === 2, 'signaling did not reconnect')
  await wait(15)

  assert.equal(attempts.length, 2)
  session.stop(false)
})
