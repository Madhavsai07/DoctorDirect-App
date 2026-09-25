-- DoctorDirect Milestone 2: Schema Hardening Rollback
-- Migration: 002_schema_hardening_down.sql

-- 1. Rollback sync_metadata additions
DROP INDEX IF EXISTS idx_sync_metadata_deleted;
ALTER TABLE sync_metadata DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE sync_metadata DROP COLUMN IF EXISTS is_deleted;

-- 2. Rollback RESTRICT foreign keys back to CASCADE
ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_consultation_id_fkey;
ALTER TABLE prescriptions ADD CONSTRAINT prescriptions_consultation_id_fkey
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE;

ALTER TABLE summaries DROP CONSTRAINT IF EXISTS summaries_consultation_id_fkey;
ALTER TABLE summaries ADD CONSTRAINT summaries_consultation_id_fkey
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE;

ALTER TABLE transcripts DROP CONSTRAINT IF EXISTS transcripts_consultation_id_fkey;
ALTER TABLE transcripts ADD CONSTRAINT transcripts_consultation_id_fkey
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE;

ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_appointment_id_fkey;
ALTER TABLE consultations ADD CONSTRAINT consultations_appointment_id_fkey
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE;

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;
ALTER TABLE appointments ADD CONSTRAINT appointments_doctor_id_fkey
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE;

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;
ALTER TABLE appointments ADD CONSTRAINT appointments_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_user_id_fkey;
ALTER TABLE doctors ADD CONSTRAINT doctors_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_user_id_fkey;
ALTER TABLE patients ADD CONSTRAINT patients_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. Rollback partial unique index to full unique constraint
DROP INDEX IF EXISTS uq_active_slot_appointment;
ALTER TABLE appointments ADD CONSTRAINT appointments_slot_id_key UNIQUE (slot_id);
