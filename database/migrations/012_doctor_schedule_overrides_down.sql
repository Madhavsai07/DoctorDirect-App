DROP TABLE IF EXISTS schedule_date_override_windows;
DROP TABLE IF EXISTS schedule_date_overrides;

ALTER TABLE slots
  DROP COLUMN IF EXISTS is_manual_override;

ALTER TABLE availability
  DROP CONSTRAINT IF EXISTS availability_slot_duration_supported;
