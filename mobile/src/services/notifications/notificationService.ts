import apiClient from '../api/apiClient';
import type { RawNotification } from '../../types/notification';

export const fetchNotifications = () =>
  apiClient.get<{ notifications: RawNotification[] }>('/notifications');

export const fetchUnreadNotificationCount = () =>
  apiClient.get<{ unreadCount: number }>('/notifications/unread-count');

export const markNotificationReadApi = (id: string) =>
  apiClient.patch<{ notification: RawNotification }>(`/notifications/${id}/read`);

export const markAllNotificationsReadApi = () =>
  apiClient.patch<{ updatedCount: number }>('/notifications/read-all');
