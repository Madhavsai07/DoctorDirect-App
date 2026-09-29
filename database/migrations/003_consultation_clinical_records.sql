-- ============================================================================
-- 003_consultation_clinical_records.sql
-- Milestone 7: Consultation / Visit Clinical Management Schema Enhancement
-- ============================================================================

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS symptoms TEXT,
  ADD COLUMN IF NOT EXISTS diagnosis TEXT,
  ADD COLUMN IF NOT EXISTS clinical_notes TEXT,
  ADD COLUMN IF NOT EXISTS treatment_plan TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_instructions TEXT,
  ADD COLUMN IF NOT EXISTS prescription TEXT;
