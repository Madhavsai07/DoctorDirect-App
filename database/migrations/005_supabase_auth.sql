-- Link DoctorDirect users to Supabase Auth without storing credentials locally.
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id
  ON users(auth_user_id)
  WHERE auth_user_id IS NOT NULL;
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;