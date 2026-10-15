import { AppState, AppStateStatus } from 'react-native';
import { store } from '../../store';
import {
  notificationReceived,
  showNotificationBanner,
  syncNotifications,
} from '../../store/slices/notificationSlice';
import { authService } from '../auth';
import { fetchNotifications, fetchUnreadNotificationCount } from './notificationService';
import { normalizeNotification, Notification } from '../../types/notification';

function getNotificationWebSocketUrl(): string {
  const signalingUrl = process.env.EXPO_PUBLIC_SIGNALING_URL;
  if (signalingUrl) {
    return signalingUrl.replace(/\/signaling\/?$/, '/notifications/stream');
  }

  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5001/api/v1';
  const wsBase = apiBase.replace(/^http(s)?:\/\//, (_: string, s?: string) => (s ? 'wss://' : 'ws://'));
  return `${wsBase.replace(/\/$/, '')}/notifications/stream`;
}

class RealtimeNotificationManager {
  private socket: WebSocket | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private isDestroyed = false;
  private seenNotificationIds = new Set<string>();
  private isInitialSyncDone = false;
  private isSyncing = false;
  private appStateSubscription: { remove: () => void } | null = null;

  public start() {
    this.isDestroyed = false;
    this.reconnectAttempt = 0;

    // Listen to AppState foreground events to immediately sync
    this.appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        void this.syncOnce();
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
          this.connectWebSocket();
        }
      }
    });

    // Start initial sync and WebSocket connection
    void this.syncOnce();
    this.connectWebSocket();

    // Start background adaptive sync polling every 6 seconds as resilient backup
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      void this.syncOnce();
    }, 6000);
  }

  public stop() {
    this.isDestroyed = true;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // Ignore close errors
      }
      this.socket = null;
    }
    this.seenNotificationIds.clear();
    this.isInitialSyncDone = false;
  }

  /**
   * Performs an unobtrusive background synchronization with the server.
   * Compares incoming notifications against already-seen notifications and triggers
   * live Redux updates + in-app pop-down banners for new arrivals.
   */
  public async syncOnce() {
    if (this.isSyncing) return;
    const state = store.getState();
    if (!state.auth.isAuthenticated) return;

    this.isSyncing = true;
    try {
      const response = await fetchNotifications();
      const rawList = response.data?.notifications ?? [];
      const normalizedList = rawList.map(normalizeNotification);
      const unreadCount = normalizedList.filter((n) => !n.isRead).length;

      if (!this.isInitialSyncDone) {
        // Populate seen set with existing notifications on app start
        for (const item of normalizedList) {
          this.seenNotificationIds.add(item.id);
        }
        this.isInitialSyncDone = true;
        store.dispatch(syncNotifications({ items: normalizedList, unreadCount }));
      } else {
        // Find brand-new notifications not seen yet
        const brandNewItems: Notification[] = [];
        for (const item of normalizedList) {
          if (!this.seenNotificationIds.has(item.id)) {
            this.seenNotificationIds.add(item.id);
            brandNewItems.push(item);
          }
        }

        if (brandNewItems.length > 0) {
          // Push items into state and trigger pop-down banner for the latest new notification
          for (const newItem of brandNewItems) {
            store.dispatch(notificationReceived(newItem));
            if (!newItem.isRead) {
              store.dispatch(showNotificationBanner(newItem));
            }
          }
        }

        store.dispatch(syncNotifications({ items: normalizedList, unreadCount }));
      }
    } catch (err) {
      // Network hiccup; ignore quietly in background sync
    } finally {
      this.isSyncing = false;
    }
  }

  private connectWebSocket() {
    if (this.isDestroyed) return;
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      return;
    }

    void (async () => {
      try {
        const token = await authService.getAccessToken();
        if (!token || this.isDestroyed) return;

        const url = getNotificationWebSocketUrl();
        const ws = new WebSocket(url, ['dd-auth', token]);
        this.socket = ws;

        ws.onopen = () => {
          this.reconnectAttempt = 0;
          if (__DEV__) console.info('[NotificationStream] WebSocket connected.');

          if (this.pingInterval) clearInterval(this.pingInterval);
          this.pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(String(event.data));
            if (data.type === 'notification' && data.notification) {
              const item = normalizeNotification(data.notification);
              const isNew = !this.seenNotificationIds.has(item.id);
              this.seenNotificationIds.add(item.id);

              store.dispatch(notificationReceived(item));
              if (isNew && !item.isRead) {
                store.dispatch(showNotificationBanner(item));
              }
            } else if (data.type === 'notifications_read_all') {
              void this.syncOnce();
            }
          } catch {
            // Ignore malformed message
          }
        };

        ws.onerror = () => {
          // Socket error will trigger onclose
        };

        ws.onclose = () => {
          if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
          }
          this.socket = null;

          if (!this.isDestroyed) {
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempt), 10000);
            this.reconnectAttempt++;
            this.reconnectTimeout = setTimeout(() => {
              this.connectWebSocket();
            }, delay);
          }
        };
      } catch {
        // Error getting token or initiating socket; retry later
      }
    })();
  }
}

export const realtimeNotificationManager = new RealtimeNotificationManager();
