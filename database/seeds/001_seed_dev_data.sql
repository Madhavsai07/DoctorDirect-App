-- DoctorDirect specialization catalog.

INSERT INTO specializations (id, name, description, icon) VALUES
  ('11111111-1111-1111-1111-111111111101', 'General Medicine', 'Primary care and general health consultations', 'stethoscope'),
  ('11111111-1111-1111-1111-111111111102', 'Cardiology', 'Heart, blood vessels, and cardiovascular health', 'heart-pulse'),
  ('11111111-1111-1111-1111-111111111103', 'Dermatology', 'Skin, hair, and nail conditions', 'spray-can'),
  ('11111111-1111-1111-1111-111111111104', 'Pediatrics', 'Infant, child, and adolescent healthcare', 'baby'),
  ('11111111-1111-1111-1111-111111111105', 'Neurology', 'Brain, spinal cord, and nervous system disorders', 'brain'),
  ('11111111-1111-1111-1111-111111111106', 'Orthopedics', 'Bones, joints, ligaments, and muscular health', 'bone')
ON CONFLICT (name) DO NOTHING;
