-- ============================================================================
-- 004_notifications.sql
-- Milestone 9: Persistent in-app notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  type VARCHAR(64) NOT NULL,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE RESTRICT,
  consultation_id UUID REFERENCES consultations(id) ON DELETE RESTRICT,
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE RESTRICT,
  -- Stable event identity: makes retries safe while allowing separate events
  -- on the same appointment (booked, confirmed, cancelled, etc.).
  event_key VARCHAR(255) NOT NULL UNIQUE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
  ON notifications (recipient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON notifications (recipient_user_id, created_at DESC)
  WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_appointment
  ON notifications (appointment_id)
  WHERE appointment_id IS NOT NULL;
