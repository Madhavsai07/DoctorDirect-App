**High-Level Design (HLD)**

**AquaSmart — Bluetooth Water Flow Meter & Leak Alarm App**

| Document ID | HLD-OJT-AQ-01 |
| --- | --- |
| Status | Draft |
| Date | 2026-09-07 |
| Track | Application Development / Mobile IoT |

# 1. System Architecture

AquaSmart is a mobile IoT monitoring system consisting of a native macOS BLE sensor simulator and a React Native mobile application. The OJT architecture does not require a backend server. The MacBook simulator acts as the BLE Peripheral/GATT Server, while the Android AquaSmart application acts as the BLE Central/GATT Client.

[ BLE Sensor Simulator — M5 MacBook ]
        │
        │ BLE / GATT notifications
        ▼
[ BLE Communication Layer ]
        │
        ▼
[ Telemetry Parser & Validation ]
        │
        ├──────────────► [ Live Monitoring State ]
        │                         │
        │                         ▼
        │                    [ Dashboard ]
        │
        ▼
[ Water Usage / Leak Analysis ]
        │
        ├──────────────► [ Alarm Service ]
        │
        └──────────────► [ Leak History ]
        │
        ▼
[ Repository Layer ]
        │
        ▼
[ SQLite — Local Device Storage ]

# 2. Architecture Diagram

┌──────────────────────────────────────────────────────────────┐
│              M5 MacBook — BLE Sensor Simulator              │
│                                                              │
│  Scenario Engine → Measurement Model → Packet Encoder        │
│                         ↓                                    │
│              CoreBluetooth Peripheral / GATT Server          │
└──────────────────────────┬───────────────────────────────────┘
                           │
                      Bluetooth LE
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                 Android — AquaSmart App                     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ UI Layer                                               │  │
│  │ Dashboard | Usage | Leak History | Settings            │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────▼───────────────────────────────┐  │
│  │ Application / State Layer                              │  │
│  │ Live telemetry | BLE state | alarm state | UI state    │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────▼───────────────────────────────┐  │
│  │ BLE Service                                            │  │
│  │ Scan → Connect → Discover → Subscribe → Receive       │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────▼───────────────────────────────┐  │
│  │ Telemetry Processing                                   │  │
│  │ Parse → Validate → Timestamp → Normalize              │  │
│  └───────────────┬───────────────────────┬────────────────┘  │
│                  │                       │                   │
│                  ▼                       ▼                   │
│       ┌────────────────────┐   ┌─────────────────────────┐ │
│       │ Usage Calculator   │   │ Leak Detection Engine   │ │
│       └──────────┬─────────┘   └────────────┬────────────┘ │
│                  │                          │               │
│                  └────────────┬─────────────┘               │
│                               ▼                             │
│                     ┌──────────────────┐                   │
│                     │ Repository Layer │                   │
│                     └────────┬─────────┘                   │
│                              ▼                             │
│                     ┌──────────────────┐                   │
│                     │ SQLite Database  │                   │
│                     └──────────────────┘                   │
│                              │                             │
│                              ▼                             │
│                     ┌──────────────────┐                   │
│                     │ Alarm / History  │                   │
│                     └──────────────────┘                   │
└──────────────────────────────────────────────────────────────┘

# 3. Component Responsibilities

## 3.1 BLE Sensor Simulator

| Component | Purpose | Key Responsibilities |
| --- | --- | --- |
| Scenario Engine | Select and execute controlled flow scenarios. | Normal flow, continuous flow, intermittent flow, high flow, zero flow, and error scenarios. |
| Measurement Model | Generate intended sensor measurements. | Produce flow values and maintain simulator ground truth. |
| Packet Encoder | Convert measurements into the defined BLE packet format. | Apply field encoding, scaling, byte order, status, and sequence information defined by the simulator specification. |
| CoreBluetooth Peripheral | Expose the simulated sensor over BLE. | Advertise device, expose GATT service/characteristic, and send telemetry notifications. |
| Simulator UI | Control scenarios during development/testing. | Start/stop scenarios, inspect current simulated values, and trigger error conditions. |

## 3.2 Mobile UI Layer

