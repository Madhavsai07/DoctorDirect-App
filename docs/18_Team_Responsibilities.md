**Team Responsibilities**

**AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App**

Document ID: TEAM-AS-01

Status: Draft

Date: 2026-09-07

Track: Application Development / Mobile IoT

Team Size: 1 Student

# Team Structure

AquaSmart is a solo OJT project. Therefore, the responsibilities that the FitTrack sample divides between two students are consolidated under one student. Work is organized by engineering responsibility rather than by separate people: Product/Documentation, Mobile UI, BLE/IoT Integration, Data Layer, Core Logic, Testing, and Delivery.

- Student: Chinthaginjala Madhav Sai Kiran
- Mentor: Kshitiz Dhooria
- The student owns the complete codebase and is responsible for integration across all modules.
- The mentor provides guidance, review, and feedback but is not treated as a project developer.
# Student — Full-Stack Mobile IoT Project Owner

## Primary Ownership

- Project architecture and technical decisions
- React Native + Expo JavaScript application development
- Physical BLE water-flow sensor integration as the production input
- BLE connection, discovery, notification handling, disconnect, and reconnect behavior
- Telemetry parsing and validation
- SQLite schema, migrations, repositories, and local data lifecycle
- Water usage calculation and aggregation
- Pattern/state-based leak detection logic
- Leak event persistence and loud alarm behavior
- Dashboard, usage charts, leak history, settings, and connection screens
- Application state management
- Accessibility and error-state implementation
- Unit, component, integration, and E2E testing
- GitHub repository management and CI/CD
- EAS Android build and internal distribution
- Project documentation, README, ADRs, demo preparation, and final OJT submission
# Core Deliverables

| Deliverable | Document Reference |
| --- | --- |
| System architecture and component boundaries | HLD / LLD |
| UX flows and screen requirements | UX Requirements |
| SQLite schema and migrations | Database / Data Design |
| SensorRepository / FlowReadingRepository | Repository API Specification |
| UsageRepository / LeakEventRepository / SettingsRepository | Repository API Specification |
| BLE service and telemetry parser/validator | TRD / LLD / Repository API |
| Water usage calculation service | LLD / Testing Strategy |
| Leak detection service | LLD / Testing Strategy |
| Alarm service and leak-state UI | LLD / UX Requirements |
| Dashboard and live monitoring UI | UX Requirements / Frontend Architecture |
| Usage charts and leak history | UX Requirements / Frontend Architecture |
| Settings and configuration | UX Requirements |
| Automated test suite | Testing Strategy |
| GitHub Actions CI/CD | CI/CD Pipeline |
| EAS Android build | Deployment Architecture |
| README, ADRs, and final documentation | README / ADRs / Project Roadmap |

# Data and IoT Responsibilities

- Define a hardware-independent telemetry model so the application is not tightly coupled to one sensor implementation.
- Integrate react-native-ble-plx as the Android BLE Central/client layer.
- Keep the final service UUID, characteristic UUID, payload structure, byte order, scaling, and status values as hardware-specific configuration/TBD until the physical sensor is selected.
- Validate telemetry before it affects usage totals or leak detection.
- Handle duplicate, missing, out-of-order, malformed, and impossible readings safely.
- Persist validated flow readings and derived usage/leak records in SQLite.
- Use BLE simulator/mock telemetry only for controlled development and automated testing when physical hardware is unavailable.
# UI and Frontend Responsibilities

- Implement Dashboard with live flow rate, usage, sensor connection state, and leak state.
- Implement BLE Connection screen and connection/reconnection feedback.
- Implement Usage screen with hourly, daily, and weekly charts.
- Implement Leak History and Leak Detail screens.
- Implement active Leak Alarm screen and acknowledgement/stop controls.
- Implement Settings for configurable application behavior.
- Build reusable Button, Card, Badge, Chip, TextInput, loading, empty, and error components.
- Implement light/dark theme consistently.
- Ensure accessibility labels, logical navigation, readable text scaling, and non-color-only status communication.
# Testing Responsibilities

