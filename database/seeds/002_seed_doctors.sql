-- DoctorDirect Milestone 5: Rich Doctor Discovery Seed Data
-- Adds doctors across all specializations with availability and slots

-- 1. Insert Doctors as Users
INSERT INTO users (id, email, phone, password_hash, role, first_name, last_name) VALUES
  ('22222222-2222-2222-2222-222222222203', 'dr.vikram.patel@doctordirect.local', '+919876543221', '$2b$10$devHashDoctorDirectTestOnlyDoNotUseInProd', 'doctor', 'Vikram', 'Patel'),
  ('22222222-2222-2222-2222-222222222204', 'dr.priya.nair@doctordirect.local', '+919876543222', '$2b$10$devHashDoctorDirectTestOnlyDoNotUseInProd', 'doctor', 'Priya', 'Nair'),
  ('22222222-2222-2222-2222-222222222205', 'dr.arjun.mehta@doctordirect.local', '+919876543223', '$2b$10$devHashDoctorDirectTestOnlyDoNotUseInProd', 'doctor', 'Arjun', 'Mehta'),
  ('22222222-2222-2222-2222-222222222206', 'dr.sneha.kulkarni@doctordirect.local', '+919876543224', '$2b$10$devHashDoctorDirectTestOnlyDoNotUseInProd', 'doctor', 'Sneha', 'Kulkarni'),
  ('22222222-2222-2222-2222-222222222207', 'dr.rajesh.gupta@doctordirect.local', '+919876543225', '$2b$10$devHashDoctorDirectTestOnlyDoNotUseInProd', 'doctor', 'Rajesh', 'Gupta'),
  ('22222222-2222-2222-2222-222222222208', 'dr.ananya.reddy@doctordirect.local', '+919876543226', '$2b$10$devHashDoctorDirectTestOnlyDoNotUseInProd', 'doctor', 'Ananya', 'Reddy')
ON CONFLICT (email) DO NOTHING;

-- 2. Insert Doctor Profiles
INSERT INTO doctors (id, user_id, specialization_id, license_number, experience_years, consultation_fee, bio, qualification, is_available, rating) VALUES
  (
    '33333333-3333-3333-3333-333333333302',
    '22222222-2222-2222-2222-222222222203',
    '11111111-1111-1111-1111-111111111101', -- General Medicine
    'MCI-2012-44123',
    12,
    500.00,
    'Experienced family physician providing comprehensive primary care, chronic condition management, and preventive health screenings.',
    'MBBS, MD (Internal Medicine)',
    TRUE,
    4.85
  ),
  (
    '33333333-3333-3333-3333-333333333303',
    '22222222-2222-2222-2222-222222222204',
    '11111111-1111-1111-1111-111111111103', -- Dermatology
    'MCI-2017-99234',
    7,
    650.00,
    'Consultant Dermatologist specializing in clinical dermatology, acne treatments, hair disorders, and aesthetic consultations.',
    'MBBS, DVD, DNB (Dermatology)',
    TRUE,
    4.92
  ),
  (
    '33333333-3333-3333-3333-333333333304',
    '22222222-2222-2222-2222-222222222205',
    '11111111-1111-1111-1111-111111111104', -- Pediatrics
    'MCI-2010-33821',
    14,
    600.00,
    'Dedicated pediatrician with a focus on newborn care, child development milestones, vaccinations, and pediatric nutrition.',
    'MBBS, MD (Pediatrics), DCH',
    TRUE,
    4.95
  ),
  (
    '33333333-3333-3333-3333-333333333305',
    '22222222-2222-2222-2222-222222222206',
    '11111111-1111-1111-1111-111111111105', -- Neurology
    'MCI-2008-11234',
    16,
    950.00,
    'Senior Neurologist with expertise in headache disorders, epilepsy management, stroke rehabilitation, and peripheral neuropathies.',
    'MBBS, MD, DM (Neurology)',
    TRUE,
    4.88
  ),
  (
    '33333333-3333-3333-3333-333333333306',
    '22222222-2222-2222-2222-222222222207',
    '11111111-1111-1111-1111-111111111106', -- Orthopedics
    'MCI-2014-77621',
    10,
    800.00,
    'Orthopedic surgeon specializing in sports injuries, joint preservation, back pain evaluation, and arthritis care.',
    'MBBS, MS (Orthopedics)',
    TRUE,
    4.80
  ),
  (
    '33333333-3333-3333-3333-333333333307',
    '22222222-2222-2222-2222-222222222208',
    '11111111-1111-1111-1111-111111111102', -- Cardiology
    'MCI-2018-55442',
    6,
    700.00,
    'Cardiologist focusing on hypertension management, lipid disorders, cardiac stress testing, and preventive cardiology lifestyle counseling.',
    'MBBS, MD, DNB (Cardiology)',
    TRUE,
    4.78
  )
ON CONFLICT (license_number) DO NOTHING;

