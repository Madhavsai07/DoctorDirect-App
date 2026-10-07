-- Allow deleting a user to remove all records owned by that user and all
-- dependent scheduling, appointment, consultation, and notification records.

ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_user_id_fkey;
ALTER TABLE patients
  ADD CONSTRAINT patients_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_user_id_fkey;
ALTER TABLE doctors
  ADD CONSTRAINT doctors_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_doctor_id_fkey
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE;

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_slot_id_fkey;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_slot_id_fkey
  FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE;

ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_appointment_id_fkey;
ALTER TABLE consultations
  ADD CONSTRAINT consultations_appointment_id_fkey
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE;

ALTER TABLE transcripts DROP CONSTRAINT IF EXISTS transcripts_consultation_id_fkey;
ALTER TABLE transcripts
  ADD CONSTRAINT transcripts_consultation_id_fkey
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE;

ALTER TABLE summaries DROP CONSTRAINT IF EXISTS summaries_consultation_id_fkey;
ALTER TABLE summaries
  ADD CONSTRAINT summaries_consultation_id_fkey
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE;

ALTER TABLE summaries DROP CONSTRAINT IF EXISTS summaries_approved_by_fkey;
ALTER TABLE summaries
  ADD CONSTRAINT summaries_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES doctors(id) ON DELETE CASCADE;

ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_consultation_id_fkey;
ALTER TABLE prescriptions
  ADD CONSTRAINT prescriptions_consultation_id_fkey
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE;

ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_doctor_id_fkey;
ALTER TABLE prescriptions
  ADD CONSTRAINT prescriptions_doctor_id_fkey
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE;

ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_patient_id_fkey;
ALTER TABLE prescriptions
  ADD CONSTRAINT prescriptions_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_recipient_user_id_fkey;
ALTER TABLE notifications
  ADD CONSTRAINT notifications_recipient_user_id_fkey
  FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_appointment_id_fkey;
ALTER TABLE notifications
  ADD CONSTRAINT notifications_appointment_id_fkey
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_consultation_id_fkey;
ALTER TABLE notifications
  ADD CONSTRAINT notifications_consultation_id_fkey
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_prescription_id_fkey;
ALTER TABLE notifications
  ADD CONSTRAINT notifications_prescription_id_fkey
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE;

-- Remove the specific demo doctor previously shown as "Dr. Doctor 02".
DELETE FROM users u
WHERE LOWER(u.email) = 'doctor02@gmail.com'
   OR EXISTS (
     SELECT 1
     FROM doctors d
     WHERE d.user_id = u.id
       AND (
         d.license_number = 'MD-987654-CA'
         OR EXISTS (
           SELECT 1
           FROM users profile_user
           WHERE profile_user.id = d.user_id
             AND LOWER(profile_user.first_name) = 'doctor'
             AND LOWER(profile_user.last_name) = '02'
         )
       )
   );