| Testing Area | Responsibility |
| --- | --- |
| Unit tests | Repositories, validators, telemetry parser, usage calculation, leak detection, stores |
| Component tests | Dashboard, charts, BLE connection, alarm, history, settings |
| Integration tests | BLE/mock telemetry → validation → SQLite → usage/leak logic → UI state |
| E2E tests | Core Android flows such as connection, monitoring, leak alarm, history, settings, and recovery |
| Performance tests | Startup, dashboard updates, charts, SQLite queries, and long-running monitoring |
| Accessibility tests | TalkBack, large font, touch targets, status communication |
| Hardware validation | Physical sensor connection and telemetry behavior when hardware is available |

- Simulator-based test results must be labeled as software/development validation.
- Physical sensor validation must be performed separately and must not be claimed when hardware is unavailable.
# GitHub and Delivery Responsibilities

- Maintain main, develop, feature/*, fix/*, and release/* branches as appropriate for the project's size.
- Create pull requests for meaningful changes even though the project is solo, so the history remains reviewable.
- Run linting and automated tests before merging important changes.
- Maintain GitHub Actions CI for lint, tests, security/dependency checks, and build validation.
- Maintain EAS configuration for Android development/internal/production builds.
- Keep secrets such as EAS tokens and signing credentials out of source control.
- Maintain release notes and document important architecture changes.
# Documentation Responsibilities

| Documentation | Owner / Timing |
| --- | --- |
| Project Overview, BRD, PRD, UX, TRD | Student — maintained throughout development |
| HLD, Database Design, API Specification, LLD | Student — update when architecture changes |
| Frontend, Security, Testing, CI/CD, Observability | Student — align with implementation |
| Deployment, Cost, Roadmap | Student — update before final release |
| README | Student — keep synchronized with actual setup |
| ADRs | Student — record significant technical decisions |
| Demo script and screenshots | Student — final phase |

# Mentor Responsibilities

- Review project direction and major technical decisions.
- Provide feedback on architecture, implementation approach, and OJT milestones.
- Review demonstration readiness and documentation completeness.
- Help identify risks, unrealistic scope, or missing validation.
- Guide the student when hardware-specific BLE decisions cannot be finalized independently.
Mentor involvement is advisory/review-oriented; implementation ownership remains with the student.

# Communication and Review

| Practice | Tool | Frequency |
| --- | --- | --- |
| Progress update | Mentor discussion / agreed communication channel | Weekly or milestone-based |
| Code review | GitHub Pull Request / commit review | For major changes |
| Architecture review | Documentation + mentor discussion | At major milestones |
| Testing review | Test reports / CI results | Each milestone |
| Demo review | Working application | Before final OJT demonstration |

- Because this is a solo project, communication should focus on milestone reviews rather than two-person daily standups.
- Important technical decisions should be recorded in the project documentation/ADRs instead of relying only on verbal discussions.
# Definition of Done

## Student

- Core BLE, telemetry, SQLite, usage, leak detection, alarm, dashboard, and history features are implemented and integrated.
- Repository and service tests cover critical logic.
- Core Android E2E flows pass.
- The application handles BLE disconnects, invalid telemetry, and recoverable errors without crashing.
- The physical sensor is tested when available; otherwise the hardware limitation is explicitly documented.
- CI/CD produces a valid Android internal build.
- Documentation accurately reflects the implemented application.
- The student can explain the architecture, code organization, data flow, leak-detection approach, testing strategy, and deployment process during the viva.
# Scope Control for a Solo Project

| Priority | Responsibility / Feature |
| --- | --- |
| Must Have | Physical BLE sensor integration, telemetry validation, SQLite storage, usage calculation, dashboard, leak detection, loud alarm, leak history, error handling |
| Should Have | Hourly/daily/weekly charts, configurable detection settings, reconnect recovery, accessibility hardening |
| Could Have | Water bill calculator, usage reports, unusual-usage detection, smart notifications |
| Future / Stretch | Multiple sensors, remote BLE shutoff valve, cloud sync, remote monitoring |

- The student should not sacrifice core leak-monitoring reliability to complete stretch features.
- A new feature should be added only if it does not destabilize BLE communication, data persistence, leak detection, or alarm behavior.
- The simulator should remain a testing aid rather than becoming a production architecture dependency.
# Summary

Unlike the two-person FitTrack sample, AquaSmart is a solo project, so all engineering responsibilities are owned by one student. The work is divided conceptually into mobile UI, BLE/IoT integration, data, core logic, testing, delivery, and documentation, but these are not separate team roles. This structure keeps ownership clear while allowing the project to remain achievable within the 9-week OJT roadmap.
