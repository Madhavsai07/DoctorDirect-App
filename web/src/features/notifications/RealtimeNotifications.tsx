import { useEffect, useRef } from 'react'
import { Bell, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api, type NotificationItem } from '@/api/services'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { getSupabaseClient } from '@/auth/supabaseClient'
import {
  clearNotifications,
  dismissNotificationBanner,
  markNotificationRead,
  receiveNotification,
  showNotificationBanner,
  syncNotifications,
} from '@/store/slices/notificationSlice'

const SYNC_INTERVAL_MS = 6000
const AUTO_DISMISS_MS = 5500

function getNotificationSocketUrl() {
  const configuredSignalingUrl = import.meta.env.VITE_SIGNALING_URL
  if (configuredSignalingUrl) {
    const url = new URL(configuredSignalingUrl, window.location.origin)
    if (/\/signaling\/?$/.test(url.pathname)) {
      url.pathname = url.pathname.replace(/\/signaling\/?$/, '/notifications/stream')
      return url.toString()
    }
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (
    import.meta.env.PROD
      ? 'https://doctordirect-app.onrender.com/api/v1'
      : 'http://localhost:5001/api/v1'
  )
  const url = new URL(apiBaseUrl, window.location.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/notifications/stream`
  url.search = ''
  url.hash = ''
  return url.toString()
}

function normalizeNotification(value: unknown): NotificationItem | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (
    typeof raw.id !== 'string' ||
    typeof raw.type !== 'string' ||
    typeof raw.title !== 'string' ||
    typeof raw.message !== 'string'
  ) return null

  return {
    id: raw.id,
    type: raw.type,
    title: raw.title,
    message: raw.message,
    created_at: typeof raw.created_at === 'string' ? raw.created_at : new Date().toISOString(),
    is_read: raw.is_read === true,
    recipient_user_id: typeof raw.recipient_user_id === 'string' ? raw.recipient_user_id : undefined,
    appointment_id: typeof raw.appointment_id === 'string' ? raw.appointment_id : null,
    consultation_id: typeof raw.consultation_id === 'string' ? raw.consultation_id : null,
    prescription_id: typeof raw.prescription_id === 'string' ? raw.prescription_id : null,
    doctor_id: typeof raw.doctor_id === 'string' ? raw.doctor_id : null,
    read_at: typeof raw.read_at === 'string' ? raw.read_at : null,
  }
}

export function RealtimeNotifications() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((state) => state.auth.user)
  const activeBanner = useAppSelector((state) => state.notifications.activeBanner)
  const activeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const userId = user?.id
    if (!userId) {
      dispatch(clearNotifications())
      return
    }

    let active = true
    let initialized = false
    let syncing = false
    let connecting = false
    let hasLoggedSyncFailure = false
    let reconnectAttempt = 0
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let syncTimer: ReturnType<typeof setInterval> | null = null
    let pingTimer: ReturnType<typeof setInterval> | null = null
    let socket: WebSocket | null = null
    const seenIds = new Set<string>()
    dispatch(clearNotifications())

    const sync = async () => {
      if (!active || syncing) return
      syncing = true
      try {
        const [items, unreadCount] = await Promise.all([
          api.notifications(),
          api.unreadNotificationCount(),
        ])
        if (!active) return
        const newItems: NotificationItem[] = []
        for (const rawItem of items) {
          const item = normalizeNotification(rawItem)
          if (!item) continue
          if (initialized && !seenIds.has(item.id) && !item.is_read) newItems.push(item)
          seenIds.add(item.id)
        }
        dispatch(syncNotifications({
          items: items.map(normalizeNotification).filter((item): item is NotificationItem => item !== null),
          unreadCount,
        }))
        for (const item of newItems) {
          dispatch(receiveNotification(item))
          dispatch(showNotificationBanner(item))
        }
        initialized = true
        hasLoggedSyncFailure = false
      } catch {
        if (!hasLoggedSyncFailure) {
          console.warn('[Notifications] Live sync failed; will retry automatically.')
          hasLoggedSyncFailure = true
        }
      } finally {
        syncing = false
      }
    }

    const connect = async () => {
      if (!active || connecting || socket?.readyState === WebSocket.CONNECTING || socket?.readyState === WebSocket.OPEN) return
      connecting = true
      try {
        const { data, error } = await getSupabaseClient().auth.getSession()
        if (error) throw error
        const token = data.session?.access_token
        if (!active || !token) return

        const nextSocket = new WebSocket(getNotificationSocketUrl(), ['dd-auth', token])
        socket = nextSocket
        nextSocket.onopen = () => {
          reconnectAttempt = 0
          if (pingTimer) clearInterval(pingTimer)
          pingTimer = setInterval(() => {
            if (nextSocket.readyState === WebSocket.OPEN) {
              nextSocket.send(JSON.stringify({ type: 'ping' }))
            }
          }, 25_000)
        }
        nextSocket.onmessage = (event) => {
          try {
            const message = JSON.parse(String(event.data)) as { type?: string; notification?: unknown; id?: string }
            if (message.type === 'notification') {
              const item = normalizeNotification(message.notification)
              if (!item) return
              const isNew = !seenIds.has(item.id)
              seenIds.add(item.id)
              dispatch(receiveNotification(item))
              if (isNew && !item.is_read) dispatch(showNotificationBanner(item))
            } else if (message.type === 'notification_read' && typeof message.id === 'string') {
              dispatch(markNotificationRead(message.id))
            } else if (message.type === 'notifications_read_all') {
              void sync()
            }
          } catch {
            console.warn('[Notifications] Ignored an unreadable live notification event.')
          }
        }
        nextSocket.onclose = () => {
          if (pingTimer) {
            clearInterval(pingTimer)
            pingTimer = null
          }
          if (socket === nextSocket) socket = null
          if (!active) return
          const delay = Math.min(1000 * (2 ** reconnectAttempt), 10_000)
          reconnectAttempt += 1
          reconnectTimer = setTimeout(() => void connect(), delay)
        }
        nextSocket.onerror = () => nextSocket.close()
      } catch {
        if (!active) return
        console.warn('[Notifications] Live connection could not be opened; polling remains active.')
        const delay = Math.min(1000 * (2 ** reconnectAttempt), 10_000)
        reconnectAttempt += 1
        reconnectTimer = setTimeout(() => void connect(), delay)
      } finally {
        connecting = false
      }
    }

    void sync().then(() => { if (active) void connect() })
    syncTimer = setInterval(() => { void sync() }, SYNC_INTERVAL_MS)

    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      void sync()
      if (!socket || socket.readyState === WebSocket.CLOSED) void connect()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      active = false
      if (syncTimer) clearInterval(syncTimer)
      if (pingTimer) clearInterval(pingTimer)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      document.removeEventListener('visibilitychange', handleVisibility)
      if (socket) {
        socket.onclose = null
        socket.close()
        socket = null
      }
      if (activeTimer.current) clearTimeout(activeTimer.current)
    }
  }, [dispatch, user?.id])

  useEffect(() => {
    if (activeTimer.current) clearTimeout(activeTimer.current)
    if (!activeBanner) return
    activeTimer.current = setTimeout(() => dispatch(dismissNotificationBanner()), AUTO_DISMISS_MS)
    return () => {
      if (activeTimer.current) clearTimeout(activeTimer.current)
    }
  }, [activeBanner, dispatch])

  if (!activeBanner) return null

  const openNotifications = async () => {
    try {
      await api.markNotificationRead(activeBanner.id)
      dispatch(markNotificationRead(activeBanner.id))
    } catch {
      console.warn('[Notifications] Could not mark notification as read.')
    }
    navigate(`/${user?.role ?? 'patient'}/notifications`)
    dispatch(dismissNotificationBanner())
  }

  return (
    <aside className="notification-toast" aria-live="polite">
      <button className="notification-toast__content" type="button" onClick={() => void openNotifications()}>
        <span className="notification-toast__icon"><Bell size={17} /></span>
        <span className="notification-toast__text">
          <strong>{activeBanner.title}</strong>
          <span>{activeBanner.message}</span>
        </span>
      </button>
      <button
        className="notification-toast__close"
        type="button"
        aria-label="Dismiss notification"
        onClick={() => dispatch(dismissNotificationBanner())}
      >
        <X size={17} />
      </button>
    </aside>
  )
}
