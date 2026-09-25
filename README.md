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
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [User Roles](#user-roles)
- [AI Consultation Workflow](#ai-consultation-workflow)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Offline-First Synchronization](#offline-first-synchronization)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Project Roadmap](#project-roadmap)
- [Project Team](#project-team)
- [Documentation](#documentation)

---

## Overview

**DoctorDirect** is a mobile telemedicine platform built for patients and doctors:

- **Patients** can search doctors by specialty, check live slot availability, book and manage video appointments, attend encrypted consultations, and access doctor-approved prescriptions and summaries—even offline.
- **Doctors** can manage their consultation schedule, conduct peer-to-peer video sessions, review and edit LLM-drafted consultation notes generated from speech-to-text transcripts, and issue digitally approved prescriptions.

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
├── mobile/                   # React Native + Expo Client (Planned)
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── navigation/       # Auth, Patient, and Doctor navigators
│   │   ├── screens/          # Application views (Dashboard, Booking, Video)
│   │   ├── store/            # Redux Toolkit slices and configuration
│   │   ├── services/         # Axios API, WebRTC signaling, STT services
│   │   ├── db/               # Expo SQLite schema, migrations, and sync
│   │   └── utils/            # Helpers and offline state handlers
│   ├── app.json              # Expo configuration
│   └── package.json
├── backend/                  # Node.js + Express API Server (Planned)
│   ├── src/
│   │   ├── controllers/      # Route handlers (auth, doctors, appointments)
│   │   ├── middleware/       # JWT auth guards and role validation
│   │   ├── routes/           # REST endpoint definitions
│   │   ├── services/         # Groq LLM, STT, and database services
│   │   ├── db/               # PostgreSQL connection pool and queries
│   │   └── index.ts          # Server entry point
│   └── package.json
├── docs/                     # Specifications and architectural documentation
├── .gitignore
└── README.md
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

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/auth/register` | Register a new patient or doctor | Public |
| `POST` | `/auth/login` | Authenticate and obtain JWT token | Public |
| `GET` | `/doctors` | Search doctors by specialization and availability | Bearer |
| `GET` | `/doctors/:id` | Get detailed doctor profile | Bearer |
| `GET` | `/doctors/:id/slots` | Fetch available appointment slots | Bearer |
| `POST` | `/appointments` | Book an appointment slot | Patient |
| `GET` | `/appointments` | List user appointments | Bearer |
| `PATCH`| `/appointments/:id` | Cancel or reschedule an appointment | Bearer |
| `POST` | `/consultations/:id/audio` | Submit consultation audio for STT | Doctor |
| `GET` | `/consultations/:id/summary` | Fetch AI draft or approved summary | Bearer |
| `PUT` | `/consultations/:id/summary` | Edit and formally approve clinical summary | Doctor |
| `POST` | `/prescriptions` | Create and sign digital prescription | Doctor |
| `GET` | `/prescriptions/:id` | Fetch prescription details | Bearer |
| `GET` | `/sync` | Fetch updated records since last sync timestamp | Bearer |

---

## Getting Started

### Prerequisites
- **Node.js** v18+ and **npm**
- **Expo CLI**: `npm install -g expo-cli`
- **PostgreSQL** v14+ (for backend)

### Setup & Installation
```bash
# 1. Clone repository
git clone https://github.com/Madhavsai07/DoctorDirect-App.git
cd DoctorDirect-App

# 2. Setup backend
cd backend && npm install

# 3. Setup mobile client
cd ../mobile && npm install
```

### Running Locally
```bash
# Start backend server
cd backend && npm run dev

# Start mobile app (Expo)
cd mobile && npx expo start
```

---

## Environment Configuration

### Backend (`backend/.env`)
```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/doctordirect
JWT_SECRET=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key
```

### Mobile (`mobile/.env`)
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
EXPO_PUBLIC_SIGNALING_URL=ws://localhost:5000
```

---

## Project Roadmap

| Week | Focus Area | Deliverables |
| :---: | :--- | :--- |
| **W1** | Scope & Architecture | Project requirements, BRD/PRD, repo setup |
| **W2** | UI/UX Design | Wireframes, component library, and design tokens |
| **W3** | Database Design | PostgreSQL schema modeling and migration setup |
| **W4** | Auth & Dashboards | JWT auth flows, patient home, and doctor dashboard |
| **W5** | Booking Engine | Doctor catalog, slot management, and booking logic |
| **W6** | Offline Sync | REST API endpoints, Expo SQLite integration, delta sync |
| **W7** | WebRTC & AI Summary | Video calling room, STT pipeline, Groq LLM summary |
| **W8** | Approval & Prescriptions | Doctor clinical review gate and digital prescription builder |
| **W9** | Testing & EAS Build | Jest test suites, performance optimization, Expo EAS builds |
| **W10** | Release & Demo | Final integration testing, bug bash, and project demo |

---

## Project Team

| Member | Role | Details |
| :--- | :--- | :--- |
| **Chinthaginjala Madhav Sai Kiran** | Student Developer | Sem 3 A, Polaris School of Technology |
| **Charan Tej Guniganti** | Student Developer | Sem 3 A, Polaris School of Technology |
| **Kshitiz Dhooria Sir** | Project Mentor | Polaris School of Technology |

---

## Documentation

Comprehensive project specifications, BRD/PRD, architecture designs, and API contracts will be maintained in the `docs/` directory as development progresses.

---

## License

Developed for the On-the-Job Training (OJT) curriculum at Polaris School of Technology. All rights reserved.
