# DoctorDirect

DoctorDirect is a mobile application for patient-doctor appointment management. It uses a React Native/Expo client, an Express/TypeScript API, PostgreSQL for application data, and Supabase Auth for user identity and sessions.

## Current status

The repository contains the patient, doctor, and admin flows for account provisioning, doctor verification, availability and appointment scheduling, consultations, prescriptions, and notifications. The current hardening work focuses on existing-flow authorization, data consistency, error handling, and regression coverage; it does not introduce a new architecture.

### Implemented flows

- Patients can register, sign in, browse approved doctors, view valid future slots, book/cancel/reschedule appointments, and access their consultation and prescription history.
- Doctors can register with an uploaded ID card. New doctor accounts remain pending until an administrator approves them. Approved doctors can manage availability, appointments, consultations, and prescriptions.
- Weekly availability supports multiple windows per weekday and 15-, 30-, 45-, or 60-minute slots. The calendar supports 7-, 14-, 21-, or 30-day horizons, date-specific working hours or leave blocks, and edit/block/restore controls for individual unbooked slots.
- PostgreSQL is authoritative for bookable availability and appointments. Booking and schedule updates are checked server-side; booked slots are protected from silent edits or deletion.
- Administrators can search/review doctors, view uploaded ID cards, approve/reject doctors, and receive notifications.
- Deleting a user cascades to the account-owned data defined by the migrations. This is destructive and should only be used when permanent deletion is intended.

### Not currently implemented

WebRTC video calling, audio transcription, AI-generated clinical notes, and offline synchronization are not implemented. Consultation records and doctor-authored prescriptions are separate existing flows; they do not depend on those features.

## Architecture

```text
React Native / Expo app
    ├── Supabase Auth sessions
    └── REST requests with Supabase access token
             ↓
Express / TypeScript API
    ├── Role and doctor-verification guards
    ├── Services and repositories
    └── PostgreSQL
```

Doctor ID cards are uploaded to a private Supabase Storage bucket. The app uploads to an object path scoped to the authenticated user's ID; the backend creates temporary viewing URLs for administrators.

## Scheduling behavior

- Weekly availability is recurring and may contain multiple non-overlapping windows for a day.
- A date override replaces weekly hours for that date. A blocked override provides no bookable slots; deleting an override restores weekly hours.
- Slot generation is idempotent and reconciles future unbooked generated slots when a doctor or patient loads a date range. Booked appointments are not silently moved or removed.
- Individual edits and blocks are retained as manual slot overrides. Doctors must confirm before blocking booked appointments; affected patients receive a notification.
- Patients see only valid, future, available slots. The server rechecks availability when booking to prevent conflicts.

## Technology

| Area | Technology |
| --- | --- |
| Mobile | React Native, Expo, TypeScript |
| Navigation and state | React Navigation, Redux Toolkit |
| Authentication and private files | Supabase Auth and Supabase Storage |
| API | Node.js, Express, TypeScript |
| Persistence | PostgreSQL |

## Repository layout

```text
mobile/                  React Native application
backend/src/             API routes, middleware, services, repositories
backend/test-*.ts        Standalone backend integration checks
database/migrations/     PostgreSQL migrations 001 through 012
database/seeds/          Specialization catalog seed (no demo accounts)
database/README.md       Database setup, schema, and migration notes
docs/                    Project documents
```

## Setup

Requirements: Node.js 18+, npm, PostgreSQL 14+, and a Supabase project with email/password authentication enabled.

1. Install dependencies:

   ```bash
   cd backend && npm install
   cd ../mobile && npm install
   ```

2. Configure `backend/.env` from `backend/.env.example` and `mobile/.env` from `mobile/.env.example`. Set PostgreSQL and Supabase project values; configure the backend Supabase service-role key only on the backend for private ID-card viewing. Never add a service-role key to the mobile app.

3. Apply the database migrations and seed the specialization catalog:

   ```bash
   cd backend
   npm run migrate
   npm run seed
   npm run migrate:status
   ```

4. Start the API and mobile app in separate terminals:

   ```bash
   cd backend && npm run dev
   ```

   ```bash
   cd mobile && npm start
   ```

The API health endpoint is `/health`; application endpoints are mounted under `/api/v1`. For a physical device, configure the mobile API URL with the development machine's LAN address instead of `localhost`.

## API areas

Base URL: `/api/v1`

| Area | Routes |
| --- | --- |
| Authentication/profile provisioning | `/auth/*` |
| Patient profile | `/patient/*` |
| Doctor directory and scheduling | `/doctor/*` |
| Appointments | `/appointments/*` |
| Consultations | `/consultations/*` |
| Prescriptions | `/prescriptions/*` |
| Notifications | `/notifications/*` |
| Admin doctor verification | `/admin/*` |

Protected requests use a Supabase access token. Application roles and doctor verification status are read from PostgreSQL; a caller cannot select a role by changing a client-side value.

## Validation

Run the checks from their package directories:

```bash
(cd backend && npm run build)
(cd mobile && npx tsc --noEmit)
(cd backend && npx ts-node test-doctor-scheduling.ts)
(cd backend && npm run migrate:status)
```

The scheduling test uses the configured PostgreSQL database and removes the temporary test users in its cleanup. Other standalone API integration scripts may require valid Supabase test sessions and a running API; they must not rely on development-token or email-based authentication shortcuts.

## Documentation

- [Database setup, migrations, and scheduling schema](./database/README.md)
- [Project documentation index](./docs/README.md)
