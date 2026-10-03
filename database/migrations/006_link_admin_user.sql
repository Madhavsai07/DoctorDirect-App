-- Migration 006: Insert admin user linked to Supabase Auth
-- Links Supabase Auth user ab7e4911-79f2-4587-b830-699377b285fd as admin.
-- Idempotent: skips if the auth_user_id or email already exists.

INSERT INTO users (email, role, first_name, last_name, auth_user_id)
VALUES (
  'madhavsaikiran2007@gmail.com',
  'admin',
  'Admin',
  'User',
  'ab7e4911-79f2-4587-b830-699377b285fd'
)
ON CONFLICT (email) DO UPDATE
  SET auth_user_id = EXCLUDED.auth_user_id,
      role         = EXCLUDED.role,
      updated_at   = CURRENT_TIMESTAMP;
