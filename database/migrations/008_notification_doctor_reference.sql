-- ============================================================================
-- 008_notification_doctor_reference.sql
-- Add doctor_id reference to notifications table for admin verification alerts
-- ============================================================================

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_doctor
  ON notifications (doctor_id)
  WHERE doctor_id IS NOT NULL;
