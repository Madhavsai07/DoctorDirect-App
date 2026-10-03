-- Rollback migration 007: Remove doctor verification columns

ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_verified_by_fkey;
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_verification_status_check;
DROP INDEX IF EXISTS idx_doctors_verification_status;
ALTER TABLE doctors DROP COLUMN IF EXISTS verified_by;
ALTER TABLE doctors DROP COLUMN IF EXISTS verified_at;
ALTER TABLE doctors DROP COLUMN IF EXISTS verification_status;
