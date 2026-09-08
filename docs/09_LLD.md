Low-Level Design (LLD)

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App

| Field | Details |
| --- | --- |
| Document ID | LLD-FE-01 |
| Status | Draft |
| Track | Frontend / Mobile IoT Development |

This LLD translates the AquaSmart architecture into concrete modules, JavaScript files, components, services, state management, validation rules, and runtime interactions. It is tailored to the offline-first mobile app and the native macOS BLE simulator. It does not assume a physical flow sensor is available.

# 1. Module Architecture

src/
├── app/                              # Expo Router routes
│   ├── (tabs)/
│   │   ├── index.js                  # Dashboard
│   │   ├── usage.js                  # Usage charts/history
│   │   ├── leaks.js                  # Leak history
│   │   └── settings.js               # Settings
│   ├── (modals)/
│   │   ├── ble-connect.js            # BLE device connection
│   │   ├── leak-detail.js            # Leak event detail
│   │   ├── active-alarm.js           # Active leak alarm
│   │   └── simulation.js             # Testing/simulation controls
│   └── _layout.js                    # Root layout + providers
│
├── components/
│   ├── ui/
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Badge.js
│   │   ├── Toast.js
│   │   ├── ConfirmDialog.js
│   │   ├── EmptyState.js
│   │   └── SkeletonLoader.js
│   ├── dashboard/
│   │   ├── FlowGauge.js
│   │   ├── SensorStatusCard.js
│   │   ├── TodayUsageCard.js
│   │   ├── LeakAlertCard.js
│   │   └── RecentFlowChart.js
│   ├── usage/
│   │   ├── UsageSummaryCard.js
│   │   ├── UsageChart.js
│   │   └── UsageRangeSelector.js
│   ├── leaks/
│   │   ├── LeakListItem.js
│   │   ├── LeakDetailCard.js
│   │   └── LeakStatusBadge.js
│   ├── ble/
│   │   ├── BleDeviceListItem.js
│   │   ├── ConnectionStatus.js
│   │   └── SensorSelector.js
│   └── alarm/
│       ├── AlarmBanner.js
│       └── AlarmSoundController.js
│
├── stores/
│   ├── connectionStore.js
│   ├── settingsStore.js
│   └── alarmStore.js
│
├── hooks/
│   ├── useSensors.js
│   ├── useTelemetry.js
│   ├── useUsage.js
│   ├── useLeakEvents.js
│   ├── useBle.js
│   ├── useSettings.js
│   └── useSimulation.js
│
├── repositories/
│   ├── SensorRepository.js
│   ├── FlowReadingRepository.js
│   ├── UsageRepository.js
│   ├── LeakEventRepository.js
│   └── SettingsRepository.js
│
├── services/
│   ├── BleService.js
│   ├── TelemetryParser.js
│   ├── UsageCalculationService.js
│   ├── LeakAnalysisService.js
│   ├── AlarmService.js
│   └── SimulationService.js
│
├── database/
│   ├── client.js
│   ├── migrations/
│   │   ├── index.js
│   │   └── v1_initial_schema.js
│   └── seeds/
│       └── development.js
│
├── types/
│   ├── models.js
│   └── errors.js
│
├── theme/
│   ├── colors.js
│   ├── typography.js
│   ├── spacing.js
│   └── useTheme.js
│
└── utils/
    ├── date.js
    ├── flow.js
    ├── validation.js
    └── numbers.js

# 2. Key Modules and Interfaces

## 2.1 Connection Store

ConnectionState {
  activeSensorId: number | null;
  deviceId: string | null;
  state: 'idle' | 'scanning' | 'connecting' |
         'connected' | 'disconnecting' | 'disconnected' | 'error';
  lastSeenAt: number | null;
  errorCode: string | null;
}

startScan()
connect(deviceId)
disconnect(deviceId)
setConnectionState(state)
clearConnectionError()

The store contains short-lived UI connection state. Persistent sensor metadata belongs in SQLite through SensorRepository.

## 2.2 Telemetry Processing Pipeline

