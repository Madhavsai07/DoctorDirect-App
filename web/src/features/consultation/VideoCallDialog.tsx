import { Camera, CameraOff, Mic, MicOff, PhoneOff, Video } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/api/services'
import { supabase } from '@/auth/supabaseClient'
import {
  AuthenticatedSignalingSession,
  type SignalMessage,
  type SignalingState,
} from '@/features/consultation/signaling'

type CallStatus = 'ready' | 'connecting' | 'waiting' | 'connected' | 'reconnecting' | 'failed'

interface VideoCallDialogProps {
  consultationId: string
  title: string
  onClose: () => void
}

const signalingUrl = (() => {
  const configuredUrl = import.meta.env.VITE_SIGNALING_URL
  if (configuredUrl) return configuredUrl

  const apiUrl = new URL(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1', window.location.origin)
  apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  apiUrl.pathname = `${apiUrl.pathname.replace(/\/+$/, '')}/signaling`
  apiUrl.search = ''
  apiUrl.hash = ''
  return apiUrl.toString()
})()

const relayTestEnabled = import.meta.env.VITE_WEBRTC_RELAY_TEST_ENABLED === 'true'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Unable to start the video call.'
}

async function selectedCandidateRoute(connection: RTCPeerConnection): Promise<'relay' | 'direct' | 'checking'> {
  const stats = await connection.getStats()
  const candidates = new Map<string, RTCStats & { candidateType?: string }>()
  stats.forEach((report) => {
    if (report.type === 'local-candidate' || report.type === 'remote-candidate') {
      candidates.set(report.id, report as RTCStats & { candidateType?: string })
    }
  })
  for (const report of stats.values()) {
    if (report.type !== 'candidate-pair') continue
    const pair = report as RTCIceCandidatePairStats & { selected?: boolean }
    if (!pair.selected && !(pair.nominated && pair.state === 'succeeded')) continue
    const localCandidate = candidates.get(pair.localCandidateId)
    const remoteCandidate = candidates.get(pair.remoteCandidateId)
    return localCandidate?.candidateType === 'relay' || remoteCandidate?.candidateType === 'relay'
      ? 'relay'
      : 'direct'
  }
  return 'checking'
}

