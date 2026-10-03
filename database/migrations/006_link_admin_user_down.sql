-- Rollback migration 006: Remove admin user link
-- Deletes the admin user created by migration 006.

DELETE FROM users
WHERE email = 'madhavsaikiran2007@gmail.com'
  AND auth_user_id = 'ab7e4911-79f2-4587-b830-699377b285fd';
