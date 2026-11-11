import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { NotificationItem } from '@/api/services'

interface NotificationState {
  items: NotificationItem[]
  unreadCount: number
  activeBanner: NotificationItem | null
  bannerQueue: NotificationItem[]
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  activeBanner: null,
  bannerQueue: [],
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications() {
      return initialState
    },
    syncNotifications(state, action: PayloadAction<{ items: NotificationItem[]; unreadCount: number }>) {
      state.items = action.payload.items
      state.unreadCount = action.payload.unreadCount
    },
    receiveNotification(state, action: PayloadAction<NotificationItem>) {
      const incoming = action.payload
      const existingIndex = state.items.findIndex((item) => item.id === incoming.id)
      if (existingIndex >= 0) {
        state.items[existingIndex] = incoming
      } else {
        state.items.unshift(incoming)
        if (!incoming.is_read) state.unreadCount += 1
      }
    },
    showNotificationBanner(state, action: PayloadAction<NotificationItem>) {
      const notification = action.payload
      if (!state.activeBanner) {
        state.activeBanner = notification
      } else if (
        state.activeBanner.id !== notification.id &&
        !state.bannerQueue.some((item) => item.id === notification.id)
      ) {
        state.bannerQueue.push(notification)
      }
    },
    dismissNotificationBanner(state) {
      state.activeBanner = state.bannerQueue.shift() ?? null
    },
    markNotificationRead(state, action: PayloadAction<string>) {
      const item = state.items.find((notification) => notification.id === action.payload)
      if (item && !item.is_read) {
        item.is_read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
      if (state.activeBanner?.id === action.payload) {
        state.activeBanner = state.bannerQueue.shift() ?? null
      } else {
        state.bannerQueue = state.bannerQueue.filter((notification) => notification.id !== action.payload)
      }
    },
    markAllNotificationsRead(state) {
      state.items = state.items.map((item) => ({ ...item, is_read: true }))
      state.unreadCount = 0
      state.activeBanner = null
      state.bannerQueue = []
    },
  },
})

export const {
  clearNotifications,
  syncNotifications,
  receiveNotification,
  showNotificationBanner,
  dismissNotificationBanner,
  markNotificationRead,
  markAllNotificationsRead,
} = notificationSlice.actions

export default notificationSlice.reducer