async function handleBlePacket(packet) {
  const parsed = TelemetryParser.parse(packet);
  if (!parsed.ok) {
    return recordTelemetryError(parsed.errorCode);
  }

  const validated = TelemetryParser.validate(parsed.reading);
  if (!validated.valid) {
    return recordTelemetryError(validated.errorCode);
  }

  const reading = await flowReadingRepository.addReading({
    sensorId: getSensorId(packet.deviceId),
    timestamp: validated.reading.timestamp,
    flowRateLpm: validated.reading.flowRateLpm,
    sequenceNumber: validated.reading.sequenceNumber,
    status: validated.reading.status,
  });

  await usageCalculationService.processReading(reading);
  const result = await leakAnalysisService.processReading(reading);
  await applyLeakResult(result);
}

This boundary keeps raw BLE packets away from the UI and prevents invalid telemetry from being treated as legitimate water usage.

## 2.3 Telemetry Parser

TelemetryParser.parse(packet)
  → { ok: true, reading } | { ok: false, errorCode }

TelemetryParser.validate(reading)
  → { valid: true, reading } | { valid: false, errorCode }

- Packet length, header/version, field encoding, and flow-value validity are checked.
- Duplicate and out-of-order information is handled using the finalized simulator protocol.
- The exact byte layout and UUID values remain TBD until the GATT protocol is finalized.
## 2.4 Usage Calculation Service

UsageCalculationService.processReading(reading)
UsageCalculationService.calculateUsage(from, to, sensorId)
UsageCalculationService.aggregate(granularity, from, to, sensorId)

- Integrates flow rate over elapsed time to estimate volume.
- Converts elapsed milliseconds to minutes because flow rate is stored in L/min.
- Handles telemetry gaps according to an explicit data-quality policy rather than automatically treating missing packets as real zero flow.
- Produces hourly, daily, and weekly aggregates for charts.
## 2.5 Leak Analysis Service

LeakAnalysisService.processReading(reading)
LeakAnalysisService.evaluateWindow(sensorId, from, to)
LeakAnalysisService.resetSensorState(sensorId)

LeakState =
  'idle' |
  'flowing' |
  'suspected_leak' |
  'alarmed' |
  'resolved'

- Evaluates patterns such as sustained flow, duration, sudden high flow, and intermittent behaviour.
- Uses sensor/data-quality state to avoid conclusions based on unreliable telemetry.
- The 30-minute continuous suspicious-flow scenario is a controlled OJT demonstration condition, not a universal leak definition.
- No machine-learning model is required for the MVP.
## 2.6 Alarm Service

AlarmService.trigger(input)
AlarmService.stop()
AlarmService.isActive()
AlarmService.setSoundEnabled(enabled)

- Starts a loud alarm when the leak-analysis result requires an alarm.
- Keeps alarm presentation separate from leak-detection logic.
- Supports user-visible alarm state and a safe stop/dismiss action according to the final UX rules.
- Uses expo-compatible audio functionality for the mobile implementation.
# 3. BLE Simulator Integration

The OJT test environment contains two applications:

- M5 MacBook: native macOS Swift/SwiftUI application acting as BLE Peripheral / GATT Server.
- Android phone: React Native AquaSmart application acting as BLE Central / GATT Client.
- The simulator generates scenario-driven telemetry and maintains ground truth for test comparison.
MacBook Simulator
  → CoreBluetooth / CBPeripheralManager
  → BLE GATT telemetry
  → react-native-ble-plx
  → BleService
  → TelemetryParser
  → SQLite + Analysis
  → AquaSmart UI

## Supported Simulation Scenarios

| Scenario | Ground Truth | Purpose |
| --- | --- | --- |
| normal_flow | normal | Verify ordinary household usage does not alarm. |
| continuous_flow | leak | Verify sustained suspicious flow detection. |
| intermittent_flow | normal/leak test | Verify repeated short flows and configurable pattern rules. |
| sudden_high_flow | test condition | Verify sudden-rate-change handling. |
| no_flow | normal | Verify zero-flow state and dashboard behaviour. |
| sensor_error | fault | Verify sensor error handling. |
| invalid_packet | fault | Verify parser rejection. |
| missing_packet | transport_error | Verify telemetry gaps. |
| duplicate_packet | transport_error | Verify duplicate protection. |
| out_of_order_packet | transport_error | Verify sequence/timestamp ordering. |
| impossible_flow | fault | Verify value validation. |
| ble_disconnect | transport_error | Verify connection recovery UI. |

