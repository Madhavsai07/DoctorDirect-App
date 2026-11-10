export interface SignalMessage {
  type: string
  error?: string
  fatal?: boolean
  peerPresent?: boolean
  role?: 'patient' | 'doctor'
  payload?: unknown
}

export interface JoinedSocket {
  socket: WebSocket
  peerPresent: boolean
}

export class SignalingAuthenticationError extends Error {
  constructor() {
    super('Signaling authentication failed.')
    this.name = 'SignalingAuthenticationError'
  }
}

export class SignalingJoinError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SignalingJoinError'
  }
}

export type SignalingState = 'connected' | 'reconnecting' | 'failed'

export interface SignalingSessionOptions {
  url: string
  consultationId: string
  getAccessToken: () => Promise<string | null>
  refreshAccessToken: () => Promise<string | null>
  onMessage: (message: SignalMessage) => void
  onStateChange: (state: SignalingState, peerPresent?: boolean) => void
  onFailure: (message: string) => void
  connect?: typeof connectAuthenticatedSignaling
  retryDelaysMs?: readonly number[]
  stableConnectionMs?: number
}

const RETRY_DELAYS_MS = [500, 1000, 2000, 4000, 8000] as const
const WEBSOCKET_OPEN = 1

export class AuthenticatedSignalingSession {
  private readonly options: SignalingSessionOptions
  private readonly connect: typeof connectAuthenticatedSignaling
  private readonly retryDelaysMs: readonly number[]
  private readonly stableConnectionMs: number
  private socket: WebSocket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private stableTimer: ReturnType<typeof setTimeout> | null = null
  private generation = 0
  private retryCount = 0
  private reconnecting = false
  private stopped = true

  constructor(options: SignalingSessionOptions) {
    this.options = options
    this.connect = options.connect ?? connectAuthenticatedSignaling
    this.retryDelaysMs = options.retryDelaysMs ?? RETRY_DELAYS_MS
    this.stableConnectionMs = options.stableConnectionMs ?? 30_000
  }

  async start(token: string): Promise<void> {
    this.stopped = false
    try {
      await this.openWithRefresh(token)
    } catch (error) {
      if (error instanceof SignalingJoinError || error instanceof SignalingAuthenticationError) throw error
      this.options.onStateChange('reconnecting')
      this.scheduleReconnect()
      return
    }
  }

  send(message: object): boolean {
    if (this.socket?.readyState !== WEBSOCKET_OPEN) return false
    this.socket.send(JSON.stringify(message))
    return true
  }

