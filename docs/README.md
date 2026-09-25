# DoctorDirect

> An offline-first healthcare mobile application connecting patients and doctors through appointment scheduling, WebRTC video consultations, AI-assisted clinical documentation, and synchronized offline records.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)

---

## Table of Contents

- [Overview](#overview)
- [Current Milestone](#current-milestone)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [User Roles](#user-roles)
- [AI Consultation Workflow](#ai-consultation-workflow)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Offline-First Synchronization](#offline-first-synchronization)
- [API Reference](#api-reference)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Project](#running-the-project)
- [Project Roadmap](#project-roadmap)
- [Project Team](#project-team)
- [Documentation](#documentation)

---

## Overview

**DoctorDirect** is a mobile telemedicine platform built for patients and doctors:

- **Patients** can search doctors by specialty, check live slot availability, book and manage video appointments, attend encrypted consultations, and access doctor-approved prescriptions and summaries—even offline.
- **Doctors** can manage their consultation schedule, conduct peer-to-peer video sessions, review and edit LLM-drafted consultation notes generated from speech-to-text transcripts, and issue digitally approved prescriptions.

---

## Current Milestone

> **✅ Milestone 2 — Database + Backend Core (Complete)**

The authoritative PostgreSQL database schema, migration system, database connection pool, and backend layered architecture are established. The Express backend connects to PostgreSQL and verifies database connectivity via `GET /health`.

**What is implemented in Milestone 2:**
- PostgreSQL configuration via `DATABASE_URL` with connection pool in `backend/src/db/pool.ts`
- 13 core relational tables created with strict constraints, foreign keys, and indexes:
  `specializations`, `users`, `patients`, `doctors`, `availability`, `slots`, `appointments`, `consultations`, `transcripts`, `summaries`, `prescriptions`, `device_tokens`, `sync_metadata`
- Reproducible SQL migration system under `database/migrations/` (`npm run migrate`, `npm run migrate:down`, `npm run migrate:reset`, `npm run migrate:status`)
- Minimal development seed script under `database/seeds/` (`npm run seed`)
- Layered backend architecture: `Route → Controller → Service → Repository → PostgreSQL`
- Database health check reporting server uptime and database connectivity latency via `GET /health`
- Centralized database error handling middleware in `backend/src/middleware/errorHandler.ts`
- Fully documented setup and migration guide in `database/README.md`

**What is intentionally NOT implemented yet** (belongs to later milestones):
Authentication & JWT, patient/doctor UI screens, appointment booking flows, WebRTC video calling, AI summaries, digital prescription workflows, and offline SQLite synchronization.

---

## System Architecture

```mermaid
flowchart TD
    subgraph Client["Mobile App (React Native + Expo)"]
        UI["Patient & Doctor UI"]
        Redux["Redux Toolkit"]
        SQLite[("Local SQLite Cache")]
        Axios["Axios REST Client"]
        WebRTC["WebRTC Client"]
    end

    subgraph Server["Backend & Real-Time Services"]
        API["Node.js + Express API"]
        Signaling["WebRTC Signaling"]
        DB[("PostgreSQL Database")]
    end

    subgraph AI["AI Services"]
        STT["Speech-to-Text"]
        Groq["Groq API (LLM Summaries)"]
    end

    UI --> Redux
    Redux --> SQLite
    Redux --> Axios
    UI --> WebRTC

    Axios --> API
    API --> DB

    WebRTC --> Signaling
    WebRTC -.-> STT
    STT --> Groq
    Groq --> API
```

---

## Key Features

- **Role-Based Authentication**: Secure onboarding and distinct dashboards for Patients and Doctors via JWT.
- **Doctor Discovery**: Filter verified doctors by specialization, experience, consultation fee, and available hours.
- **Appointment Scheduling**: Real-time slot locking, booking confirmation, cancellation, and rescheduling.
- **WebRTC Video Consultations**: Encrypted peer-to-peer audio/video calling with call controls.
- **AI-Assisted Documentation**: Automatic draft summary generation from consultation audio transcripts.
- **Doctor Clinical Gate**: Mandatory physician review and approval before any clinical summary or prescription is published.
- **Prescription Builder**: In-app digital prescription generation with medication details, dosage, duration, and doctor signature representation.
- **Offline Access**: Local SQLite caching ensures past appointments, summaries, and prescriptions remain accessible without an active internet connection.

---

## User Roles

| Capability | Patient | Doctor | Notes |
| :--- | :---: | :---: | :--- |
| Registration & Authentication | ✓ | ✓ | Role-specific onboarding and dashboards |
| Doctor Search & Specialty Filter | ✓ | — | Browse doctors by medical domain |
| View Doctor Profile & Fees | ✓ | — | Transparent credentials and fee display |
| Book Appointment Slots | ✓ | — | Server-authoritative slot reservation |
| Manage Schedule & Slots | — | ✓ | Doctors configure availability windows |
| Join WebRTC Video Consultation | ✓ | ✓ | Mutual access to scheduled video room |
| Review & Edit AI Draft Summary | — | ✓ | Exclusive doctor clinical review gate |
| Approve Consultation Record | — | ✓ | Doctor authorization required to finalize |
| Create & Sign Prescription | — | ✓ | Structured medication and dosage formulation |
| View Prescriptions & Summaries | ✓ | ✓ | Saved locally for offline access |
| Access Offline Records | ✓ | ✓ | Cached in device SQLite database |

---

## AI Consultation Workflow

> **AI Safety Notice**: DoctorDirect uses AI strictly to assist with clinical note-taking, not to diagnose patients or replace physician judgment.

```mermaid
flowchart TD
    A[Video Consultation] --> B[Temporary Audio Capture]
    B --> C[Speech-to-Text Transcription]
    C --> D[Consultation Transcript]
    D --> E[Groq LLM Draft Summary]
    E --> F[Doctor Review & Editing]
    F --> G{Doctor Approved?}
    G -->|No - Edit Needed| F
    G -->|Yes - Approved| H[Final Consultation Record]
    H --> I[Issue & Sign Prescription]
    I --> J[Available to Patient & Doctor]
```

1. **Audio Capture & STT**: Temporary consultation audio is transcribed into text.
2. **Draft Synthesis**: Groq-hosted LLMs structure the transcript into a formatted draft summary.
3. **Clinical Review Gate**: The doctor edits errors, adds clinical context, and approves the record.
4. **Publishing**: Only after explicit doctor sign-off is the record finalized and made available to the patient.

---

## Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Mobile** | React Native, Expo | Cross-platform mobile development (iOS/Android) |
| **Language** | TypeScript | Type safety across client and server |
| **Navigation** | React Navigation | Role-based navigation and protected route stacks |
| **State** | Redux Toolkit | Centralized state management |
| **Local Storage** | Expo SQLite | Embedded offline cache for appointments & records |
| **HTTP Client** | Axios | REST API integration with token interceptors |
| **Backend** | Node.js, Express.js | REST API server and business logic |
| **Database** | PostgreSQL | Authoritative relational persistence |
| **Telemedicine** | WebRTC | Peer-to-peer real-time video/audio streaming |
| **AI / Speech** | Speech-to-Text, Groq API | Audio transcription & LLM clinical summarization |
| **Testing** | Jest | Unit and integration testing |
| **Build** | Expo EAS | Cloud builds and binary generation |

---

## Project Structure

```text
DoctorDirect-App/
├── mobile/                         # React Native + Expo Mobile App
│   ├── src/
│   │   ├── navigation/             # Auth, Patient, Doctor navigators
│   │   ├── screens/
│   │   │   ├── auth/               # Login, Registration screens
│   │   │   ├── patient/            # Patient dashboard, booking, etc.
│   │   │   ├── doctor/             # Doctor dashboard, schedule, etc.
│   │   │   └── consultation/       # Video call, summary, prescription
│   │   ├── components/             # Reusable UI components
│   │   ├── store/                  # Redux Toolkit store + typed hooks
│   │   ├── services/
│   │   │   ├── api/                # ✅ Axios client + healthService
│   │   │   ├── auth/               # Auth service (Milestone 4)
│   │   │   ├── appointments/       # Booking service (Milestone 5)
│   │   │   ├── consultation/       # WebRTC + AI service (Milestone 7)
│   │   │   └── sync/               # SQLite sync service (Milestone 6)
│   │   ├── database/               # Expo SQLite (Milestone 6)
│   │   │   ├── migrations/
│   │   │   ├── repositories/
│   │   │   └── models/
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── types/                  # Shared TypeScript types
│   │   └── utils/                  # Helpers and formatters
│   ├── App.tsx                     # ✅ Root component (foundation screen)
│   ├── app.json                    # ✅ Expo configuration
│   ├── .env.example                # ✅ Environment variable template
│   ├── tsconfig.json               # ✅ TypeScript configuration
│   └── package.json                # ✅ Dependencies
│
├── backend/                        # Node.js + Express REST API
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts              # ✅ Centralized env configuration
│   │   ├── routes/
│   │   │   └── health.route.ts     # ✅ GET /health
│   │   ├── controllers/            # Route handlers (future milestones)
│   │   ├── services/               # Business logic (future milestones)
│   │   ├── repositories/           # DB queries (Milestone 3+)
│   │   ├── middleware/             # JWT auth guards (Milestone 4)
│   │   ├── models/                 # DB models (Milestone 3)
│   │   ├── utils/                  # Shared utilities
│   │   ├── app.ts                  # ✅ Express app factory
│   │   └── server.ts               # ✅ Server entry point
│   ├── .env.example                # ✅ Environment variable template
│   ├── tsconfig.json               # ✅ TypeScript configuration
│   └── package.json                # ✅ Dependencies
│
├── database/                       # Database scripts
│   ├── migrations/                 # SQL migrations (Milestone 3)
│   ├── seeds/                      # Seed data (Milestone 3)
│   └── README.md                   # ✅ Database technology overview
│
├── docs/                           # Project documentation
│   └── README.md                   # ✅ Documentation index
│
├── .gitignore                      # ✅ Comprehensive ignore rules
└── README.md                       # ✅ This file
```

---

## Offline-First Synchronization

DoctorDirect guarantees continuous access to critical medical information through a local-first caching strategy:

- **Cached Locally (SQLite)**: Confirmed appointments, doctor profiles, finalized consultation summaries, and prescriptions.
- **Server Authoritative**: Live slot availability, booking requests, and user authentication require active network connectivity to eliminate booking conflicts.
- **Reconciliation**: When the client reconnects, it queries `/api/v1/sync?last_synced_at=<timestamp>` to fetch new and modified records. In all conflicts, the backend remains authoritative.

---

## API Reference

Base URL: `/api/v1`

| Method | Endpoint | Description | Auth | Status |
| :--- | :--- | :--- | :---: | :---: |
| `GET` | `/health` | Backend liveness check | Public | ✅ Live |
| `POST` | `/auth/register` | Register a new patient or doctor | Public | Milestone 4 |
| `POST` | `/auth/login` | Authenticate and obtain JWT token | Public | Milestone 4 |
| `GET` | `/doctors` | Search doctors by specialization | Bearer | Milestone 5 |
| `GET` | `/doctors/:id/slots` | Fetch available appointment slots | Bearer | Milestone 5 |
| `POST` | `/appointments` | Book an appointment slot | Patient | Milestone 5 |
| `GET` | `/appointments` | List user appointments | Bearer | Milestone 5 |
| `PATCH`| `/appointments/:id` | Cancel or reschedule | Bearer | Milestone 5 |
| `POST` | `/consultations/:id/audio` | Submit audio for transcription | Doctor | Milestone 7 |
| `PUT` | `/consultations/:id/summary` | Edit and approve clinical summary | Doctor | Milestone 7 |
| `POST` | `/prescriptions` | Create and sign prescription | Doctor | Milestone 8 |
| `GET` | `/sync` | Delta sync for offline cache | Bearer | Milestone 6 |

---

## Prerequisites

- **Node.js** v18+ and **npm** v9+
- **Expo CLI**: `npm install -g expo-cli` (or use `npx expo` directly)
- **PostgreSQL** v14+ — required from Milestone 3 onwards
- **Android Studio** (for Android emulator) or Expo Go app on a physical device

---

## Installation

```bash
# 1. Clone repository
git clone https://github.com/Madhavsai07/DoctorDirect-App.git
cd DoctorDirect-App

# 2. Install backend dependencies
cd backend
npm install

# 3. Install mobile dependencies
cd ../mobile
npm install
```

---

## Environment Configuration

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and update values:

```env
PORT=5001
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/doctordirect
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
GROQ_API_KEY=replace_with_your_groq_api_key
```

### Mobile (`mobile/.env`)
Copy `mobile/.env.example` to `mobile/.env` and update values:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5001/api/v1
EXPO_PUBLIC_SIGNALING_URL=ws://localhost:5001
```

> **Physical device note**: Replace `localhost` with your machine's LAN IP address (e.g. `192.168.1.50`) so your phone can reach the development server.

---

## Running the Project

### Start the Backend

```bash
cd backend
npm run dev
```

The server starts at `http://localhost:5001`.

Verify it is running:
```bash
curl http://localhost:5001/health
# Expected: {"status":"ok"}
```

### Start the Mobile App

```bash
cd mobile
npm start
```

Press `a` for Android emulator, `i` for iOS simulator, or scan the QR code with Expo Go.

---

## Project Roadmap

| Milestone | Focus Area | Deliverables | Status |
| :---: | :--- | :--- | :---: |
| **M1** | Project Foundation | Repo structure, Expo app, Express API, `/health` | ✅ Done |
| **M2** | Database + Backend Core | PostgreSQL schema (13 tables), migrations, seeds, DB health | ✅ Done |
| **M3** | UI/UX Design | Component library, design tokens, wireframe screens | Planned |
| **M4** | Authentication | JWT auth, registration, login, role dashboards | Planned |
| **M5** | Booking Engine | Doctor catalog, slot management, appointment booking | Planned |
| **M6** | Offline Sync | Expo SQLite, API endpoints, delta sync mechanism | Planned |
| **M7** | WebRTC & AI Summary | Video calls, STT pipeline, Groq LLM summary | Planned |
| **M8** | Approval & Prescriptions | Clinical review gate, prescription builder | Planned |
| **M9** | Testing & EAS Build | Jest test suites, performance, Expo EAS builds | Planned |
| **M10** | Release & Demo | End-to-end validation, documentation, demo | Planned |

---

## Project Team

| Member | Role | Details |
| :--- | :--- | :--- |
| **Chinthaginjala Madhav Sai Kiran** | Student Developer | Sem 3 A, Polaris School of Technology |
| **Charan Tej Guniganti** | Student Developer | Sem 3 A, Polaris School of Technology |
| **Kshitiz Dhooria Sir** | Project Mentor | Polaris School of Technology |

---

## Documentation

Comprehensive project specifications, BRD/PRD, architecture designs, and API contracts are maintained in [`docs/`](./docs). Full source documentation (PDF) is preserved in the repository root.

---

## License

Developed for the On-the-Job Training (OJT) curriculum at Polaris School of Technology. All rights reserved.
