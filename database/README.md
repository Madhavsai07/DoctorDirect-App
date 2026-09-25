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
│   └── 002_schema_hardening_down.sql     # Rollback migration for 002
├── seeds/
│   └── 001_seed_dev_data.sql             # Minimal development seed data for schema testing
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
| `npm run seed` | Insert dev seeds | Executes minimal test data from `database/seeds/001_seed_dev_data.sql` |

### Quick Start Example

```bash
cd backend

# Run initial migration
npm run migrate

# (Optional) Seed minimal development data
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
| 3 | `patients` | Patient medical profiles and emergency details | 1-to-1 with `users.id` (RESTRICT deletion) |
| 4 | `doctors` | Physician credentials, fees, and bio | 1-to-1 with `users.id` (RESTRICT deletion), FK `specializations.id` |
| 5 | `availability` | Recurring weekly doctor working hours | FK `doctors.id`, day of week (0-6), end_time > start_time |
| 6 | `slots` | Specific calendar appointment slots | FK `doctors.id`, unique `(doctor_id, date, start_time)` |
| 7 | `appointments` | Booked patient-doctor appointments | FK `patients.id` (RESTRICT), FK `doctors.id` (RESTRICT), partial unique index on `slot_id` (active bookings only) |
| 8 | `consultations` | WebRTC video session rooms | 1-to-1 with `appointments.id` (RESTRICT), unique `room_id` |
| 9 | `transcripts` | Consultation audio STT transcript | 1-to-1 with `consultations.id` (RESTRICT) |
| 10 | `summaries` | AI draft and doctor-approved summary | 1-to-1 with `consultations.id` (RESTRICT), FK `doctors.id` approval gate |
| 11 | `prescriptions` | Digitally signed doctor prescriptions | FK `consultations.id` (RESTRICT), FK `doctors.id` (RESTRICT), FK `patients.id` (RESTRICT) |
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

2. **Medical Record Deletion Protection**:
   `ON DELETE RESTRICT` is enforced on `patients`, `doctors`, `appointments`, `consultations`, `transcripts`, `summaries`, and `prescriptions`. A user account with existing medical records cannot be hard-deleted; account deactivation must occur via soft-delete (`users.is_active = FALSE`).

3. **Prescriptions Linkage (Decision Record)**:
   Prescriptions are linked to `consultations.id` (`ON DELETE RESTRICT`). For Milestone 8 (Prescription Management), evaluate whether an optional direct `appointment_id` foreign key is also needed for asynchronous/in-person appointments without an online video room.

4. **Sync Tombstones**:
   `sync_metadata` includes `is_deleted` (BOOLEAN) and `deleted_at` (TIMESTAMPTZ) to enable client SQLite databases to process delta deletions during synchronization.

---

## Reset / Rebuild from Scratch

To completely rebuild the schema from an empty database:
```bash
cd backend
npm run migrate:reset
npm run seed
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
