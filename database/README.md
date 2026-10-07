# Database — DoctorDirect

## Overview

DoctorDirect uses **PostgreSQL** as the authoritative server-side relational database for all persistent data including users, doctors, slots, appointments, consultations, prescriptions, transcripts, summaries, device tokens, and offline synchronization metadata.

---

## Prerequisites

- **PostgreSQL**: Version 14 or higher (v16 recommended)
- **Node.js**: v18+ and **npm** v9+ (for running migration scripts)

---

## Directory Structure

```text
database/
├── migrations/
│   ├── 001_initial_schema.sql            # Initial migration creating all 13 core tables
│   ├── 001_initial_schema_down.sql       # Rollback migration for 001 in reverse order
│   ├── 002_schema_hardening.sql          # Partial index on slots, RESTRICT on medical records, sync tombstones
│   ├── 009_doctor_id_card.sql            # Stores uploaded doctor ID-card object paths
│   ├── 010_remove_demo_accounts.sql      # Removes only known seeded development accounts
│   ├── 011_cascade_user_deletion.sql     # Removes Doctor 02 and cascades user-owned data
│   └── 012_doctor_schedule_overrides.sql # Date-specific schedule overrides and manual slot edits
├── seeds/
│   └── 001_seed_dev_data.sql             # Specialization catalog only; no demo accounts
└── README.md                             # Database documentation (this file)
```

---

## Database Setup

### 1. Create PostgreSQL Database

Using local PostgreSQL (`psql`):
```bash
# Connect to PostgreSQL and create the user and database
psql -d postgres -c "CREATE ROLE postgres WITH SUPERUSER LOGIN PASSWORD 'password';"
psql -d postgres -c "CREATE DATABASE doctordirect OWNER postgres;"
```

Or using Docker:
```bash
docker run -d \
  --name doctordirect-postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=doctordirect \
  postgres:16-alpine
```

### 2. Configure Backend Environment

Ensure `backend/.env` contains your connection URL:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/doctordirect
```

---

## Migration Commands

All database commands are run from the `backend/` directory:

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run migrate` | Apply migrations | Executes all pending `.sql` files under `database/migrations/` |
| `npm run migrate:down` | Rollback last | Executes the corresponding `*_down.sql` rollback migration |
| `npm run migrate:status` | Check status | Displays applied vs. pending migrations tracked in `_migrations` |
| `npm run migrate:reset` | Reset database | Rolls back applied migrations and re-applies all migrations from scratch |
| `npm run seed` | Insert specialization catalog | Adds available specialties without creating demo users or records |

### Quick Start Example

```bash
cd backend

# Run initial migration
npm run migrate

# (Optional) Seed the specialization catalog
npm run seed

# Verify migration status
npm run migrate:status
```

---

## Implemented Schema (13 Tables)

| # | Table | Purpose | Key Constraints & Relations |
| :---: | :--- | :--- | :--- |
| 1 | `specializations` | Medical specialties for doctor filtering | Unique `name`, auto-updating timestamp |
| 2 | `users` | Base accounts for patients, doctors, and admins | Unique `email`, unique `phone`, role check constraint |
| 3 | `patients` | Patient medical profiles and emergency details | 1-to-1 with `users.id` (CASCADE deletion) |
| 4 | `doctors` | Physician credentials, fees, and bio | 1-to-1 with `users.id` (CASCADE deletion), FK `specializations.id` |
| 5 | `availability` | Recurring weekly doctor working hours | FK `doctors.id`, day of week (0-6), end_time > start_time |
| 6 | `slots` | Specific calendar appointment slots | FK `doctors.id`, unique `(doctor_id, date, start_time)` |
| 7 | `appointments` | Booked patient-doctor appointments | FK `patients.id`, `doctors.id`, and `slots.id` (CASCADE); partial unique index on `slot_id` (active bookings only) |
| 8 | `consultations` | WebRTC video session rooms | 1-to-1 with `appointments.id` (CASCADE), unique `room_id` |
| 9 | `transcripts` | Consultation audio STT transcript | 1-to-1 with `consultations.id` (CASCADE) |
| 10 | `summaries` | AI draft and doctor-approved summary | 1-to-1 with `consultations.id` (CASCADE), FK `doctors.id` approval gate |
| 11 | `prescriptions` | Digitally signed doctor prescriptions | FK `consultations.id`, `doctors.id`, and `patients.id` (CASCADE) |
| 12 | `device_tokens` | Mobile push notification device tokens | FK `users.id` (CASCADE), unique `(user_id, token)` |
| 13 | `sync_metadata` | Offline-first delta synchronization | FK `users.id`, unique `(user_id, entity_type, entity_id)`, with `is_deleted` and `deleted_at` tombstones |

