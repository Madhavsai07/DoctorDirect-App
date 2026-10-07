-- Migration 009: Add id_card_url column to doctors table
-- Stores the uploaded Government ID card image URI for doctor verification

ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS id_card_url TEXT DEFAULT NULL;
