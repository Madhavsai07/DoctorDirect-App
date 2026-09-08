Architecture Decision Records (ADRs)

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App

Document ID: ADR-IOT-01
Status: Draft
Track: Application Development / Mobile IoT

This document records important architecture and technology decisions for AquaSmart. The decisions are tailored to the project's Android-first BLE architecture, local SQLite storage, nine-week OJT timeline, and solo development scope.

# ADR-001 — Framework: Expo + React Native over Bare React Native

## Context

AquaSmart needs a mobile UI, SQLite persistence, Android deployment, audio alarm support, and BLE communication. The project has a nine-week OJT schedule and is developed by one student. The architecture should minimize unnecessary native-project maintenance while still allowing the native BLE capability required by the physical sensor.

## Options Considered

| Option | Setup / Maintenance | BLE Support | SQLite | Build Complexity |
| --- | --- | --- | --- | --- |
| Expo + React Native | Lower | Requires compatible native BLE development build | Yes | Lower |
| Bare React Native | Higher | Full native control | Yes | Higher |
| Native Android only | Higher for cross-layer UI work | Excellent | Yes | Higher |

## Decision

**Expo + React Native**

## Rationale

- Provides a productive React Native development model for the nine-week OJT.
- Expo tooling and EAS simplify Android builds and project configuration.
- expo-sqlite fits the local-first data architecture.
- React Native keeps UI development modular while allowing native dependencies where required.
- Using a development build avoids assuming that Expo Go contains every native BLE capability.
## Trade-offs

- Native BLE integration may require additional Expo configuration or a development build.
- Some future hardware-specific native requirements may require deeper native integration.
- Expo SDK/library compatibility must be checked when selecting the BLE package version.
## Consequences

- The repository uses Expo configuration and EAS build profiles.
- BLE functionality is validated in a native-capable Android development build.
- The application remains JavaScript-based; TypeScript is not introduced solely because of framework conventions.
# ADR-002 — BLE Communication: Physical Sensor as Production Source

## Context

The core product depends on receiving water-flow telemetry from a real BLE water-flow sensor. The OJT does not have the physical sensor hardware, so a simulator is needed for controlled development tests. The architecture must not accidentally make the simulator appear to be the production device.

## Options Considered

| Option | Production Fit | Testing Use | Hardware Realism |
| --- | --- | --- | --- |
| Physical BLE sensor | Primary | Later hardware validation | Highest |
| BLE simulator | Not production | Primary OJT controlled testing | Controlled |
| Cloud/API telemetry | Not required for MVP | Possible future integration | Indirect |

## Decision

**Physical BLE water-flow sensor → Android AquaSmart app**

## Rationale

- The real-world data path is direct BLE communication from the physical sensor to the Android app.
- Android acts as the BLE Central / GATT Client.
- Local processing avoids a backend dependency for core monitoring.
- The simulator can reproduce known telemetry scenarios without changing the production architecture.
## Trade-offs

- Physical hardware protocol details cannot be finalized until the sensor is selected.
- BLE permissions, pairing, bonding, reconnect behavior, and packet details require hardware-specific validation.
- OJT testing cannot prove physical-sensor interoperability before hardware is available.
## Consequences

- BleService is designed around the physical sensor contract.
- BleSimulatorService is isolated to development/testing.
- Service UUIDs, characteristic UUIDs, packet structure, scaling, byte order, and status fields remain TBD until hardware selection.
# ADR-003 — Database: SQLite over Key-Value Storage

## Context

AquaSmart stores timestamped flow readings, usage records, leak events, sensor metadata, and settings. History and chart features require filtering, grouping, ordering, and time-based queries.

## Options Considered

| Option | Relational Queries | History/Charts | Migration | Fit |
| --- | --- | --- | --- | --- |
| SQLite / expo-sqlite | Yes | Strong | Manual/code-managed | High |
| AsyncStorage | No | Weak for large history | Not relational | Low |
| MMKV | No | Weak for relational data | Not relational | Low |
| WatermelonDB | Yes | Strong | Built-in patterns | Medium |

## Decision

**SQLite through expo-sqlite**

## Rationale

