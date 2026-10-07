-- Remove only the development accounts inserted by the old seed scripts.
-- Keep any account with clinical history so protected medical records remain intact.

UPDATE users
SET is_active = FALSE
WHERE email IN (
  'dev.doctor@doctordirect.com',
  'dev.patient@doctordirect.com',
  'dr.vikram.patel@doctordirect.com',
  'dr.priya.nair@doctordirect.com',
  'dr.arjun.mehta@doctordirect.com',
  'dr.sneha.kulkarni@doctordirect.com',
  'dr.rajesh.gupta@doctordirect.com',
  'dr.ananya.reddy@doctordirect.com'
);

DELETE FROM doctors d
USING users u
WHERE d.user_id = u.id
  AND u.email IN (
    'dev.doctor@doctordirect.com',
    'dr.vikram.patel@doctordirect.com',
    'dr.priya.nair@doctordirect.com',
    'dr.arjun.mehta@doctordirect.com',
    'dr.sneha.kulkarni@doctordirect.com',
    'dr.rajesh.gupta@doctordirect.com',
    'dr.ananya.reddy@doctordirect.com'
  )
  AND NOT EXISTS (
    SELECT 1 FROM appointments a WHERE a.doctor_id = d.id
  );

DELETE FROM patients p
USING users u
WHERE p.user_id = u.id
  AND u.email = 'dev.patient@doctordirect.com'
  AND NOT EXISTS (
    SELECT 1 FROM appointments a WHERE a.patient_id = p.id
  );

DELETE FROM users u
WHERE u.email IN (
  'dev.doctor@doctordirect.com',
  'dev.patient@doctordirect.com',
  'dr.vikram.patel@doctordirect.com',
  'dr.priya.nair@doctordirect.com',
  'dr.arjun.mehta@doctordirect.com',
  'dr.sneha.kulkarni@doctordirect.com',
  'dr.rajesh.gupta@doctordirect.com',
  'dr.ananya.reddy@doctordirect.com'
)
  AND NOT EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM patients p WHERE p.user_id = u.id)
  AND NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.recipient_user_id = u.id
  );