---

## Architectural Decisions & Constraints

1. **Appointment Slot Claiming (`uq_active_slot_appointment`)**:
   Instead of a permanent unique constraint on `appointments(slot_id)`, a PostgreSQL partial unique index is enforced:
   ```sql
   CREATE UNIQUE INDEX uq_active_slot_appointment
     ON appointments(slot_id)
     WHERE status NOT IN ('cancelled', 'rescheduled');
   ```
   This guarantees that only one active appointment can occupy a slot at any given time, while preserving historical cancelled and rescheduled appointments for patient audit trails.

2. **User Deletion and Related Records**:
   Migration 011 sets user-owned profiles and their dependent scheduling, appointment, consultation, prescription, and notification records to `ON DELETE CASCADE`. Deleting a row from `users` permanently deletes those linked records as well. This is destructive and should only be used when the account and its records are intended to be erased.

3. **Sync Tombstones**:
   `sync_metadata` includes `is_deleted` (BOOLEAN) and `deleted_at` (TIMESTAMPTZ) to enable client SQLite databases to process delta deletions during synchronization.

4. **Doctor scheduling**:
   Weekly `availability` rows remain recurring windows and allow multiple non-overlapping windows per weekday. Slot durations are restricted to 15, 30, 45, or 60 minutes. Migration 012 adds one date override per doctor/date, with zero or more custom windows; a blocked override represents leave or a holiday without changing weekly rules. `slots.is_manual_override` preserves doctor-edited, blocked, or restored individual slots when the horizon is regenerated. Generation reconciles only unbooked generated slots and never moves or deletes a slot with an active appointment.

   The doctor calendar offers horizons of 7, 14, 21, or 30 days. Doctor slot reads generate/reconcile within the selected range; patient slot reads do the same and return only future, available slots that fit the effective weekly/date-specific schedule. Date overrides take precedence over weekly rules. A blocked date prevents new bookings while leaving booked appointments unchanged.

   If a weekly window or date override changes, affected future, unbooked generated slots are reconciled the next time that date range is generated/read. Manually edited slots retain their individual override; remove that slot override by restoring or blocking the slot through the doctor controls.

---

## Reset / Rebuild from Scratch
To completely rebuild the schema from an empty database:
```bash
cd backend
npm run migrate:reset
npm run seed
```

Doctor ID cards are stored in a private Supabase Storage bucket named
`doctor-id-cards`. Create the bucket with a 10 MB file limit and allow only
`image/jpeg` and `image/png`. Add an INSERT policy for authenticated doctors
that allows writes only when the first object path folder equals `auth.uid()`.
The app stores objects as `<auth-user-id>/<unique-file-name>`; only the backend
service-role client creates short-lived read URLs for administrators. Configure
`SUPABASE_SERVICE_ROLE_KEY` in the backend environment and never put it in the
mobile app.

Create the bucket as private in Supabase Storage, then add the doctor upload
policy in the Supabase SQL editor:

```sql
CREATE POLICY "Doctors upload their own ID cards"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'doctor-id-cards'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);
```

---

## Backend Architecture Pattern

The backend communicates with PostgreSQL using a clean layered architecture:
```text
Route (routes/health.route.ts)
  ↓
Controller (controllers/health.controller.ts)
  ↓
Service (services/health.service.ts)
  ↓
Repository (repositories/health.repository.ts)
  ↓
PostgreSQL Pool (db/pool.ts)
```

Health check verification is exposed at `GET /health` and returns:
```json
{
  "status": "ok",
  "timestamp": "2026-09-25T11:22:00.971Z",
  "uptimeSeconds": 45,
  "database": {
    "status": "connected",
    "latencyMs": 12
  }
}
```