| Component | Purpose | Key Interactions |
| --- | --- | --- |
| Dashboard | Real-time monitoring. | Reads current flow, today's usage, BLE status, leak status, and continuous-flow duration. |
| Usage Screen | Water-consumption visualization. | Reads aggregated usage data and displays hourly, daily, and weekly charts. |
| Leak History | Review previous possible-leak events. | Reads stored leak events and opens event details. |
| Settings | Monitoring preferences. | Reads and updates supported leak/alarm settings. |
| BLE Connection Screen | Sensor connection management. | Scans, connects, disconnects, and reports BLE state. |
| Alarm UI | High-priority user notification. | Shows possible-leak warning and provides acknowledgement/stop interaction. |
| Testing Screen | Controlled application testing. | Displays or controls supported simulator scenarios where included in the development build. |

## 3.3 Application / State Layer

The state layer manages short-lived application state such as the current BLE connection, latest valid flow reading, live dashboard values, current leak state, and alarm state. Persistent historical data remains in SQLite and is accessed through repositories.

| State | Purpose |
| --- | --- |
| BLE Connection State | Disconnected, scanning, connecting, connected, discovering, subscribed, or error. |
| Live Telemetry State | Latest validated flow rate, timestamp, sequence information, and data quality state. |
| Usage State | Today's calculated usage and current aggregation values needed by the UI. |
| Leak State | Normal, suspicious/monitoring, possible leak, alarm active, and recovery/resolved state as defined by the leak engine. |
| Alarm State | Whether the alarm is active, acknowledged, or stopped. |
| UI State | Navigation, loading, error, and display preferences. |

## 3.4 BLE Communication Layer

The BLE communication layer isolates react-native-ble-plx from the rest of the application. It is responsible for discovering the AquaSmart simulator, connecting to it, discovering the defined GATT service and characteristic, subscribing to notifications, and forwarding raw telemetry to the parser.

| Responsibility | Description |
| --- | --- |
| Scan | Search for compatible AquaSmart BLE devices. |
| Connect | Establish a BLE connection with the selected simulator. |
| Discover | Discover the required service and flow-data characteristic. |
| Subscribe | Subscribe to characteristic notifications. |
| Receive | Receive raw encoded telemetry packets. |
| Disconnect | Report and handle BLE disconnection. |
| Reconnect | Allow the application to recover from a controlled disconnect. |

## 3.5 Telemetry Processing Layer

| Component | Purpose |
| --- | --- |
| Packet Parser | Convert raw BLE bytes into structured telemetry fields. |
| Validator | Reject malformed, impossible, duplicate, or otherwise invalid readings according to the protocol. |
| Normalizer | Convert valid telemetry into the application's standard flow-rate representation. |
| Timestamp Handler | Associate readings with application receipt time, or a protocol-provided timestamp when available. |
| Data Quality Handler | Track missing, delayed, duplicate, or out-of-order data conditions. |

## 3.6 Analysis Layer

| Component | Purpose | Output |
| --- | --- | --- |
| Water Usage Calculator | Convert flow rate and elapsed time into estimated volume. | Instant/interval volume and aggregated usage. |
| Usage Aggregator | Group stored usage into required time periods. | Hourly, daily, and weekly usage datasets. |
| Leak Detection Engine | Analyze flow magnitude, persistence, interruptions, and data quality. | Leak status/risk and detection event. |
| Alarm Service | Respond to a leak event. | Loud siren and visual alarm state. |

## 3.7 Repository Layer

Repositories provide a controlled boundary between application logic and SQLite. UI components and analysis services should not contain scattered raw SQL statements.

| Repository | Entities Managed | Key Operations |
| --- | --- | --- |
| FlowRepository | Flow readings | Insert validated readings, query readings by time range, retrieve latest readings. |
| UsageRepository | Usage summaries | Calculate/query hourly, daily, and weekly usage datasets. |
| LeakRepository | Possible-leak events | Create event, update event, list events, get event details. |
| SettingsRepository | Application settings | Read/write supported leak and alarm preferences. |

## 3.8 Persistence Layer — SQLite

A local SQLite database stores validated flow readings, usage-related data, possible-leak events, and supported settings.

Database initialization and schema migrations are isolated from application screens.

Indexes should be created for frequently queried timestamps and event fields.

Multi-step writes should use transactions where atomicity is required.

Historical data remains available after application restart.

# 4. Data Flow

## BLE Telemetry Flow

Simulator generates scenario
→ Measurement model produces intended flow value
→ Packet encoder creates BLE payload
→ CoreBluetooth sends notification
→ AquaSmart BLE layer receives raw bytes
→ Packet parser decodes fields
→ Validator checks packet/data
→ Valid reading is normalized and timestamped
→ Reading is stored in SQLite
→ Live dashboard state is updated
→ Usage calculator updates consumption
→ Leak detection engine evaluates flow pattern
→ If alarm conditions are satisfied, Alarm Service activates
→ Possible-leak event is stored in Leak History