- Flow telemetry and leak history are naturally tabular and time-series oriented.
- SQL supports aggregation for hourly, daily, and weekly usage.
- SQLite keeps the MVP local-first and avoids backend infrastructure.
- Repository separation keeps SQL away from UI components.
- Manual migrations are acceptable at OJT scale.
## Trade-offs

- Migration code must be maintained carefully.
- Large long-term telemetry datasets may require retention and aggregation strategies.
- Database encryption is not assumed by the MVP and can be revisited if threat analysis requires it.
## Consequences

- All core business data goes through repositories.
- Schema migrations are versioned in the database module.
- Indexes are added for timestamps, sensor identifiers, and event lookup patterns.
# ADR-004 — State Management: Zustand for Client State

## Context

AquaSmart needs transient application state for BLE connection status, alarm state, settings UI, and development/testing controls. Persistent business data belongs in SQLite rather than being treated as global in-memory state.

## Options Considered

| Option | Boilerplate | Fit for Mobile UI State | Complexity |
| --- | --- | --- | --- |
| Zustand | Low | High | Low |
| Redux Toolkit | Moderate | High | Moderate |
| Context + useReducer | Moderate | Medium | Moderate |
| Jotai | Low | High | Low |

## Decision

**Zustand**

## Rationale

- Simple stores fit a solo React Native project.
- Connection and alarm state can update without excessive provider nesting.
- Stores can remain small and focused.
- Persistent records remain in SQLite rather than duplicating the database in global state.
## Trade-offs

- Developers must avoid mutating state incorrectly.
- Global stores can become overused if repository-backed data is placed there unnecessarily.
## Consequences

- connectionStore handles BLE connection state.
- alarmStore handles active alarm UI/control state.
- settingsStore handles user preferences.
- testingStore is development-only and must not become a production dependency.
# ADR-005 — Data Access: Repository Layer with Query Hooks

## Context

UI screens need flow history, usage summaries, leak events, sensor information, and settings. Direct SQL calls from screens would couple presentation code to persistence details and make testing harder.

## Options Considered

| Option | Separation | Testability | Reuse | Complexity |
| --- | --- | --- | --- | --- |
| Repositories + hooks | Strong | Strong | Strong | Moderate |
| Direct SQLite in screens | Weak | Weak | Low | Low initially |
| Single global data service | Medium | Medium | Medium | Medium |

## Decision

**Repositories for SQLite access, with reusable React hooks for screen consumption**

## Rationale

- Repositories provide a stable boundary around SQL operations.
- Hooks expose loading, error, and data states to React screens.
- Business services can use repositories without depending on UI components.
- Tests can mock or isolate repository boundaries.
## Trade-offs

- More files and abstraction than direct SQL.
- Query invalidation and refresh behavior must be designed consistently.
- TanStack Query is useful for read/query state but does not replace the repository layer.
## Consequences

- Screens do not contain raw SQL.
- Repositories map to sensors, flow readings, usage, leak events, and settings.
- Hooks provide reusable access patterns for dashboard, charts, and history screens.
# ADR-006 — Leak Detection: Pattern/State-Based Rules over Machine Learning

## Context

The application must identify suspicious water-flow behavior while avoiding the false assumption that any single high flow reading is a leak. The OJT has limited data and no physical sensor history, so a transparent deterministic approach is more appropriate than machine learning.

## Options Considered

| Option | Data Requirement | Explainability | OJT Fit | Implementation Risk |
| --- | --- | --- | --- | --- |
| Pattern/state-based rules | Low | High | High | Low |
| Simple threshold + timer | Low | High | Medium | Low |
| Machine learning | High | Lower | Low | High |
| Cloud anomaly service | High | Variable | Low | High |

## Decision

**Pattern/state-based leak detection**

## Rationale

- It can reason about persistence, flow behavior, interruptions, data quality, and recovery.
- Rules are deterministic and straightforward to test with simulator ground truth.
- It does not require a training dataset.
- Thresholds and timing can be tuned as configuration rather than hidden model behavior.
## Trade-offs

