export type NotificationType =
  | 'appointment_booked' | 'appointment_confirmed' | 'appointment_cancelled'
  | 'appointment_rescheduled' | 'consultation_started' | 'consultation_completed'
  | 'prescription_finalized' | 'new_appointment_booked' | 'patient_cancelled'
  | 'upcoming_appointment_reminder';

export interface Notification {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  appointmentId: string | null;
  consultationId: string | null;
  prescriptionId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface RawNotification {
  id: string; recipient_user_id: string; type: NotificationType; title: string; message: string;
  appointment_id: string | null; consultation_id: string | null; prescription_id: string | null;
  is_read: boolean; created_at: string; read_at: string | null;
}

export const normalizeNotification = (item: RawNotification): Notification => ({
  id: item.id, recipientUserId: item.recipient_user_id, type: item.type, title: item.title,
  message: item.message, appointmentId: item.appointment_id, consultationId: item.consultation_id,
  prescriptionId: item.prescription_id, isRead: item.is_read, createdAt: item.created_at, readAt: item.read_at,
});
