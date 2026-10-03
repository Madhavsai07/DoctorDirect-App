-- Migration 007: Doctor verification status for admin approval workflow.
-- New doctors default to 'pending'; admin can approve or reject.

-- 1. Add verification columns to doctors
ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verified_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by         UUID;

-- 2. Constraint: verification_status must be one of pending/approved/rejected
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'doctors_verification_status_check'
  ) THEN
    ALTER TABLE doctors
      ADD CONSTRAINT doctors_verification_status_check
      CHECK (verification_status IN ('pending', 'approved', 'rejected'));
  END IF;
END
$$;

-- 3. FK: verified_by references users (the admin who approved/rejected)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'doctors_verified_by_fkey'
  ) THEN
    ALTER TABLE doctors
      ADD CONSTRAINT doctors_verified_by_fkey
      FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- 4. Index for efficient admin queries on verification_status
CREATE INDEX IF NOT EXISTS idx_doctors_verification_status ON doctors(verification_status);

-- 5. Mark all existing doctors as 'approved' so current data keeps working
UPDATE doctors SET verification_status = 'approved'
WHERE verification_status = 'pending';
