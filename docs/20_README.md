README

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App

A mobile IoT application for monitoring household water flow through a Bluetooth Low Energy (BLE) water-flow sensor, calculating water usage, and detecting suspicious flow patterns that may indicate a leak.

# The Problem

- Household water leaks can remain unnoticed for long periods, wasting water and increasing expenses.
- Users may not have continuous visibility into current water flow or accumulated water usage.
- A simple flow sensor alone does not provide a complete mobile experience for monitoring, history, and leak alerts.
- During the OJT, physical sensor hardware is unavailable, so controlled BLE telemetry simulation is needed for development and testing.
# The Solution

AquaSmart connects an Android mobile application to a physical BLE water-flow sensor. The app receives flow telemetry, validates and stores readings locally in SQLite, calculates water usage, analyzes flow patterns for possible leaks, and presents the results through a dashboard, charts, leak history, and an audible alarm.

For OJT development and controlled testing only, a BLE simulator can temporarily provide scenario-driven telemetry when the physical sensor is unavailable. The simulator is not a production dependency.

# Features

| Feature | Scope |
| --- | --- |
| BLE water-flow sensor connection | Core |
| Real-time flow-rate display | Core |
| Telemetry parsing and validation | Core |
| Local SQLite storage | Core |
| Water usage calculation | Core |
| Hourly, daily, and weekly usage charts | Core |
| Pattern/state-based leak detection | Core |
| Loud leak alarm | Core |
| Leak history and event details | Core |
| BLE disconnect and invalid-data handling | Core |
| BLE simulator for controlled test scenarios | Development / Testing |
| Testing and simulation controls | Development / Testing |
| Water bill calculator | Stretch |
| Usage reports and smart notifications | Future |
| Multiple sensor support | Future |
| Remote BLE shutoff valve control | Future |

# Screens

- Dashboard — current flow rate, connection status, usage summary, and leak status.
- BLE Connection — sensor discovery, connection state, and reconnect feedback.
- Usage — hourly, daily, and weekly consumption charts.
- Leak History — previously detected leak events.
- Leak Detail — details for an individual leak event.
- Active Leak Alarm — prominent warning and audible alarm controls.
- Settings — monitoring and alarm preferences.
- Testing / Simulation Controls — development-only controls for generating controlled telemetry scenarios.
# Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | React Native + Expo |
| Language | JavaScript |
| Routing | Expo Router |
| State | Zustand |
| Data Queries | TanStack Query where useful |
| Database | expo-sqlite / SQLite |
| BLE | react-native-ble-plx |
| Audio | expo-av |
| Charts | React Native-compatible charting library |
| Testing | Jest + React Native Testing Library + Android E2E testing |
| CI/CD | GitHub Actions + EAS Build |
| Primary Platform | Android |

# Quick Start

## Prerequisites

- Node.js LTS
- npm
- Git
- Android device or Android Emulator
- Expo development tooling compatible with the selected Expo SDK
## Installation

git clone <repository-url>

cd aquasmart

npm install

npx expo start

## Run on Android

npx expo start --android

For actual BLE integration, use a development build/environment that supports the required native BLE functionality. Do not assume Expo Go alone provides every native capability required by the final BLE implementation.

# Architecture

Production data path

Physical BLE Water Flow Sensor

↓ BLE

AquaSmart Android App

↓

BLE Connection Service

↓

Telemetry Parser

↓

Telemetry Validation

↓

SQLite Repositories

↓

Usage Calculation + Leak Detection

↓

Dashboard / Charts / Leak History / Alarm

Development and testing substitution

BLE Simulator

↓ controlled telemetry

AquaSmart Android App

↓

Telemetry Parser + Validation + Analysis

The production architecture is sensor-first: the physical BLE water-flow sensor is the intended real-world telemetry source. The simulator exists only to support OJT development and controlled tests.

# Data Model

- sensors — registered BLE sensor metadata and connection information.
- flow_readings — timestamped flow-rate telemetry and data-quality information.
- usage_records — calculated water consumption for defined time periods.
- leak_events — detected suspicious-flow events, status, timestamps, and supporting information.
- settings — monitoring and alarm preferences.
# Leak Detection