export function VideoCallDialog({ consultationId, title, onClose }: VideoCallDialogProps) {
  const localVideo = useRef<HTMLVideoElement>(null)
  const remoteVideo = useRef<HTMLVideoElement>(null)
  const localStream = useRef<MediaStream | null>(null)
  const peer = useRef<RTCPeerConnection | null>(null)
  const signaling = useRef<AuthenticatedSignalingSession | null>(null)
  const startPending = useRef(false)
  const stopped = useRef(false)
  const [status, setStatus] = useState<CallStatus>('ready')
  const [error, setError] = useState('')
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [relayOnly, setRelayOnly] = useState(false)
  const [route, setRoute] = useState<'relay' | 'direct' | 'checking'>('checking')
  const [seconds, setSeconds] = useState(0)
  const [mediaReady, setMediaReady] = useState(false)

  const cleanup = useCallback((notifyPeer = true) => {
    stopped.current = true
    signaling.current?.stop(notifyPeer)
    signaling.current = null
    peer.current?.getSenders().forEach((sender) => sender.track?.stop())
    peer.current?.close()
    peer.current = null
    localStream.current?.getTracks().forEach((track) => track.stop())
    localStream.current = null
    setMediaReady(false)
    if (localVideo.current) localVideo.current.srcObject = null
    if (remoteVideo.current) remoteVideo.current.srcObject = null
  }, [])

  useEffect(() => () => cleanup(false), [cleanup])

  useEffect(() => {
    if (status !== 'connected') return
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [status])

  useEffect(() => {
    if (status !== 'connected' || !peer.current) return
    let active = true
    const connection = peer.current
    const inspectRoute = async () => {
      try {
        const selected = await selectedCandidateRoute(connection)
        if (active) setRoute(selected)
      } catch (statsError) {
        if (active) setError(`Unable to inspect the active connection route: ${getErrorMessage(statsError)}`)
      }
    }
    void inspectRoute()
    const timer = window.setInterval(() => void inspectRoute(), 3000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [status])

  const start = async () => {
    if (startPending.current) return
    startPending.current = true
    stopped.current = false
    setError('')
    setStatus('connecting')
    try {
      if (!window.isSecureContext) {
        throw new Error('Camera and microphone access requires HTTPS, or localhost for development.')
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('This browser does not support camera and microphone access.')
      }
      if (!signalingUrl.startsWith('wss://') && window.location.protocol === 'https:') {
        throw new Error('Secure pages require secure WebSocket signaling (wss://).')
      }
      if (!supabase) throw new Error('Supabase authentication is not configured.')
      const authClient = supabase
      const { data: sessionData, error: sessionError } = await authClient.auth.getSession()
      if (sessionError) throw sessionError
      if (stopped.current) return
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Your session expired. Sign in again before joining the call.')

      const { iceServers } = await api.iceServers(consultationId)
      if (stopped.current) return
      if (!iceServers.length) throw new Error('No ICE servers are configured for video calling.')

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      if (stopped.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      localStream.current = stream
      setMediaReady(true)
      if (localVideo.current) localVideo.current.srcObject = stream

      const connection = new RTCPeerConnection({
        iceServers,
        ...(relayOnly ? { iceTransportPolicy: 'relay' as const } : {}),
      })
      peer.current = connection

      const pendingLocalCandidates: RTCIceCandidateInit[] = []
      const pendingRemoteCandidates: RTCIceCandidateInit[] = []
      let hasRemoteDescription = false
      let session: AuthenticatedSignalingSession
      let messageQueue = Promise.resolve()

      const sendSignal = (message: SignalMessage) => {
        if (session.send(message)) return true
        if (message.type === 'ice-candidate' && message.payload) {
          pendingLocalCandidates.push(message.payload as RTCIceCandidateInit)
        }
        return false
      }

      let makingOffer = false
      const createAndSendOffer = async () => {
        if (makingOffer || connection.signalingState !== 'stable') return
        makingOffer = true
        try {
          const offer = await connection.createOffer({ iceRestart: true })
          await connection.setLocalDescription(offer)
          sendSignal({ type: 'offer', payload: offer })
        } finally {
          makingOffer = false
        }
      }

      const applyRemoteDescription = async (description: RTCSessionDescriptionInit) => {
        await connection.setRemoteDescription(description)
        while (pendingRemoteCandidates.length) {
          await connection.addIceCandidate(pendingRemoteCandidates.shift()!)
        }
        hasRemoteDescription = true
      }

      stream.getTracks().forEach((track) => connection.addTrack(track, stream))
      connection.ontrack = (event) => {
        if (remoteVideo.current && event.streams[0]) remoteVideo.current.srcObject = event.streams[0]
      }
      connection.onicecandidate = (event) => {
        if (!event.candidate) return
        sendSignal({ type: 'ice-candidate', payload: event.candidate.toJSON() })
      }
      connection.onconnectionstatechange = () => {
        if (stopped.current) return
        if (connection.connectionState === 'connected') setStatus('connected')
        else if (connection.connectionState === 'disconnected' || connection.connectionState === 'connecting') {
          setStatus('reconnecting')
        } else if (connection.connectionState === 'failed') {
          setStatus('reconnecting')
          void connection.restartIce?.()
          void createAndSendOffer().catch((offerError) => setError(getErrorMessage(offerError)))
        }
      }

      const handleMessage = (message: SignalMessage) => {
        messageQueue = messageQueue.then(async () => {
          if (stopped.current) return
          try {
            if (message.type === 'participant-joined') {
              if (connection.signalingState === 'have-local-offer') {
                await connection.setLocalDescription({ type: 'rollback' })
              }
              await createAndSendOffer()
            } else if (message.type === 'offer') {
              hasRemoteDescription = false
              await applyRemoteDescription(message.payload as RTCSessionDescriptionInit)
              const answer = await connection.createAnswer()
              await connection.setLocalDescription(answer)
              sendSignal({ type: 'answer', payload: answer })
            } else if (message.type === 'answer') {
              hasRemoteDescription = false
              await applyRemoteDescription(message.payload as RTCSessionDescriptionInit)
            } else if (message.type === 'ice-candidate') {
              const candidate = message.payload as RTCIceCandidateInit
              if (hasRemoteDescription) await connection.addIceCandidate(candidate)
              else pendingRemoteCandidates.push(candidate)
            } else if (message.type === 'participant-left') {
              if (remoteVideo.current) remoteVideo.current.srcObject = null
              setStatus('waiting')
            } else if (message.type === 'error') {
              throw new Error(message.error || 'Signaling failed.')
            }
          } catch (messageError) {
            setError(getErrorMessage(messageError))
            setStatus('failed')
            cleanup(false)
          }
        })
      }

      session = new AuthenticatedSignalingSession({
        url: signalingUrl,
        consultationId,
        getAccessToken: async () => {
          const { data, error: authError } = await authClient.auth.getSession()
          if (authError) throw authError
          return data.session?.access_token ?? null
        },
        refreshAccessToken: async () => {
          const { data, error: authError } = await authClient.auth.refreshSession()
          if (authError) throw authError
          return data.session?.access_token ?? null
        },
        onMessage: handleMessage,
        onStateChange: (nextState: SignalingState, peerPresent) => {
          if (stopped.current) return
          if (nextState === 'reconnecting') {
            setStatus('reconnecting')
          } else if (nextState === 'failed') {
            setStatus('failed')
          } else {
            setStatus(peerPresent ? 'connecting' : 'waiting')
            for (const candidate of pendingLocalCandidates.splice(0)) {
              if (!session.send({ type: 'ice-candidate', payload: candidate })) {
                pendingLocalCandidates.push(candidate)
              }
            }
          }
        },
        onFailure: (messageText) => {
          setError(messageText)
          setStatus('failed')
          cleanup(false)
        },
      })
      signaling.current = session
      await session.start(token)
    } catch (startError) {
      if (!stopped.current) {
        cleanup(false)
        setError(getErrorMessage(startError))
        setStatus('failed')
      }
    } finally {
      startPending.current = false
    }
  }

  const close = () => {
    cleanup()
    onClose()
  }

  const toggleMute = () => {
    const track = localStream.current?.getAudioTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setMuted(!track.enabled)
  }

  const toggleCamera = () => {
    const track = localStream.current?.getVideoTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setCameraOff(!track.enabled)
  }

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  return (
    <div className="video-call-backdrop" role="presentation">
      <section className="video-call-dialog" role="dialog" aria-modal="true" aria-labelledby="video-call-title">
        <header className="video-call-dialog__header">
          <div>
            <span className="eyebrow">LIVE CONSULTATION</span>
            <h2 id="video-call-title">{title}</h2>
          </div>
          <button className="modal-close" type="button" onClick={close} aria-label="End call and close">
            <PhoneOff size={19} />
          </button>
        </header>

        <div className="video-call-stage">
          <video ref={remoteVideo} className="video-call-stage__remote" autoPlay playsInline aria-label="Other participant" />
          {status !== 'connected' && (
            <div className="video-call-stage__waiting">
              <Video size={28} />
              <strong>{status === 'ready' ? 'Ready to join' : status === 'failed' ? 'Call connection failed' : status === 'reconnecting' ? 'Reconnecting…' : 'Waiting for the other participant…'}</strong>
              <span>Calls are not recorded.</span>
            </div>
          )}
          <video ref={localVideo} className="video-call-stage__local" autoPlay muted playsInline aria-label="Your camera preview" />
          {cameraOff && <div className="video-call-stage__camera-off"><CameraOff size={18} /> Camera off</div>}
        </div>

        <div className="video-call-dialog__status" aria-live="polite">
          <span className={`video-call-status-dot video-call-status-dot--${status}`} />
          <span>{status === 'connected' ? `Connected · ${clock}` : status[0].toUpperCase() + status.slice(1)}</span>
          {status === 'connected' && <span className="video-call-route">Connection: {route === 'checking' ? 'checking' : route}</span>}
        </div>
        {error && <div className="feedback feedback--error" role="alert">{error}</div>}

        {relayTestEnabled && (status === 'ready' || status === 'failed') && (
          <label className="video-call-relay-option">
            <input type="checkbox" checked={relayOnly} onChange={(event) => setRelayOnly(event.target.checked)} />
            Require TURN relay (connectivity test)
          </label>
        )}

        <footer className="video-call-controls">
          {status === 'ready' || status === 'failed'
            ? <button className="button button--primary" type="button" onClick={() => void start()}>
                <Camera size={16} /> Allow camera and join
              </button>
            : <>
                <button className="button button--secondary" type="button" onClick={toggleMute} disabled={!mediaReady}>
                  {muted ? <MicOff size={16} /> : <Mic size={16} />} {muted ? 'Unmute' : 'Mute'}
                </button>
                <button className="button button--secondary" type="button" onClick={toggleCamera} disabled={!mediaReady}>
                  {cameraOff ? <CameraOff size={16} /> : <Camera size={16} />} {cameraOff ? 'Camera on' : 'Camera off'}
                </button>
              </>
          }
          <button className="button button--danger-ghost" type="button" onClick={close}>
            <PhoneOff size={16} /> End call
          </button>
        </footer>
      </section>
    </div>
  )
}
