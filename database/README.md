# Database — DoctorDirect

## Overview

DoctorDirect uses **PostgreSQL** as the authoritative store for application accounts, doctor verification, schedules, appointments, consultations, prescriptions, and notifications. Migrations through `012` define the current schema. Some retained tables (such as transcripts, summaries, device tokens, and sync metadata) are schema artifacts and do not mean that speech-to-text, AI summarization, push delivery, or offline synchronization is implemented.

---

## Prerequisites

- **PostgreSQL**: Version 14 or higher (v16 recommended)
- **Node.js**: v18+ and **npm** v9+ (for running migration scripts)

---

## Directory Structure

```text
database/
├── migrations/
│   ├── 001_initial_schema.sql            # Core relational tables and indexes
│   ├── 002_schema_hardening.sql          # Slot uniqueness, FK hardening, sync tombstones
│   ├── 003_consultation_clinical_records.sql
│   ├── 004_notifications.sql
│   ├── 005_supabase_auth.sql
│   ├── 006_link_admin_user.sql
│   ├── 007_doctor_verification.sql
│   ├── 008_notification_doctor_reference.sql
│   ├── 009_doctor_id_card.sql
│   ├── 010_remove_demo_accounts.sql      # Removes known seeded development accounts
│   ├── 011_cascade_user_deletion.sql     # Cascades account-owned data on deletion
│   └── 012_doctor_schedule_overrides.sql # Date overrides, windows, manual slot edits
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

## Schema (16 Tables)

| # | Table | Purpose | Key Constraints & Relations |
| :---: | :--- | :--- | :--- |
| 1 | `specializations` | Medical specialties for doctor filtering | Unique `name`, auto-updating timestamp |
| 2 | `users` | Base accounts for patients, doctors, and admins | Unique `email`, unique `phone`, role check constraint |
| 3 | `patients` | Patient medical profiles and emergency details | 1-to-1 with `users.id` (CASCADE deletion) |
| 4 | `doctors` | Physician credentials, fees, and bio | 1-to-1 with `users.id` (CASCADE deletion), FK `specializations.id` |
| 5 | `availability` | Recurring weekly doctor working hours | FK `doctors.id`, day of week (0-6), end_time > start_time |
| 6 | `slots` | Specific calendar appointment slots | FK `doctors.id`, unique `(doctor_id, date, start_time)` |
| 7 | `appointments` | Booked patient-doctor appointments | FKs to patients, doctors, and slots; active-slot partial unique index |
| 8 | `consultations` | Consultation status and clinical records | 1-to-1 with `appointments.id`; not a WebRTC implementation |
| 9 | `transcripts` | Transcript data schema | FK to consultations; speech-to-text flow is not implemented |
| 10 | `summaries` | Summary data schema | FK to consultations and approving doctor; AI summary flow is not implemented |
| 11 | `prescriptions` | Doctor-authored prescriptions | FKs to consultations, doctors, and patients |
| 12 | `device_tokens` | Device-token storage schema | FK to users; push delivery is not implemented |
| 13 | `sync_metadata` | Synchronization metadata schema | FK to users; offline synchronization is not implemented |
| 14 | `notifications` | In-app notification records | Recipient FK and optional appointment, consultation, prescription, and doctor references |
| 15 | `schedule_date_overrides` | Per-doctor date override or blocked day | Unique `(doctor_id, override_date)`; FK to doctors |
| 16 | `schedule_date_override_windows` | Working-time windows for a date override | FK to an override; slot duration constrained to 15/30/45/60 minutes |

---

## Architectural Decisions & Constraints

1. **Appointment Slot Claiming (`uq_active_slot_appointment`)**:
   Instead of a permanent unique constraint on `appointments(slot_id)`, a PostgreSQL partial unique index is enforced:
   ```sql
   CREATE UNIQUE INDEX uq_active_slot_appointment
     ON appointments(slot_id)
     WHERE status NOT IN ('cancelled', 'rescheduled');
   ```
   This prevents two active appointments from claiming the same slot while retaining cancelled or rescheduled appointment records.

2. **User Deletion and Related Records**:
   Migration 011 changes the relevant account-owned foreign keys to `ON DELETE CASCADE`. Deleting a row from `users` permanently deletes linked profiles and dependent scheduling, appointment, consultation, prescription, and notification data. This is destructive and should only be used when permanent erasure is intended.

3. **Sync Tombstones**:
   `sync_metadata` includes `is_deleted` (BOOLEAN) and `deleted_at` (TIMESTAMPTZ) to enable client SQLite databases to process delta deletions during synchronization.

4. **Doctor scheduling**:
   Weekly `availability` rows remain recurring windows and allow multiple non-overlapping windows per weekday. Slot durations are restricted to 15, 30, 45, or 60 minutes. Migration 012 adds one date override per doctor/date, with zero or more custom windows; a blocked override represents leave or a holiday without changing weekly rules. `slots.is_manual_override` preserves doctor-edited, blocked, or restored individual slots when the horizon is regenerated. Generation reconciles only unbooked generated slots and never moves or deletes a slot with an active appointment.

   The doctor calendar offers horizons of 7, 14, 21, or 30 days. Doctor slot reads generate/reconcile within the selected range; patient slot reads do the same and return only future, available slots that fit the effective weekly/date-specific schedule. Date overrides take precedence over weekly rules. Blocking a day with booked appointments requires explicit doctor confirmation, cancels the affected appointments, and notifies patients to book another slot.

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

## Backend Data Access

The backend communicates with PostgreSQL using a clean layered architecture:
```text
Express route
 ↓
Service
 ↓
Repository
 ↓
PostgreSQL Pool (db/pool.ts)
```

The backend exposes a database-backed liveness check at `GET /health`. Its response includes current database connectivity and latency; values such as timestamp and uptime are runtime-dependent.
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
