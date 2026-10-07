-- Rollback Migration 009: Remove id_card_url column from doctors table

ALTER TABLE doctors
  DROP COLUMN IF EXISTS id_card_url;
