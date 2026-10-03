import { PoolClient } from 'pg';
import { pool } from '../db/pool';

export type NotificationType =
  | 'appointment_booked'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'consultation_started'
  | 'consultation_completed'
  | 'prescription_finalized'
  | 'new_appointment_booked'
  | 'patient_cancelled'
  | 'upcoming_appointment_reminder'
  | 'doctor_verification_alert';

export interface DbNotification {
  id: string;
  recipient_user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  appointment_id: string | null;
  consultation_id: string | null;
  prescription_id: string | null;
  doctor_id: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface CreateNotificationDto {
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  eventKey: string;
  appointmentId?: string | null;
  consultationId?: string | null;
  prescriptionId?: string | null;
  doctorId?: string | null;
}

type Executor = Pick<PoolClient, 'query'>;

export class NotificationRepository {
  /** Inserts exactly once. event_key has a database unique constraint for retry safety. */
  async createOnce(dto: CreateNotificationDto, executor: Executor = pool): Promise<DbNotification | null> {
    const result = await executor.query<DbNotification>(
      `INSERT INTO notifications
        (recipient_user_id, type, title, message, appointment_id, consultation_id, prescription_id, doctor_id, event_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (event_key) DO NOTHING
       RETURNING *`,
      [
        dto.recipientUserId, dto.type, dto.title, dto.message,
        dto.appointmentId ?? null, dto.consultationId ?? null,
        dto.prescriptionId ?? null, dto.doctorId ?? null, dto.eventKey,
      ]
    );
    return result.rows[0] ?? null;
  }

  async listForRecipient(userId: string, limit = 50, offset = 0): Promise<DbNotification[]> {
    const result = await pool.query<DbNotification>(
      `SELECT id, recipient_user_id, type, title, message, appointment_id, consultation_id,
              prescription_id, doctor_id, is_read, created_at, read_at
       FROM notifications
       WHERE recipient_user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM notifications WHERE recipient_user_id = $1 AND is_read = FALSE',
      [userId]
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  async markRead(id: string, userId: string): Promise<DbNotification | null> {
    const result = await pool.query<DbNotification>(
      `UPDATE notifications
       SET is_read = TRUE, read_at = COALESCE(read_at, NOW())
       WHERE id = $1 AND recipient_user_id = $2
       RETURNING *`,
      [id, userId]
    );
    return result.rows[0] ?? null;
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE, read_at = NOW()
       WHERE recipient_user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return result.rowCount ?? 0;
  }

  /** Appointments starting within the next 24 hours, used by the in-process reminder job. */
  async findUpcomingDoctorReminders(): Promise<Array<{ appointment_id: string; doctor_user_id: string; slot_date: string }>> {
    const result = await pool.query<{ appointment_id: string; doctor_user_id: string; slot_date: string }>(
      `SELECT a.id AS appointment_id, u.id AS doctor_user_id, s.date::text AS slot_date
       FROM appointments a
       JOIN slots s ON a.slot_id = s.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE a.status IN ('booked', 'confirmed')
         AND (s.date::timestamp + s.start_time) BETWEEN NOW() AND NOW() + INTERVAL '24 hours'`
    );
    return result.rows;
  }
}

export const notificationRepository = new NotificationRepository();
