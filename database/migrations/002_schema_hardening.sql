-- DoctorDirect Milestone 2: Schema Hardening Migration
-- Migration: 002_schema_hardening.sql

-- ============================================================================
-- 1. Appointments: Replace permanent UNIQUE(slot_id) with Partial Unique Index
--    Allows historical cancelled or rescheduled appointments to retain the slot_id
--    reference, while strictly preventing duplicate ACTIVE bookings on the same slot.
-- ============================================================================
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_slot_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_slot_appointment
  ON appointments(slot_id)
  WHERE status NOT IN ('cancelled', 'rescheduled');

-- ============================================================================
-- 2. Medical Record Deletion Protection: Change CASCADE to RESTRICT
--    Ensures historical appointments, consultations, transcripts, summaries,
--    and prescriptions cannot be purged if a user, patient, or doctor is deleted.
--    User deactivation should occur via soft-delete (users.is_active = FALSE).
-- ============================================================================

-- A. Patients: Prevent deleting user if patient profile exists with records
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_user_id_fkey;
ALTER TABLE patients ADD CONSTRAINT patients_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- B. Doctors: Prevent deleting user if doctor profile exists with records
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_user_id_fkey;
ALTER TABLE doctors ADD CONSTRAINT doctors_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- C. Appointments: Protect historical appointments from patient/doctor deletion
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;
ALTER TABLE appointments ADD CONSTRAINT appointments_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT;

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;
ALTER TABLE appointments ADD CONSTRAINT appointments_doctor_id_fkey
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT;

-- D. Consultations: Protect consultation records from appointment deletion
ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_appointment_id_fkey;
ALTER TABLE consultations ADD CONSTRAINT consultations_appointment_id_fkey
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE RESTRICT;

-- E. Transcripts: Protect STT transcripts from consultation deletion
ALTER TABLE transcripts DROP CONSTRAINT IF EXISTS transcripts_consultation_id_fkey;
ALTER TABLE transcripts ADD CONSTRAINT transcripts_consultation_id_fkey
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE RESTRICT;

-- F. Summaries: Protect clinical summaries from consultation deletion
ALTER TABLE summaries DROP CONSTRAINT IF EXISTS summaries_consultation_id_fkey;
ALTER TABLE summaries ADD CONSTRAINT summaries_consultation_id_fkey
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE RESTRICT;

-- G. Prescriptions: Protect legal prescriptions from consultation deletion
ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_consultation_id_fkey;
ALTER TABLE prescriptions ADD CONSTRAINT prescriptions_consultation_id_fkey
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE RESTRICT;

-- ============================================================================
-- 3. Sync Metadata: Add Tombstone Flags for Offline Synchronization
--    Enables delta synchronization to identify deleted/invalidated entities.
-- ============================================================================
ALTER TABLE sync_metadata
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sync_metadata_deleted
  ON sync_metadata(user_id, is_deleted);
