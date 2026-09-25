-- DoctorDirect Milestone 2: Minimal Development Seed Data
-- For local testing and schema constraint verification only.

-- 1. Insert Specializations
INSERT INTO specializations (id, name, description, icon) VALUES
  ('11111111-1111-1111-1111-111111111101', 'General Medicine', 'Primary care and general health consultations', 'stethoscope'),
  ('11111111-1111-1111-1111-111111111102', 'Cardiology', 'Heart, blood vessels, and cardiovascular health', 'heart-pulse'),
  ('11111111-1111-1111-1111-111111111103', 'Dermatology', 'Skin, hair, and nail conditions', 'spray-can'),
  ('11111111-1111-1111-1111-111111111104', 'Pediatrics', 'Infant, child, and adolescent healthcare', 'baby'),
  ('11111111-1111-1111-1111-111111111105', 'Neurology', 'Brain, spinal cord, and nervous system disorders', 'brain'),
  ('11111111-1111-1111-1111-111111111106', 'Orthopedics', 'Bones, joints, ligaments, and muscular health', 'bone')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Development Test Users (Non-production development accounts)
INSERT INTO users (id, email, phone, password_hash, role, first_name, last_name) VALUES
  ('22222222-2222-2222-2222-222222222201', 'dev.doctor@doctordirect.local', '+919876543210', '$2b$10$devHashDoctorDirectTestOnlyDoNotUseInProd1', 'doctor', 'Aditi', 'Sharma'),
  ('22222222-2222-2222-2222-222222222202', 'dev.patient@doctordirect.local', '+919876543211', '$2b$10$devHashDoctorDirectTestOnlyDoNotUseInProd2', 'patient', 'Rahul', 'Verma')
ON CONFLICT (email) DO NOTHING;

-- 3. Insert Doctor Profile
INSERT INTO doctors (id, user_id, specialization_id, license_number, experience_years, consultation_fee, bio, qualification, is_available, rating) VALUES
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 'MCI-2015-87654', 9, 750.00, 'Senior Cardiologist specializing in preventive heart health and telemedicine.', 'MBBS, MD (Cardiology)', TRUE, 4.90)
ON CONFLICT (license_number) DO NOTHING;

-- 4. Insert Patient Profile
INSERT INTO patients (id, user_id, date_of_birth, gender, blood_group, emergency_contact_name, emergency_contact_phone, medical_history, allergies) VALUES
  ('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222202', '1995-06-15', 'male', 'O+', 'Pooja Verma', '+919876543212', 'Mild asthma in childhood', 'Penicillin')
ON CONFLICT (user_id) DO NOTHING;

-- 5. Insert Doctor Availability (Monday 09:00 - 12:00)
INSERT INTO availability (id, doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active) VALUES
  ('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333301', 1, '09:00:00', '12:00:00', 30, TRUE)
ON CONFLICT DO NOTHING;

-- 6. Insert Test Slot
INSERT INTO slots (id, doctor_id, date, start_time, end_time, status) VALUES
  ('66666666-6666-6666-6666-666666666601', '33333333-3333-3333-3333-333333333301', CURRENT_DATE + INTERVAL '1 day', '09:00:00', '09:30:00', 'available')
ON CONFLICT (doctor_id, date, start_time) DO NOTHING;
