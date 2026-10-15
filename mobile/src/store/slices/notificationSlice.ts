import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Notification, RawNotification } from '../../types/notification';
import { normalizeNotification } from '../../types/notification';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from '../../services/notifications/notificationService';
import { getApiErrorMessage } from '../../utils/apiError';

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  activeBanner: Notification | null;
  bannerQueue: Notification[];
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  activeBanner: null,
  bannerQueue: [],
};

export const loadNotifications = createAsyncThunk('notification/load', async (_, { rejectWithValue }) => {
  try {
    return (await fetchNotifications()).data.notifications.map(normalizeNotification);
  } catch (error: any) {
    return rejectWithValue(getApiErrorMessage(error, 'Unable to load notifications. Please try again.'));
  }
});

export const loadUnreadNotificationCount = createAsyncThunk('notification/count', async (_, { rejectWithValue }) => {
  try {
    return (await fetchUnreadNotificationCount()).data.unreadCount;
  } catch (error: any) {
    return rejectWithValue(getApiErrorMessage(error, 'Unable to load unread notification count.'));
  }
});

export const markNotificationRead = createAsyncThunk('notification/read', async (id: string, { rejectWithValue }) => {
  try {
    return normalizeNotification((await markNotificationReadApi(id)).data.notification);
  } catch (error: any) {
    return rejectWithValue(getApiErrorMessage(error, 'Unable to update this notification. Please try again.'));
  }
});

export const markAllNotificationsRead = createAsyncThunk('notification/readAll', async (_, { rejectWithValue }) => {
  try {
    return (await markAllNotificationsReadApi()).data.updatedCount;
  } catch (error: any) {
    return rejectWithValue(getApiErrorMessage(error, 'Unable to update notifications. Please try again.'));
  }
});

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearNotifications(state) {
      state.items = [];
      state.unreadCount = 0;
      state.error = null;
      state.activeBanner = null;
      state.bannerQueue = [];
    },

    /**
     * Called when a new notification is received in real-time.
     * Inserts the notification at the head of items and increments unread count if unread.
     */
    notificationReceived(state, action: PayloadAction<Notification>) {
      const incoming = action.payload;
      const existsIndex = state.items.findIndex((item) => item.id === incoming.id);
      if (existsIndex >= 0) {
        state.items[existsIndex] = incoming;
      } else {
        state.items.unshift(incoming);
        if (!incoming.isRead) {
          state.unreadCount += 1;
        }
      }
    },

    /**
     * Quietly syncs items and unread count from background sync without triggering full-page loading indicators.
     */
    syncNotifications(state, action: PayloadAction<{ items: Notification[]; unreadCount: number }>) {
      state.items = action.payload.items;
      state.unreadCount = action.payload.unreadCount;
      state.error = null;
    },

    /**
     * Enqueues or immediately displays an in-app pop-down banner.
     */
    showNotificationBanner(state, action: PayloadAction<Notification>) {
      if (!state.activeBanner) {
        state.activeBanner = action.payload;
      } else if (state.activeBanner.id !== action.payload.id) {
        // Enqueue if not already in queue
        if (!state.bannerQueue.some((item) => item.id === action.payload.id)) {
          state.bannerQueue.push(action.payload);
        }
      }
    },

    /**
     * Dismisses the active pop-down banner and advances the queue.
     */
    dismissNotificationBanner(state) {
      if (state.bannerQueue.length > 0) {
        state.activeBanner = state.bannerQueue.shift()!;
      } else {
        state.activeBanner = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.unreadCount = action.payload.filter((item) => !item.isRead).length;
      })
      .addCase(loadNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(loadUnreadNotificationCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0 && !state.items[index].isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        if (index >= 0) {
          state.items[index] = action.payload;
        }
        if (state.activeBanner?.id === action.payload.id) {
          if (state.bannerQueue.length > 0) {
            state.activeBanner = state.bannerQueue.shift()!;
          } else {
            state.activeBanner = null;
          }
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((item) => {
          item.isRead = true;
          item.readAt = item.readAt || new Date().toISOString();
        });
        state.unreadCount = 0;
        state.activeBanner = null;
        state.bannerQueue = [];
      });
  },
});

export const {
  clearNotifications,
  notificationReceived,
  syncNotifications,
  showNotificationBanner,
  dismissNotificationBanner,
} = notificationSlice.actions;

export default notificationSlice.reducer;
