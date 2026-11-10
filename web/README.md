# DoctorDirect Web

Independent React + TypeScript web application alongside the existing Expo mobile app. It uses Supabase Auth for browser sessions and the existing Express API for account, scheduling, consultation, prescription, notification, and doctor-verification operations.

## Stack

- React, TypeScript, Vite, React Router
- Redux Toolkit and React Redux
- Axios
- Supabase JS browser client
- Tailwind CSS
- React Hook Form and Zod
- Lucide React

## Structure

```text
src/
  api/                 Axios client and API error normalization
  app/                 Router, Redux store, and typed hooks
  auth/                Supabase browser client, bootstrap, and role guards
  components/          Shared shell, form, and feedback components
  features/            Authentication, role navigation, and API-backed workflows
  layouts/             Public and role-based presentation layouts
  pages/               Authentication and patient/doctor/admin workflows
  store/               Redux slices
  styles/              Tailwind and responsive application styles
  types/               Authentication and API types
```

Patient, Doctor, and Admin routes are protected by the backend-resolved account role. Doctor workflows are available only after backend verification approval. Scheduling includes recurring hours, active/inactive windows, date overrides, blocked dates, slot edits, and block/restore actions, using the existing backend rules and cancellation notifications. Client-side checks are only a navigation convenience; the API remains authoritative. Admin dashboard counts are derived from existing doctor-verification APIs because the backend does not expose aggregate administration statistics.

## Install and configure

```sh
cd web
npm install
cp .env.example .env
```

Set the public variables in `web/.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:5001/api/v1
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
VITE_SIGNALING_URL=ws://localhost:5001/api/v1/signaling
VITE_WEBRTC_RELAY_TEST_ENABLED=false
```

The Supabase URL and publishable/anon key are public browser configuration. Never put a Supabase service-role key, database URL/password, or other backend secret in a `VITE_` variable. The generated `web/.env` is ignored by Git.

## Local development

Start the backend separately with its existing local configuration (`PORT=5001`), then start the web app:

```sh
cd web
npm run dev
```

Vite binds to `http://localhost:5173` and uses strict port selection. The backend API base URL defaults to `http://localhost:5001/api/v1` and is configurable through `VITE_API_BASE_URL`. Configure backend `CORS_ORIGINS=http://localhost:5173` locally. Native requests without an `Origin` header remain allowed.

The authentication screens use Supabase password sign-in, registration, recovery, and password updates. An authenticated session is validated through the existing `/auth/me` endpoint; roles are never inferred from the registration form or URL. Doctor ID-card images are uploaded to the existing `doctor-id-cards` Supabase Storage bucket, then the backend registers the doctor profile. Email-confirmation registrations must reselect the ID image after confirming and signing in; image bytes are not retained in browser storage. Verify the Storage bucket's policies permit the intended authenticated upload and keep it private.

The API client attaches the current Supabase access token and normalizes network failures, HTTP 401, and HTTP 403 responses. There is no clinical-data persistence, offline storage, or IndexedDB.

Existing API limitations remain: profile editing, admin user management, aggregate dashboard statistics, and a complete admin appointment overview are not provided by the backend. The web app does not simulate these capabilities.

Patient and approved-doctor appointment workflows include a browser video-call dialog for consultations whose backend status is `in_progress`. The dialog obtains ICE servers from the existing authenticated consultation endpoint and uses the existing authenticated WebSocket signaling protocol. Ending a call only leaves signaling and closes local media; it does not complete the consultation or alter clinical documentation.

`VITE_SIGNALING_URL` is optional: when omitted, the app derives `/signaling` from `VITE_API_BASE_URL` and switches to `wss://` on HTTPS pages. Set it explicitly if signaling is hosted at a different origin. Production pages require HTTPS, a WSS signaling URL, backend WebSocket upgrade support, and production ICE servers. The browser does not contain TURN shared secrets; the backend returns per-session ICE credentials through the participant-authorized endpoint.

For controlled relay testing, set `VITE_WEBRTC_RELAY_TEST_ENABLED=true` to reveal the relay-only option in the call dialog. This only forces relay candidate selection; verify the displayed route reports `relay` during a real call before concluding TURN works. The local backend configuration does not currently provide STUN/TURN URLs or a TURN shared secret, so relay calls cannot be verified until an administrator configures the backend and a real peer call is performed. Browser permission and network restrictions may also prevent device testing.

## Checks and production build

```sh
npm run typecheck
npm run lint
npm run test:signaling
npm run build
npm run preview
```

For production, host the built `dist/` directory separately from the Render API. Set the production API URL, signaling WSS URL if not colocated, Supabase URL, and publishable/anon key as frontend build-time configuration; add the exact production web origin to the backend `CORS_ORIGINS` allowlist and configure Supabase Auth redirect URLs for sign-in and password recovery. Both web and API must use HTTPS in production. Never put private credentials in `VITE_` variables.

## Security notes

- Frontend role navigation and Redux state are presentation only, not authorization.
- The backend verifies Supabase tokens and enforces roles; keep those checks intact.
- Only the Supabase publishable/anon key may be exposed to browser code.
- The API client normalizes network failures, HTTP 401, and HTTP 403 responses.
- Do not store clinical data in browser persistence or add offline synchronization in this phase.
- Verify Supabase Storage policies before adding browser-based doctor ID uploads.