## Water Usage Calculation Flow

Validated reading N received
→ Compare timestamp with previous valid reading
→ Determine elapsed time
→ Use flow rate × elapsed time to estimate volume
→ Add interval volume to the relevant aggregation period
→ Persist/query aggregated data as required
→ Update Dashboard and Usage charts

## Leak Detection Flow

Validated flow readings
→ Check data quality
→ Evaluate flow magnitude
→ Evaluate persistence and continuity
→ Consider interruptions / recovery
→ Determine current flow state
→ Maintain suspicious-flow duration/state
→ Apply configured detection conditions
→ If conditions are satisfied:
   → Create possible-leak event
   → Update Dashboard leak state
   → Activate alarm
→ Continue monitoring for recovery
→ Close/resolve event when recovery conditions are satisfied

# 5. Navigation Architecture

┌───────────────────────────────────────────────────────────┐
│                    Bottom Tab Navigator                   │
├───────────────┬───────────────┬──────────────┬────────────┤
│  Dashboard    │    Usage      │ Leak History │  Settings  │
└───────┬───────┴───────────────┴──────┬───────┴────────────┘
        │                              │
        ▼                              ▼
 BLE Connection                    Leak Detail
        │
        ▼
  Scan / Connect
        │
        ▼
   Monitoring
        │
        ├──────────────► Active Alarm
        │
        ▼
   Usage / History

# 6. Scalability

| Concern | Strategy |
| --- | --- |
| Large Flow History | Use SQLite indexes and time-range queries; avoid loading the entire history into memory. |
| High Telemetry Rate | Process readings through a dedicated telemetry pipeline and batch non-critical persistence where appropriate. |
| Long-Term History | Aggregate usage by hour/day/week for chart views instead of rendering raw readings directly. |
| Many Leak Events | Paginate Leak History and query by indexed timestamps. |
| Multiple Sensors — Future | Keep the sensor identity and BLE communication boundary separate so additional compatible sensors can be supported later. |
| Future Shutoff Valve | Keep outbound BLE command handling separate from inbound telemetry processing. |

# 7. Reliability

| Mechanism | Implementation |
| --- | --- |
| Telemetry Validation | Malformed or impossible readings are rejected before usage/leak analysis. |
| BLE Recovery | Connection state is explicitly tracked and reconnect can be attempted after controlled disconnects. |
| Database Transactions | Use transactions for operations that must be atomic, such as creating a leak event and related records. |
| Duplicate Protection | Use sequence information and/or timestamps from the defined protocol to identify duplicate readings. |
| Out-of-Order Handling | Detect readings that arrive out of order and prevent them from corrupting interval calculations. |
| Missing Data Handling | Missing telemetry is treated as a data-quality condition rather than automatically as zero flow. |
| Alarm Recovery | Alarm activation and stop/acknowledgement are managed separately from leak classification. |
| Simulator Ground Truth | Expected simulator values provide a reference for parser and end-to-end verification. |

# 8. Security Architecture

| Concern | Implementation |
| --- | --- |
| Local Data Privacy | Core operational data is stored locally in the application's private storage. |
| BLE Data Validation | Only packets matching the defined application protocol are processed. |
| Input Validation | Flow and protocol fields are validated before database insertion or analysis. |
| No Backend Credentials | MVP does not require cloud API keys, user passwords, or server credentials. |
| Permissions | Request only the Bluetooth/device permissions necessary for the mobile BLE workflow. |
| Future Valve Commands | Any future shutoff command must identify the intended compatible device and validate command state before transmission. |

# 9. Observability

| Signal | Tool / Method | When Used |
| --- | --- | --- |
| BLE Connection State | Development logging | During scan, connect, discovery, subscription, disconnect, and reconnect testing. |
| Raw Packet Diagnostics | Parser debug logs | During simulator and parser development. |
| Validation Failures | Validation logs | When malformed, duplicate, out-of-order, or impossible data is encountered. |
| Leak Detection State | Detection diagnostics | During controlled normal/leak/error scenario testing. |
| SQLite Operations | Repository timing/error logs | When diagnosing failed or slow database operations. |
| Alarm Events | Alarm service logs | When alarm starts, stops, or recovers. |
| Simulator Scenario | Simulator console/logging | To confirm the intended scenario and ground-truth readings. |

*AquaSmart — High-Level Design | Polaris School of Technology*
