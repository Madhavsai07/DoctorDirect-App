**Project Roadmap**

**AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App**

Document ID: ROAD-AS-01

Status: Draft

Date: 2026-09-07

Track: Application Development / Mobile IoT

Duration: 9 Weeks

# Overview

Week 1 → Research + Setup + Architecture
Week 2 → UX/UI Design + Navigation Skeleton
Week 3 → BLE Foundation + SQLite Database + Repositories
Week 4 → Telemetry Processing + Usage Calculation
Week 5 → Leak Detection + Alarm + Dashboard
Week 6 → Usage Charts + Leak History + Settings
Week 7 → Polish + Accessibility + Error Recovery
Week 8 → Testing + CI/CD + EAS Build
Week 9 → Documentation + Demo Prep + Final Validation

The roadmap is deliberately adjusted from the FitTrack sample to AquaSmart's 9-week OJT duration and mobile-IoT scope. The physical BLE water-flow sensor is the production input. Because physical hardware is not currently available, controlled BLE simulator/mock telemetry is used only for development and testing until hardware becomes available.

# Phase 1 — Research + Setup + Architecture (Week 1)

## Deliverables

☐ Understand React Native + Expo project structure and the JavaScript development workflow

☐ Understand react-native-ble-plx central/client architecture and Android BLE permissions

☐ Study BLE GATT concepts: service, characteristic, notifications, connection/disconnection, and device discovery

☐ Define the hardware-independent telemetry model while leaving final UUIDs/payload structure as TBD

☐ Understand expo-sqlite database access, transactions, migrations, and local persistence

☐ Set up Android Studio, Android emulator, Node.js, Expo, Git, and GitHub repository

☐ Create AquaSmart Expo project using JavaScript

☐ Configure ESLint + Prettier and basic testing setup

☐ Create initial application architecture and module boundaries

## Definition of Done

- AquaSmart development project starts without errors.
- Application launches on Android emulator.
- Git repository and branch strategy are initialized.
- Architecture identifies physical BLE sensor as the production data source.
- BLE simulator/mock boundary is defined strictly for testing.
# Phase 2 — UX/UI Design + Navigation (Week 2)

## Deliverables

☐ Define AquaSmart visual design tokens for light and dark themes

☐ Create navigation structure for Dashboard, Usage, Leak History, and Settings

☐ Design BLE Connection screen/state

☐ Design Dashboard with live flow rate, current usage, connection status, and leak status

☐ Design Usage screen with hourly/daily/weekly views

☐ Design Leak History and Leak Detail screens

☐ Design active Leak Alarm screen with prominent alert and safe acknowledgement/stop controls

☐ Design onboarding/permissions guidance

☐ Implement primitive UI components such as Button, Card, Badge, Chip, and TextInput

## Definition of Done

- All major screens are navigable.
- Light/dark theme works consistently.
- BLE connection, disconnected, sensor-error, and active-alarm states have defined UI.
- Core UI components render without errors.
# Phase 3 — BLE Foundation + Database + Repositories (Week 3)

## Deliverables

☐ Implement BLE service abstraction around react-native-ble-plx

☐ Implement device discovery, connection, disconnect, and reconnect handling

☐ Create hardware-independent telemetry data model

☐ Implement telemetry parser and validation layer

☐ Set up expo-sqlite

☐ Create initial SQLite schema for sensors, flow_readings, usage_records, leak_events, and settings

☐ Implement migration runner

☐ Implement SensorRepository

☐ Implement FlowReadingRepository

☐ Implement UsageRepository

☐ Implement LeakEventRepository

☐ Implement SettingsRepository

☐ Write unit tests for repositories and telemetry validation

## Definition of Done

- Mock/test BLE data can pass through the BLE abstraction into the parser.
- Valid telemetry can be persisted to SQLite.
- Invalid telemetry is rejected safely.
- Database migrations execute successfully on a clean database.
# Phase 4 — Telemetry Processing + Usage Calculation (Week 4)

## Deliverables

☐ Implement normalized telemetry state/store

☐ Implement flow-rate and timestamp processing

☐ Implement water usage calculation from flow rate and elapsed time

☐ Handle zero flow, missing data, duplicate data, out-of-order data, and invalid readings

☐ Persist representative flow readings and usage records

☐ Build real-time dashboard data hooks

☐ Add deterministic BLE test scenarios: normal, continuous, intermittent, sudden high flow, no flow, sensor error

☐ Test calculated usage against known simulator ground truth

## Definition of Done

- Valid simulated telemetry updates the application state.
- Water usage totals are calculated consistently.
- Invalid/duplicate/out-of-order readings do not silently corrupt usage totals.
- Dashboard can display a current flow value and connection state.
# Phase 5 — Leak Detection + Alarm + Dashboard (Week 5)

## Deliverables

☐ Implement configurable pattern/state-based leak detection service

☐ Define normal-flow, suspicious-flow, suspected-leak, active-alarm, and resolved conditions

☐ Implement controlled OJT continuous-flow test condition

☐ Avoid treating a single high-flow sample as automatically meaning a leak

☐ Implement leak event persistence

☐ Implement loud alarm behavior using supported mobile audio capabilities

☐ Implement alarm acknowledgement/stop behavior

☐ Show prominent active-leak state on Dashboard

☐ Add leak detection tests for normal, intermittent, continuous suspicious, recovery, and sensor-error scenarios

## Definition of Done

- Controlled suspicious-flow scenarios trigger the expected leak state.
- Normal/intermittent patterns do not create avoidable false alarms under configured test rules.
- Leak events are stored in SQLite.
- Alarm can be stopped/acknowledged safely.
- The OJT test duration is documented as a test condition, not a universal real-world leak definition.
# Phase 6 — Usage Charts + Leak History + Settings (Week 6)