# 4. Key UI Components

## 4.1 FlowGauge

FlowGaugeProps {
  flowRateLpm: number | null;
  maxDisplayLpm?: number;
  status: 'normal' | 'suspicious' | 'error';
}

- Displays current flow in L/min.
- Clearly indicates when data is unavailable or invalid.
- Does not itself decide whether a leak exists.
## 4.2 LeakAlertCard

LeakAlertCardProps {
  event: LeakEvent | null;
  onViewDetails: () => void;
  onDismiss?: () => void;
}

- Shows active leak information from the analysis/repository layer.
- Provides navigation to leak details and the active alarm experience.
## 4.3 UsageChart

UsageChartProps {
  records: UsageRecord[];
  granularity: 'hour' | 'day' | 'week';
  unit: 'L' | 'm³';
}

- Renders aggregated local usage data.
- Shows an empty state when insufficient data exists.
## 4.4 AlarmBanner

AlarmBannerProps {
  active: boolean;
  reason: string | null;
  startedAt: number | null;
  onStop: () => void;
}

- Provides persistent visual feedback while the alarm is active.
- Works together with AlarmService for sound playback.
# 5. Sequence Diagrams

## Sequence 1: BLE Reading to Dashboard

BLE Simulator
    |
    | GATT telemetry packet
    v
BleService
    |
    v
TelemetryParser
    |
    | valid reading
    v
FlowReadingRepository ----> SQLite
    |
    +----> UsageCalculationService
    |          |
    |          +----> UsageRepository
    |
    +----> LeakAnalysisService
               |
               +----> LeakEventRepository
               |
               +----> AlarmService

React Query hooks <---- repositories/services
        |
        v
Dashboard / Charts / Leak UI

## Sequence 2: Leak Alarm

FlowReading
    |
    v
LeakAnalysisService
    |
    | suspicious pattern
    v
LeakEventRepository
    |
    | alarm required
    v
AlarmService
    |
    +----> AlarmStore
    |          |
    |          v
    |      AlarmBanner
    |
    +----> Audio playback

## Sequence 3: BLE Disconnect Recovery

Android App
   |
   v
BleService detects disconnect
   |
   v
ConnectionStore = 'disconnected'
   |
   +----> Dashboard shows disconnected state
   |
   +----> Stop/mark telemetry stream unavailable
   |
   v
User taps Retry
   |
   v
BleService.connect(deviceId)
   |
   +---- success --> connected + resume subscription
   |
   +---- failure --> error state + retry message

# 6. State Management

| Store / Layer | Persistence | Data |
| --- | --- | --- |
| connectionStore | In-memory | BLE connection state, active sensor, last seen, connection error. |
| alarmStore | In-memory | Active alarm state, reason, start time. |
| settingsStore | SQLite-backed | User settings and alert preferences. |
| React Query cache | In-memory | Repository query results and invalidation state. |
| SQLite repositories | Persistent local | Sensors, readings, usage records, leak events, settings. |

## React Query Cache Keys

| Query Key | Data | Suggested Stale Time |
| --- | --- | --- |
| ['sensors', filter] | Sensor list | 5 minutes |
| ['sensor', id] | Sensor detail | 5 minutes |
| ['latestReading', sensorId] | Latest flow reading | Very short / refetch as needed |
| ['flowReadings', sensorId, from, to] | Telemetry history | 1 minute |
| ['usage', granularity, from, to, sensorId] | Usage chart data | 1 minute |
| ['activeLeak', sensorId] | Active leak event | Very short / invalidate on analysis result |
| ['leakEvents', limit, offset, status] | Leak history | 1 minute |
| ['settings'] | Application settings | 5 minutes |
| ['bleConnection', deviceId] | Connection state | Managed by store/service |

# 7. Error Handling

