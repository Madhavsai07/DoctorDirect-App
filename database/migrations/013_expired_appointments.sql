ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN (
    'booked',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'expired',
    'rescheduled',
    'no_show'
  ));

DROP INDEX IF EXISTS uq_active_slot_appointment;

UPDATE appointments
SET status = 'expired',
    updated_at = NOW()
WHERE status = 'cancelled'
  AND cancellation_reason LIKE 'Automatically cancelled because the consultation was not completed%';

CREATE UNIQUE INDEX uq_active_slot_appointment
  ON appointments(slot_id)
  WHERE status NOT IN ('cancelled', 'expired', 'rescheduled');