AquaSmart uses pattern/state-based leak detection rather than treating one flow-rate threshold as proof of a leak. The analysis can consider persistence, flow characteristics, interruptions, data quality, and recovery. A condition such as continuous suspicious flow for 30 minutes can be used as a controlled OJT test scenario, but it is not a universal definition of a household leak or a guarantee of real-world detection accuracy.

# Development BLE Simulator

- Normal flow
- Continuous flow
- Intermittent flow
- Sudden high flow
- No flow
- Sensor error
- Invalid packet
- Missing packet
- Duplicate packet
- Out-of-order packet
- Impossible flow value
- BLE disconnect
The simulator maintains expected scenario behavior so that validation and leak-detection results can be compared with known test conditions. Exact physical-sensor service UUIDs, characteristic UUIDs, packet layout, byte order, scaling, and status values remain TBD until the physical sensor hardware is selected.

# Testing

- Unit tests for repositories, telemetry parsing and validation, usage calculations, and leak detection.
- Component tests for dashboard, charts, connection state, leak history, and alarm UI.
- Integration tests covering telemetry through validation, persistence, usage analysis, and leak detection.
- Android E2E tests for onboarding, BLE connection behavior, dashboard, leak alarm, and settings.
- Controlled simulator scenarios for malformed, missing, duplicate, out-of-order, and abnormal telemetry.
- Physical sensor validation is hardware-dependent and is not claimed as completed during the OJT.
# Building the App

npm install -g eas-cli

eas login

eas build --platform android --profile development

eas build --platform android --profile internal

The exact build profiles and Android application configuration should match the project's committed eas.json and deployment configuration.

# Project Structure

- app/ — Expo Router routes and screens.
- components/ — reusable React Native UI components.
- stores/ — Zustand client and UI state.
- hooks/ — reusable React hooks and data-query hooks.
- repositories/ — SQLite data-access layer.
- database/ — SQLite client, schema, migrations, and seed data.
- services/ — BLE, telemetry, usage, leak detection, alarm, and testing services.
- theme/ — design tokens and theme utilities.
- types/ — shared model and error definitions represented in JavaScript modules.
- utils/ — date, unit, flow, and validation utilities.
- __tests__/ — unit, component, and integration tests.
- e2e/ — Android end-to-end tests.
- docs/ — separate OJT documentation deliverables.
- .github/ — CI/CD workflows and GitHub templates.
# Documentation Index

- 01 — Project Overview
- 02 — Business Requirements Document (BRD)
- 03 — Product Requirements Document (PRD)
- 04 — UX Requirements
- 05 — Technical Requirements Document (TRD)
- 06 — High-Level Design (HLD)
- 07 — Database / Data Design
- 08 — Repository API Specification
- 09 — Low-Level Design (LLD)
- 10 — Frontend Architecture
- 11 — Security Design
- 12 — Testing Strategy
- 13 — CI/CD Pipeline
- 14 — Observability Design
- 15 — Deployment Architecture
- 16 — Cost Analysis
- 17 — Project Roadmap
- 18 — Team Responsibilities
- 19 — GitHub Repository Structure
- 20 — README
- 21 — Architecture Decision Records (ADRs)
# Privacy and Data Handling

- The MVP is designed as a local-first mobile application without a required backend account.
- Flow readings, usage history, leak events, and settings are stored locally in SQLite.
- The MVP does not require a cloud backend for core monitoring and history features.
- BLE permissions should be requested only when required and explained to the user.
- Logs and diagnostics should avoid unnecessary sensitive information.
# Project Information

- Student: Chinthaginjala Madhav Sai Kiran
- Roll No: 25100010700016
- Year & Section: Sem 3 A
- Project: Solo OJT
- Mentor: Kshitiz Dhooria
- Institution: Polaris School of Technology
- Duration: 9 weeks
- Project Type: Application Development / Mobile IoT
- Target Users: Homeowners and Plumbers
# License

License terms can be finalized according to the OJT/project submission requirements.

# Scope Note

This README describes the intended OJT architecture and implementation scope. It does not claim that physical sensor integration has already been validated. Hardware-specific BLE protocol details remain subject to the selected sensor, while advanced capabilities such as remote BLE shutoff control remain future scope.