-- 3. Insert Availability Windows for New Doctors
INSERT INTO availability (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active) VALUES
  -- Dr. Vikram Patel (General Med): Mon (1), Wed (3), Fri (5) 10:00 - 14:00
  ('33333333-3333-3333-3333-333333333302', 1, '10:00:00', '14:00:00', 30, TRUE),
  ('33333333-3333-3333-3333-333333333302', 3, '10:00:00', '14:00:00', 30, TRUE),
  ('33333333-3333-3333-3333-333333333302', 5, '10:00:00', '14:00:00', 30, TRUE),

  -- Dr. Priya Nair (Dermatology): Tue (2), Thu (4), Sat (6) 11:00 - 15:00
  ('33333333-3333-3333-3333-333333333303', 2, '11:00:00', '15:00:00', 30, TRUE),
  ('33333333-3333-3333-3333-333333333303', 4, '11:00:00', '15:00:00', 30, TRUE),
  ('33333333-3333-3333-3333-333333333303', 6, '10:00:00', '13:00:00', 30, TRUE),

  -- Dr. Arjun Mehta (Pediatrics): Mon (1), Tue (2), Thu (4), Fri (5) 09:00 - 13:00
  ('33333333-3333-3333-3333-333333333304', 1, '09:00:00', '13:00:00', 30, TRUE),
  ('33333333-3333-3333-3333-333333333304', 2, '09:00:00', '13:00:00', 30, TRUE),
  ('33333333-3333-3333-3333-333333333304', 4, '09:00:00', '13:00:00', 30, TRUE),
  ('33333333-3333-3333-3333-333333333304', 5, '09:00:00', '13:00:00', 30, TRUE),

  -- Dr. Sneha Kulkarni (Neurology): Mon (1), Wed (3), Fri (5) 14:00 - 18:00
  ('33333333-3333-3333-3333-333333333305', 1, '14:00:00', '18:00:00', 30, TRUE),
  ('33333333-3333-3333-3333-333333333305', 3, '14:00:00', '18:00:00', 30, TRUE),
  ('33333333-3333-3333-3333-333333333305', 5, '14:00:00', '18:00:00', 30, TRUE),

  -- Dr. Rajesh Gupta (Orthopedics): Tue (2), Thu (4), Sat (6) 09:30 - 13:30
  ('33333333-3333-3333-3333-333333333306', 2, '09:30:00', '13:30:00', 30, TRUE),
  ('33333333-3333-3333-3333-333333333306', 4, '09:30:00', '13:30:00', 30, TRUE),
  ('33333333-3333-3333-3333-333333333306', 6, '09:30:00', '13:30:00', 30, TRUE),

  -- Dr. Ananya Reddy (Cardiology): Mon (1), Tue (2), Wed (3), Fri (5) 15:00 - 19:00
  ('33333333-3333-3333-3333-333333333307', 1, '15:00:00', '19:00:00', 30, TRUE),
  ('33333333-3333-3333-3333-333333333307', 2, '15:00:00', '19:00:00', 30, TRUE),
  ('33333333-3333-3333-3333-333333333307', 3, '15:00:00', '19:00:00', 30, TRUE),
  ('33333333-3333-3333-3333-333333333307', 5, '15:00:00', '19:00:00', 30, TRUE)
ON CONFLICT DO NOTHING;

-- 4. Pre-generate immediate sample slots for today and next 5 days
INSERT INTO slots (doctor_id, date, start_time, end_time, status) VALUES
  ('33333333-3333-3333-3333-333333333301', CURRENT_DATE, '09:00:00', '09:30:00', 'available'),
  ('33333333-3333-3333-3333-333333333301', CURRENT_DATE, '09:30:00', '10:00:00', 'available'),
  ('33333333-3333-3333-3333-333333333301', CURRENT_DATE, '10:00:00', '10:30:00', 'available'),
  ('33333333-3333-3333-3333-333333333301', CURRENT_DATE + INTERVAL '1 day', '09:00:00', '09:30:00', 'available'),
  ('33333333-3333-3333-3333-333333333301', CURRENT_DATE + INTERVAL '1 day', '09:30:00', '10:00:00', 'available'),
  ('33333333-3333-3333-3333-333333333302', CURRENT_DATE, '10:00:00', '10:30:00', 'available'),
  ('33333333-3333-3333-3333-333333333302', CURRENT_DATE, '10:30:00', '11:00:00', 'available'),
  ('33333333-3333-3333-3333-333333333302', CURRENT_DATE + INTERVAL '1 day', '10:00:00', '10:30:00', 'available'),
  ('33333333-3333-3333-3333-333333333303', CURRENT_DATE, '11:00:00', '11:30:00', 'available'),
  ('33333333-3333-3333-3333-333333333303', CURRENT_DATE + INTERVAL '1 day', '11:00:00', '11:30:00', 'available'),
  ('33333333-3333-3333-3333-333333333304', CURRENT_DATE, '09:00:00', '09:30:00', 'available'),
  ('33333333-3333-3333-3333-333333333304', CURRENT_DATE + INTERVAL '1 day', '09:00:00', '09:30:00', 'available'),
  ('33333333-3333-3333-3333-333333333305', CURRENT_DATE, '14:00:00', '14:30:00', 'available'),
  ('33333333-3333-3333-3333-333333333305', CURRENT_DATE + INTERVAL '1 day', '14:00:00', '14:30:00', 'available'),
  ('33333333-3333-3333-3333-333333333306', CURRENT_DATE, '09:30:00', '10:00:00', 'available'),
  ('33333333-3333-3333-3333-333333333306', CURRENT_DATE + INTERVAL '1 day', '09:30:00', '10:00:00', 'available'),
  ('33333333-3333-3333-3333-333333333307', CURRENT_DATE, '15:00:00', '15:30:00', 'available'),
  ('33333333-3333-3333-3333-333333333307', CURRENT_DATE + INTERVAL '1 day', '15:00:00', '15:30:00', 'available')
ON CONFLICT (doctor_id, date, start_time) DO NOTHING;