## Deliverables

☐ Implement hourly usage chart

☐ Implement daily usage chart

☐ Implement weekly usage chart

☐ Implement usage history queries and aggregation

☐ Implement Leak History list

☐ Implement Leak Detail screen

☐ Implement sensor/connection status history where useful

☐ Implement Settings screen

☐ Add configurable leak-detection parameters where appropriate

☐ Add water bill calculator as an optional stretch feature if core features are stable

## Definition of Done

- Charts display stored usage data correctly.
- Leak history shows active and resolved events.
- Settings persist after app restart.
- Optional features do not delay core BLE monitoring, usage, leak detection, and alarm functionality.
# Phase 7 — Polish + Accessibility + Error Recovery (Week 7)

## Deliverables

☐ Add loading, empty, disconnected, sensor-error, and database-error states

☐ Add application error boundary

☐ Implement BLE reconnect/recovery behavior

☐ Implement crash recovery for active leak events

☐ Add accessibility labels to interactive controls

☐ Test TalkBack navigation

☐ Test large font scaling

☐ Ensure leak state is not communicated through color alone

☐ Support reduced-motion preferences where practical

☐ Optimize dashboard and chart rendering

☐ Review hardcoded values and move stable UI tokens/configuration into centralized modules

## Definition of Done

- Core local features continue to work without internet connectivity.
- BLE disconnects produce a clear state and recovery path.
- Application does not crash on invalid telemetry.
- Accessibility and error-state review is completed.
# Phase 8 — Testing + CI/CD + EAS Build (Week 8)

## Deliverables

☐ Complete repository unit tests

☐ Complete telemetry parser and validation tests

☐ Complete usage calculation tests

☐ Complete leak detection branch/edge-case tests

☐ Complete component tests

☐ Complete integration tests

☐ Complete Android Detox E2E smoke tests

☐ Set up GitHub Actions CI

☐ Set up security/dependency checks

☐ Set up EAS internal Android build

☐ Generate installable Android APK

☐ Run performance tests on representative Android hardware

☐ Run physical BLE sensor tests if the selected sensor is available

## Definition of Done

- Automated unit/component/integration tests pass.
- Core Android E2E flows pass.
- GitHub Actions CI is green on pull requests.
- Android internal APK builds and installs.
- Physical sensor validation is recorded separately from simulator validation.
# Phase 9 — Documentation + Demo Prep + Final Validation (Week 9)

## Deliverables

☐ Finalize all AquaSmart project documentation

☐ Finalize README with setup, testing, and architecture information

☐ Finalize Architecture Decision Records

☐ Complete requirements-to-test traceability matrix

☐ Review security and privacy documentation

☐ Review cost analysis and deployment documentation

☐ Prepare 5-minute project demonstration

☐ Capture screenshots from the application

☐ Organize GitHub repository professionally

☐ Update CHANGELOG/release notes

☐ Practice demo at least twice

☐ Prepare final OJT submission package

## Definition of Done

- Fresh setup can be completed using the README without major ambiguity.
- Core demonstration works reliably.
- Documentation is internally consistent.
- Known hardware limitations are explicitly documented.
- Final demo explains the difference between physical-sensor production architecture and simulator-based OJT testing.
# Milestone Summary

| Milestone | Week | Description |
| --- | --- | --- |
| M1 — Architecture & Setup | End of Week 1 | AquaSmart project running with defined mobile-IoT architecture |
| M2 — UI Shell | End of Week 2 | Core screens, navigation, themes, and connection states defined |
| M3 — BLE + Database Foundation | End of Week 3 | BLE abstraction, telemetry validation, SQLite schema, and repositories ready |
| M4 — Telemetry + Usage | End of Week 4 | Validated flow data processed and water usage calculated |
| M5 — Leak Detection MVP | End of Week 5 | Leak detection, event persistence, dashboard status, and alarm working |
| M6 — Full MVP UI | End of Week 6 | Charts, leak history, settings, and core user experience complete |
| M7 — Quality Ready | End of Week 7 | Accessibility, recovery, error handling, and performance polish complete |
| M8 — Tested Build | End of Week 8 | Automated tests, CI/CD, and Android internal APK complete |
| M9 — OJT Ready | End of Week 9 | Documentation, demo, final validation, and submission package complete |

# Priority and Scope Control

| Priority | Features |
| --- | --- |
| Must Have | BLE connection, telemetry parsing/validation, SQLite storage, flow/usage calculation, real-time dashboard, leak detection, loud alarm, leak history, error handling |
| Should Have | Hourly/daily/weekly charts, configurable detection settings, reconnect handling, accessibility improvements, usage reports |
| Could Have | Water bill calculator, unusual-usage detection, smart notifications, multiple sensors |
| Future / Stretch | Remote BLE shutoff valve, cloud sync, multi-device access, remote monitoring |

- If schedule pressure occurs, protect the Must Have features first.
- Do not add cloud/backend infrastructure to the MVP unless a clear requirement is introduced.
- Do not make the BLE simulator a production dependency.
- Do not claim real-world leak-detection accuracy without physical-sensor and controlled field validation.
# Summary

This 9-week roadmap gives AquaSmart a focused path from architecture and BLE/database foundations through telemetry processing, leak detection, alarm behavior, dashboard/history features, quality hardening, testing, deployment, and final OJT documentation. The schedule deliberately separates the software-testing phase, where simulator/mock telemetry is useful, from the real production architecture, where the Android application communicates with the physical BLE water-flow sensor.
