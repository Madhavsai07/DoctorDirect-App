-- ============================================================================
-- 003_consultation_clinical_records_down.sql
-- Rollback for Milestone 7 Consultation Schema Enhancement
-- ============================================================================

ALTER TABLE consultations
  DROP COLUMN IF EXISTS symptoms,
  DROP COLUMN IF EXISTS diagnosis,
  DROP COLUMN IF EXISTS clinical_notes,
  DROP COLUMN IF EXISTS treatment_plan,
  DROP COLUMN IF EXISTS follow_up_instructions,
  DROP COLUMN IF EXISTS prescription;
