import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Notification, RawNotification } from '../../types/notification';
import { normalizeNotification } from '../../types/notification';
import {
  fetchNotifications, fetchUnreadNotificationCount, markAllNotificationsReadApi, markNotificationReadApi,
} from '../../services/notifications/notificationService';

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationState = { items: [], unreadCount: 0, isLoading: false, error: null };

const message = (error: any, fallback: string) => error?.response?.data?.error || fallback;

export const loadNotifications = createAsyncThunk('notification/load', async (_, { rejectWithValue }) => {
  try { return (await fetchNotifications()).data.notifications.map(normalizeNotification); }
  catch (error: any) { return rejectWithValue(message(error, 'Unable to load notifications')); }
});

export const loadUnreadNotificationCount = createAsyncThunk('notification/count', async (_, { rejectWithValue }) => {
  try { return (await fetchUnreadNotificationCount()).data.unreadCount; }
  catch (error: any) { return rejectWithValue(message(error, 'Unable to load unread notification count')); }
});

export const markNotificationRead = createAsyncThunk('notification/read', async (id: string, { rejectWithValue }) => {
  try { return normalizeNotification((await markNotificationReadApi(id)).data.notification); }
  catch (error: any) { return rejectWithValue(message(error, 'Unable to mark notification as read')); }
});

export const markAllNotificationsRead = createAsyncThunk('notification/readAll', async (_, { rejectWithValue }) => {
  try { return (await markAllNotificationsReadApi()).data.updatedCount; }
  catch (error: any) { return rejectWithValue(message(error, 'Unable to mark notifications as read')); }
});

const notificationSlice = createSlice({
  name: 'notification', initialState,
  reducers: {
    clearNotifications(state) { state.items = []; state.unreadCount = 0; state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadNotifications.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(loadNotifications.fulfilled, (state, action) => {
        state.isLoading = false; state.items = action.payload;
        state.unreadCount = action.payload.filter((item) => !item.isRead).length;
      })
      .addCase(loadNotifications.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(loadUnreadNotificationCount.fulfilled, (state, action) => { state.unreadCount = action.payload; })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0 && !state.items[index].isRead) state.unreadCount = Math.max(0, state.unreadCount - 1);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((item) => { item.isRead = true; item.readAt = item.readAt || new Date().toISOString(); });
        state.unreadCount = 0;
      });
  },
});

export const { clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