| Error Scenario | Layer | Handling |
| --- | --- | --- |
| BLE scan failure | BleService | Set connection error state and show retry. |
| BLE disconnect | BleService / Store | Mark sensor disconnected and stop treating missing telemetry as zero usage. |
| Invalid packet | Parser | Reject packet; record diagnostic information. |
| Impossible flow value | Validation | Reject as invalid telemetry. |
| Duplicate packet | Parser/Repository | Do not double-count it in usage. |
| Out-of-order packet | Parser/Repository | Prevent stale data from corrupting current calculations. |
| SQLite write failure | Repository | Throw AquaSmartError('DB_WRITE_FAILED') and surface a recoverable UI error. |
| Leak analysis failure | Analysis Service | Fail safely; do not falsely mark a leak as resolved. |
| Alarm playback failure | AlarmService | Keep visual alarm state active and show an audio-error message. |
| Permission denied | BLE/UI | Explain required permission and provide retry/settings guidance. |

# 8. Validation

export const flowValidation = {
  flowRateLpm: (value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 'Invalid flow rate';
    if (n > MAX_REASONABLE_FLOW_LPM) return 'Flow rate exceeds configured range';
    return true;
  }
};

export const settingsValidation = {
  volumeUnit: (value) =>
    ['L', 'm³'].includes(value) || 'Invalid volume unit',

  leakAlertEnabled: (value) =>
    typeof value === 'boolean' || 'Invalid alert setting'
};

- Validation limits should be configurable/testable and should not be presented as proof of physical-sensor accuracy.
- User-facing forms should validate values before repository writes.
- Protocol-level validation should occur before usage and leak analysis.
# 9. Design Patterns

| Pattern | Where Used | Why |
| --- | --- | --- |
| Repository | SQLite repositories | Separates persistence queries from business/UI logic. |
| Observer / Store | Zustand stores | Keeps connection and alarm state reactive. |
| Adapter | BleService | Isolates react-native-ble-plx from the rest of the application. |
| Pipeline | BLE → parser → validation → persistence → analysis | Prevents malformed transport data from reaching business logic. |
| Strategy / Rule evaluation | LeakAnalysisService | Allows leak rules to evolve without changing UI code. |
| Service Layer | UsageCalculationService, AlarmService, LeakAnalysisService | Encapsulates domain operations that involve multiple steps. |
| Singleton | database/client.js | Provides one SQLite database client for the app lifecycle. |

# 10. Testing Hooks and Testability

- Repositories should accept a database dependency or test database so SQLite behaviour can be tested independently.
- BleService should expose mockable connection/notification behaviour.
- TelemetryParser should be pure where possible so packet fixtures can be tested deterministically.
- LeakAnalysisService should accept controlled timestamps/readings to test duration-based rules quickly.
- SimulationService should expose scenario controls and ground truth for integration testing.
- The OJT test suite should compare expected scenario outcomes with observed detector outcomes.
# 11. Crash Recovery and Data Safety

- On app launch, recover the last persisted sensor configuration and settings.
- Incomplete database writes should use SQLite transactions where multiple records must remain consistent.
- A BLE disconnect must not delete historical readings or leak events.
- If the app is closed during an active alarm, the next launch should re-evaluate persisted active-event state and present the appropriate alarm/history state.
- The app should never fabricate telemetry to fill missing BLE packets.
# 12. Future Extension Points

- Physical BLE flow meter can replace the MacBook simulator while preserving the mobile repository and UI contracts.
- Multiple sensors can be supported by retaining sensorId throughout telemetry, usage, and leak APIs.
- A future BLE shutoff valve can be implemented as a separate actuator service rather than mixing commands into FlowReadingRepository.
- Cloud synchronization can be added later without forcing screens to access a remote API directly.
- Water-bill calculation and reporting can consume UsageRepository outputs without changing the telemetry pipeline.
# 13. Summary

The AquaSmart LLD defines the concrete implementation structure behind the HLD and Repository API. The design separates React Native screens, reusable components, Zustand state, React Query hooks, SQLite repositories, BLE transport, telemetry parsing, usage calculation, leak analysis, and alarm control. The native MacBook BLE simulator provides controlled telemetry and fault scenarios, allowing the Android app to be tested without physical sensor hardware. JavaScript is used throughout the mobile application, while the simulator remains a separate native macOS Swift/SwiftUI application.
