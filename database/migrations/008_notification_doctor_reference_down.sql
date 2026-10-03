DROP INDEX IF EXISTS idx_notifications_doctor;
ALTER TABLE notifications DROP COLUMN IF EXISTS doctor_id;
