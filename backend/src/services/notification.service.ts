import { PoolClient } from 'pg';
import {
  CreateNotificationDto,
  DbNotification,
  NotificationType,
  notificationRepository,
} from '../repositories/notification.repository';
import { notificationSocketServer } from '../notifications-socket';

export interface NotificationInput extends Omit<CreateNotificationDto, 'eventKey'> {
  /** A deterministic event identity, e.g. appointment-confirmed:<appointment UUID>. */
  eventKey: string;
}

export class NotificationService {
  async createOnce(input: NotificationInput, client?: PoolClient): Promise<DbNotification | null> {
    const created = await notificationRepository.createOnce(input, client);
    if (created) {
      // If running inside an explicit database transaction, schedule the push
      // right after current microtasks so that the transaction has committed.
      if (client) {
        setImmediate(() => notificationSocketServer.broadcastNotification(created));
      } else {
        notificationSocketServer.broadcastNotification(created);
      }
    }
    return created;
  }

  async list(userId: string, rawLimit?: unknown, rawOffset?: unknown): Promise<DbNotification[]> {
    const limit = Math.min(Math.max(Number(rawLimit) || 50, 1), 100);
    const offset = Math.max(Number(rawOffset) || 0, 0);
    return notificationRepository.listForRecipient(userId, limit, offset);
  }

  async unreadCount(userId: string): Promise<number> {
    return notificationRepository.getUnreadCount(userId);
  }

  async markRead(id: string, userId: string): Promise<DbNotification> {
    const notification = await notificationRepository.markRead(id, userId);
    if (!notification) {
      throw Object.assign(new Error('Notification not found'), { status: 404 });
    }
    notificationSocketServer.broadcastRead(userId, id);
    return notification;
  }

  async markAllRead(userId: string): Promise<number> {
    const count = await notificationRepository.markAllRead(userId);
    if (count > 0) {
      notificationSocketServer.broadcastReadAll(userId);
    }
    return count;
  }

  /** Creates one reminder per appointment/day; safe to call repeatedly. */
  async createUpcomingAppointmentReminders(): Promise<void> {
    const upcoming = await notificationRepository.findUpcomingDoctorReminders();
    await Promise.all(upcoming.map((appointment) => this.createOnce({
      recipientUserId: appointment.doctor_user_id,
      type: 'upcoming_appointment_reminder',
      title: 'Upcoming appointment reminder',
      message: 'You have an appointment scheduled within the next 24 hours.',
      appointmentId: appointment.appointment_id,
      eventKey: `upcoming-reminder-doctor:${appointment.appointment_id}:${appointment.slot_date}`,
    })));
  }
}

export const notificationService = new NotificationService();
export type { NotificationType };
