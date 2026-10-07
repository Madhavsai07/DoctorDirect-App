ALTER TABLE availability
  ADD CONSTRAINT availability_slot_duration_supported
  CHECK (slot_duration_minutes IN (15, 30, 45, 60));

ALTER TABLE slots
  ADD COLUMN IF NOT EXISTS is_manual_override BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS schedule_date_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (doctor_id, override_date)
);

CREATE TABLE IF NOT EXISTS schedule_date_override_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  override_id UUID NOT NULL REFERENCES schedule_date_overrides(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL
    CHECK (slot_duration_minutes IN (15, 30, 45, 60)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_schedule_override_window_times CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_schedule_date_overrides_doctor_date
  ON schedule_date_overrides(doctor_id, override_date);