- Rule-based detection may require calibration for different homes and sensor characteristics.
- It cannot guarantee detection of every real-world leak.
- A controlled 30-minute continuous suspicious-flow scenario is a test condition, not a universal leak definition.
## Consequences

- LeakDetectionService remains independent from the UI.
- Detection decisions can be unit-tested against scenario-driven telemetry.
- Future versions can introduce more advanced anomaly detection without changing the UI/data boundaries.
# ADR-007 — Telemetry Handling: Parse and Validate Before Persistence

## Context

BLE data may be malformed, incomplete, duplicated, out of order, or disconnected. Persisting unvalidated data could corrupt usage calculations and leak detection.

## Options Considered

| Option | Data Quality | Debuggability | Complexity |
| --- | --- | --- | --- |
| Parse → Validate → Store | High | High | Moderate |
| Store raw payload first | Medium | High | Higher downstream |
| Direct parse into database | Low | Low | Low initially |

## Decision

**Parse and validate telemetry before business analysis and persistence**

## Rationale

- Separating parsing from validation makes protocol errors easier to isolate.
- Invalid readings can be rejected or marked with explicit quality information.
- Usage and leak detection receive a cleaner input contract.
- Controlled simulator scenarios can exercise each validation rule.
## Trade-offs

- Some raw packet information may be unavailable after rejection unless diagnostics are intentionally retained.
- Exact validation rules depend on the final sensor protocol.
## Consequences

- TelemetryParserService and TelemetryValidationService remain separate modules.
- Duplicate, missing, out-of-order, impossible, and malformed data are explicit test cases.
- Hardware-specific protocol assumptions remain configurable/TBD.
# ADR-008 — Local-First MVP without a Backend

## Context

The core product requirements are monitoring, usage history, leak detection, and local alarm behavior. A cloud backend would add authentication, API hosting, network failure modes, cost, and privacy complexity without being necessary for the MVP.

## Options Considered

| Option | Offline Operation | Infrastructure | Privacy Complexity | OJT Fit |
| --- | --- | --- | --- | --- |
| Local-first SQLite | Strong | Minimal | Lower | High |
| Cloud backend | Weak without sync | Higher | Higher | Low |
| Hybrid sync | Medium | Higher | Higher | Medium |

## Decision

**Local-first architecture with no required backend for MVP**

## Rationale

- Core functionality can operate without internet.
- SQLite is sufficient for local history and analysis.
- Reduces deployment and operational complexity.
- Improves privacy by avoiding mandatory cloud storage of household water-usage data.
## Trade-offs

- No remote access to data in the MVP.
- Multi-device synchronization is deferred.
- Cloud-based notifications and remote control require additional security architecture later.
## Consequences

- The app must not assume network availability for core monitoring.
- Future cloud features can be added behind explicit service boundaries.
- Remote BLE shutoff valve control remains future scope and requires separate safety/security decisions.
# Decision Summary

- Expo + React Native is selected for the mobile application, with Android as the primary target.
- The physical BLE water-flow sensor is the production telemetry source; the BLE simulator is development/testing only.
- SQLite provides the local relational data store.
- Zustand manages focused client/UI state, while persistent business data remains in SQLite.
- Repositories isolate SQLite access from the UI, with hooks providing reusable screen-level data access.
- Leak detection uses transparent pattern/state-based logic rather than machine learning.
- Telemetry is parsed and validated before it is used for usage calculation and leak analysis.
- The MVP remains local-first and does not require a cloud backend.
# Deferred Decisions

- Final physical BLE sensor model and vendor.
- Exact BLE service and characteristic UUIDs.
- Final telemetry packet format, byte order, scaling, units, and status codes.
- Pairing/bonding/authentication requirements for the selected sensor.
- Whether database encryption is required after a detailed threat analysis.
- Exact hardware calibration procedure and leak-detection tuning using physical-sensor data.
- Remote BLE shutoff valve protocol and safety controls.
- Future cloud synchronization, remote notifications, or multi-device support.
# Review Principle

These ADRs should be revisited when a physical sensor is selected, when native BLE constraints are discovered, or when the project moves beyond the OJT MVP. Hardware-specific decisions should be based on the selected sensor's official protocol documentation and actual Android interoperability testing rather than assumed values.
