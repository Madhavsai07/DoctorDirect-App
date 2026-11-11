# DoctorDirect

DoctorDirect is a multi-platform healthcare application for connecting patients, doctors, and administrators. It provides separate web and mobile clients backed by a shared Express API, PostgreSQL database, and Supabase authentication.

The web application is built with React, TypeScript, and Vite. The mobile application uses React Native, Expo, and TypeScript. Both clients use the existing backend for supported workflows, while authorization and business rules remain enforced by the API.

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

The Expo mobile client and separate React + Vite web application include WebRTC call flows for active consultations. Real cross-platform calls, production TURN relay, and physical-device network recovery have not been verified. Audio transcription, AI-generated clinical notes, and offline synchronization are not implemented. Ending a call does not complete the consultation; consultation records and doctor-authored prescriptions remain separate workflows.

### WebRTC infrastructure

The backend returns ICE configuration only to an authenticated patient or assigned doctor during an active consultation. Select `WEBRTC_TURN_AUTH_MODE=rest` to issue short-lived Coturn REST credentials; configure `WEBRTC_STUN_URLS`, `WEBRTC_TURN_URLS`, and a high-entropy `WEBRTC_TURN_SHARED_SECRET` on the backend, and configure the TURN server with the matching REST shared secret. `WEBRTC_TURN_CREDENTIAL_TTL_SECONDS` defaults to one hour.

For providers that issue static long-term credentials, select `WEBRTC_TURN_AUTH_MODE=static` and configure the backend-only `WEBRTC_TURN_USERNAME` and `WEBRTC_TURN_PASSWORD` with `WEBRTC_TURN_URLS`. Static credentials are returned to authorized consultation participants in their ICE configuration and are therefore visible to those clients; use provider credentials scoped and rotated accordingly. Never put TURN credentials or the REST shared secret in mobile or web environment variables. Production requires an explicit authentication mode and all settings required by that mode.

Production requires both STUN and TURN URLs. When TLS terminates at a trusted reverse proxy, set backend `TRUST_PROXY=true`; signaling upgrades require a secure connection. For an isolated relay verification build, set mobile `EXPO_PUBLIC_WEBRTC_RELAY_ONLY=true` or web `VITE_WEBRTC_RELAY_TEST_ENABLED=true`, make a real call, and verify that the selected candidate pair uses a relay. Return the setting to `false` after testing. Relay-only mode is not proof of TURN connectivity unless a call succeeds over a relay. The web client uses `VITE_SIGNALING_URL` when signaling is hosted separately; otherwise it derives the signaling URL from `VITE_API_BASE_URL`.

## Architecture

```text
React + Vite web app ─────┐
                          ├── Supabase Auth sessions and access tokens
React Native / Expo app ──┘                     │
                                               ▼
                                     Express / TypeScript API
                                      ├── Role and verification guards
                                      ├── Services and repositories
                                      └── PostgreSQL
```

Doctor ID cards are uploaded to a private Supabase Storage bucket under a path scoped to the authenticated user's ID. The backend creates temporary viewing URLs for administrators. Keep service-role credentials on the backend; never include them in either client.

## Scheduling behavior

- Weekly availability is recurring and may contain multiple non-overlapping windows for a day.
- A date override replaces weekly hours for that date. A blocked override provides no bookable slots; deleting an override restores weekly hours.
- Slot generation is idempotent and reconciles future unbooked generated slots when a doctor or patient loads a date range. Booked appointments are not silently moved or removed.
- Individual edits and blocks are retained as manual slot overrides. Doctors must confirm before blocking booked appointments; affected patients receive a notification.
- Patients see only valid, future, available slots. The server rechecks availability when booking to prevent conflicts.

## Technology

| Area | Technology |
| --- | --- |
| Web client | React, TypeScript, Vite, React Router |
| Mobile client | React Native, Expo, TypeScript |
| State management | Redux Toolkit |
| Authentication and private files | Supabase Auth and Supabase Storage |
| API | Node.js, Express, TypeScript |
| Persistence | PostgreSQL |

## Repository layout

```text
mobile/                  React Native application
web/                     React + Vite web application
backend/src/             API routes, middleware, services, repositories
backend/test-*.ts        Standalone backend integration checks
database/migrations/     PostgreSQL migrations 001 through 012
database/seeds/          Specialization catalog seed (no demo accounts)
database/README.md       Database setup, schema, and migration notes
docs/                    Project documents
```

## Setup

Requirements: Node.js, npm, PostgreSQL 14+, and a Supabase project with email/password authentication enabled. Use a Node.js version supported by the installed Vite and Expo toolchains.

1. Install dependencies for the backend and both clients:

   ```bash
   cd backend && npm install
   cd ../mobile && npm install
   cd ../web && npm install
   ```

2. Configure environment files from the checked-in examples:

   - `backend/.env` from `backend/.env.example`: set the database connection and Supabase server credentials. Keep the Supabase service-role key on the backend only.
   - `mobile/.env` from `mobile/.env.example`: set the API and mobile application configuration.
   - `web/.env` from `web/.env.example`: set `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`. The Supabase URL and publishable/anon key are browser-visible; never use a service-role key in a `VITE_` variable.

   For local web development, allow `http://localhost:5173` in the backend `CORS_ORIGINS` setting.

3. Apply the database migrations and seed the specialization catalog:

   ```bash
   cd backend
   npm run migrate
   npm run seed
   npm run migrate:status
   ```

4. Start the API and either or both clients in separate terminals:

   ```bash
   cd backend && npm run dev
   ```

   ```bash
   cd mobile && npm start
   ```

   ```bash
   cd web && npm run dev
   ```

The web development server is available at `http://localhost:5173`. The API health endpoint is `/health`; application endpoints are mounted under `/api/v1`. For a physical mobile device, configure the API URL with the development machine's LAN address instead of `localhost`.

For web-specific setup, supported workflows, and security notes, see the [web application guide](./web/README.md).

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

Run the relevant checks from each package directory:

```bash
(cd backend && npm run build)
(cd mobile && npx tsc --noEmit)
(cd web && npm run typecheck)
(cd web && npm run lint)
(cd web && npm run build)
(cd backend && npx ts-node test-doctor-scheduling.ts)
(cd backend && npm run migrate:status)
```

The scheduling test uses the configured PostgreSQL database and removes the temporary test users in its cleanup. Other standalone API integration scripts may require valid Supabase test sessions and a running API; they must not rely on development-token or email-based authentication shortcuts.

## Documentation

- [Database setup, migrations, and scheduling schema](./database/README.md)
- [Project documentation index](./docs/README.md)