  stop(notifyPeer = true): void {
    this.stopped = true
    this.reconnecting = false
    this.generation += 1
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.stableTimer) clearTimeout(this.stableTimer)
    this.reconnectTimer = null
    this.stableTimer = null
    if (notifyPeer && this.socket?.readyState === WEBSOCKET_OPEN) {
      this.socket.send(JSON.stringify({ type: 'leave' }))
    }
    this.socket?.close()
    this.socket = null
  }

  private async openWithRefresh(token: string): Promise<void> {
    if (this.stopped) return
    try {
      await this.open(token)
    } catch (error) {
      if (!(error instanceof SignalingAuthenticationError)) throw error
      const refreshedToken = await this.options.refreshAccessToken()
      if (this.stopped) return
      if (!refreshedToken) throw error
      await this.open(refreshedToken)
    }
  }

  private async open(token: string): Promise<void> {
    if (this.stopped) return
    const generation = ++this.generation
    const joined = await this.connect(
      this.options.url,
      token,
      this.options.consultationId,
      (message) => {
        if (!this.stopped && generation === this.generation) this.options.onMessage(message)
      },
      () => this.handleClose(generation),
    )

    if (this.stopped || generation !== this.generation) {
      joined.socket.close()
      return
    }

    this.socket = joined.socket
    this.options.onStateChange('connected', joined.peerPresent)
    if (this.stableTimer) clearTimeout(this.stableTimer)
    this.stableTimer = setTimeout(() => {
      if (!this.stopped && generation === this.generation && this.socket?.readyState === WEBSOCKET_OPEN) {
        this.retryCount = 0
      }
    }, this.stableConnectionMs)
  }

  private handleClose(generation: number): void {
    if (this.stopped || generation !== this.generation) return
    this.socket = null
    this.generation += 1
    if (this.stableTimer) clearTimeout(this.stableTimer)
    this.stableTimer = null
    this.options.onStateChange('reconnecting')
    this.scheduleReconnect()
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer || this.reconnecting) return
    if (this.retryCount >= this.retryDelaysMs.length) {
      this.fail('Signaling could not be restored. End the call and rejoin the consultation.')
      return
    }
    const delay = this.retryDelaysMs[this.retryCount]
    this.retryCount += 1
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      void this.reconnect()
    }, delay)
  }

  private async reconnect(): Promise<void> {
    if (this.stopped || this.reconnecting) return
    this.reconnecting = true
    try {
      const token = await this.options.getAccessToken()
      if (this.stopped) return
      if (!token) {
        this.fail('Your session expired. Sign in again before rejoining the consultation.')
        return
      }
      await this.openWithRefresh(token)
      if (!this.stopped && !this.socket) {
        this.reconnecting = false
        this.scheduleReconnect()
        return
      }
    } catch (error) {
      if (this.stopped) return
      this.reconnecting = false
      if (error instanceof SignalingJoinError) {
        this.fail(error.message)
        return
      }
      if (error instanceof SignalingAuthenticationError) {
        this.fail('Signaling authentication failed. Sign in again before rejoining the consultation.')
        return
      }
      this.scheduleReconnect()
      return
    }
    this.reconnecting = false
  }

  private fail(message: string): void {
    if (this.stopped) return
    this.stop(false)
    this.options.onStateChange('failed')
    this.options.onFailure(message)
  }
}

export function connectAuthenticatedSignaling(
  url: string,
  token: string,
  consultationId: string,
  onMessage: (message: SignalMessage) => void,
  onClose: () => void,
): Promise<JoinedSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url, ['dd-auth', token])
    let authenticated = false
    let joined = false
    let settled = false
    let transportErrored = false

    const fail = (error: Error) => {
      if (settled) return
      settled = true
      clearTimeout(handshakeTimeout)
      socket.close()
      reject(error)
    }

    const handshakeTimeout = setTimeout(
      () => fail(new Error('Timed out waiting for signaling authentication.')),
      15_000,
    )

    socket.onmessage = ({ data }) => {
      let message: SignalMessage
      try {
        message = JSON.parse(String(data)) as SignalMessage
      } catch {
        fail(new Error('The signaling server sent an invalid response.'))
        return
      }

      if (message.type === 'authenticated') {
        if (authenticated) return
        authenticated = true
        socket.send(JSON.stringify({ type: 'join', consultationId }))
        return
      }

      if (message.type === 'joined') {
        if (!authenticated) {
          fail(new Error('Consultation authorization arrived before authentication.'))
          return
        }
        if (joined) return
        joined = true
        settled = true
        clearTimeout(handshakeTimeout)
        resolve({ socket, peerPresent: message.peerPresent === true })
        return
      }

      if (message.type === 'error' && !joined) {
        fail(message.fatal
          ? new SignalingJoinError(message.error || 'Unable to join this consultation.')
          : new Error(message.error || 'Signaling authorization failed.'))
        return
      }

      if (joined) onMessage(message)
    }

    socket.onerror = () => {
      if (!joined) transportErrored = true
    }

    socket.onclose = (event) => {
      if (!joined) {
        fail(event.code === 4401
          ? new SignalingAuthenticationError()
          : new Error(transportErrored
            ? 'Unable to connect to secure signaling.'
            : 'Signaling closed before consultation authorization completed.'))
        return
      }
      onClose()
    }
  })
}
