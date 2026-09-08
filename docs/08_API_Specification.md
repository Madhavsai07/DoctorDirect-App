API Specification (Local Data API)

**AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App**

| Field | Details |
| --- | --- |
| Document ID | API-FE-01 |
| Status | Draft |
| Track | Frontend / Mobile IoT Development |

AquaSmart has no dependency on a cloud REST API for its core OJT workflow. This document specifies the internal local data API: JavaScript repository/service interfaces that form the contract between the React Native UI, BLE telemetry processing, SQLite persistence, and analysis services. Screens should consume application data through these interfaces rather than directly querying SQLite tables.

# 1. Sensor Repository API

SensorRepository {
  listSensors(filter?: {
    status?: SensorStatus;
    nameQuery?: string;
  }): Promise<Sensor[]>;

  getSensorById(id: number): Promise<Sensor | null>;

  registerSensor(input: RegisterSensorInput): Promise<Sensor>;

  updateSensor(id: number, input: UpdateSensorInput): Promise<Sensor>;

  removeSensor(id: number): Promise<void>;
}

## Types

Sensor {
  id: number;
  name: string;
  deviceIdentifier: string | null;
  connectionType: 'BLE';
  status: 'simulated' | 'connected' | 'disconnected' | 'error';
  lastSeenAt: number | null;
  createdAt: number;
}

RegisterSensorInput {
  name: string;
  deviceIdentifier?: string;
}

UpdateSensorInput {
  name?: string;
  status?: Sensor['status'];
}

SensorStatus =
  'simulated' | 'connected' | 'disconnected' | 'error';

## Error Codes

| Code | When | Description |
| --- | --- | --- |
| SENSOR_NAME_DUPLICATE | registerSensor | Another configured sensor already uses the name. |
| SENSOR_NOT_FOUND | get/update/remove | No sensor exists with the supplied ID. |
| SENSOR_NOT_REMOVABLE | removeSensor | Sensor cannot be removed while protected application data depends on it. |

# 2. Flow Reading Repository API

FlowReadingRepository {
  addReading(input: CreateFlowReadingInput): Promise<FlowReading>;

  addReadingsBatch(inputs: CreateFlowReadingInput[]): Promise<number>;

  getLatestReading(sensorId: number): Promise<FlowReading | null>;

  getReadings(
    sensorId: number,
    from: number,
    to: number,
    limit?: number
  ): Promise<FlowReading[]>;

  getLatestReadings(sensorId: number, limit: number): Promise<FlowReading[]>;

  deleteReadingsBefore(timestamp: number): Promise<number>;
}

## Types

FlowReading {
  id: number;
  sensorId: number;
  timestamp: number;          // Unix timestamp, milliseconds
  flowRateLpm: number;        // Litres per minute
  sequenceNumber: number | null;
  dataQuality: 'valid' | 'invalid' | 'duplicate' | 'out_of_order';
  status: 'ok' | 'sensor_error' | 'invalid_packet';
  receivedAt: number;
}

CreateFlowReadingInput {
  sensorId: number;
  timestamp: number;
  flowRateLpm: number;
  sequenceNumber?: number;
  dataQuality?: FlowReading['dataQuality'];
  status?: FlowReading['status'];
}

## Validation Rules

- Flow rate must not be negative.
- Impossible or deliberately malformed values must be rejected or stored only when explicitly marked as invalid test data.
- Duplicate packets should be identified using available sequence/timestamp information.
- Out-of-order packets must not silently overwrite newer readings.
- Missing packets are represented by gaps in telemetry rather than fabricated readings.
- The exact BLE packet format, byte order, scaling, and sequence semantics remain a design/TBD item until the simulator protocol is finalized.
# 3. Usage Repository API

UsageRepository {
  calculateUsage(from: number, to: number, sensorId?: number): Promise<UsageSummary>;

  getUsageHistory(
    granularity: 'hour' | 'day' | 'week',
    from: number,
    to: number,
    sensorId?: number
  ): Promise<UsageRecord[]>;

  getUsageForDate(
    date: string,
    sensorId?: number
  ): Promise<UsageRecord | null>;

  saveUsageRecord(input: SaveUsageRecordInput): Promise<UsageRecord>;

  deleteUsageBefore(timestamp: number): Promise<number>;
}

## Types

UsageRecord {
  id: number;
  sensorId: number | null;
  periodStart: number;
  periodEnd: number;
  granularity: 'hour' | 'day' | 'week';
  volumeLitres: number;
  calculatedAt: number;
}

UsageSummary {
  from: number;
  to: number;
  volumeLitres: number;
  averageFlowRateLpm: number;
  peakFlowRateLpm: number;
  readingCount: number;
}

SaveUsageRecordInput {
  sensorId?: number;
  periodStart: number;
  periodEnd: number;
  granularity: UsageRecord['granularity'];
  volumeLitres: number;
}

## Usage Calculation Contract

- Water volume is derived from flow rate and elapsed time; for a sampled reading, the implementation integrates flow over the relevant interval rather than treating a single flow-rate value as a volume.
- Flow rate is stored in litres per minute, while elapsed time is converted to minutes before volume is accumulated.
- Usage history supports hourly, daily, and weekly chart rendering.
- The implementation should document how gaps in telemetry are handled so missing data is not incorrectly counted as zero usage.
# 4. Leak Event Repository API

LeakEventRepository {
  createEvent(input: CreateLeakEventInput): Promise<LeakEvent>;

  updateEvent(id: number, input: UpdateLeakEventInput): Promise<LeakEvent>;

  getActiveEvent(sensorId?: number): Promise<LeakEvent | null>;

  getEventById(id: number): Promise<LeakEvent | null>;

  listEvents(
    from?: number,
    to?: number,
    limit?: number,
    offset?: number
  ): Promise<LeakEvent[]>;

  resolveEvent(id: number, resolvedAt?: number): Promise<LeakEvent>;
}

## Types

LeakEvent {
  id: number;
  sensorId: number;
  startedAt: number;
  suspectedAt: number | null;
  alarmedAt: number | null;
  resolvedAt: number | null;
  durationSeconds: number | null;
  peakFlowRateLpm: number;
  status: 'suspected' | 'alarmed' | 'resolved' | 'dismissed';
  reasonCode: string;
  notes: string | null;
}

CreateLeakEventInput {
  sensorId: number;
  startedAt: number;
  suspectedAt?: number;
  peakFlowRateLpm: number;
  status: LeakEvent['status'];
  reasonCode: string;
  notes?: string;
}

UpdateLeakEventInput {
  suspectedAt?: number;
  alarmedAt?: number;
  resolvedAt?: number;
  durationSeconds?: number;
  peakFlowRateLpm?: number;
  status?: LeakEvent['status'];
  notes?: string;
}

## Leak Detection Contract

- The repository stores the result of leak analysis; it does not itself decide whether a leak exists.
- Leak analysis is pattern/state-based and can consider continuous flow, duration, sudden changes, intermittent behaviour, and sensor/data quality.
- A controlled OJT test scenario may use 30 minutes of continuous suspicious flow to demonstrate an alarm condition, but this is not treated as a universal real-world definition of a leak.
- A leak event should preserve enough timing information to support alarm history and later review.
# 5. Settings Repository API

SettingsRepository {
  get<T>(key: SettingsKey): Promise<T | null>;
  set<T>(key: SettingsKey, value: T): Promise<void>;
  getAll(): Promise<AppSettings>;
}

## Types

SettingsKey =
  'theme' |
  'flow_unit' |
  'volume_unit' |
  'leak_alert_enabled' |
  'alarm_sound_enabled' |
  'default_sensor_id';

AppSettings {
  theme: 'dark' | 'light' | 'system';
  flowUnit: 'L/min';
  volumeUnit: 'L' | 'm³';
  leakAlertEnabled: boolean;
  alarmSoundEnabled: boolean;
  defaultSensorId: number | null;
}

# 6. BLE Service API

BleService {
  startScan(): Promise<void>;

  stopScan(): Promise<void>;

  connect(deviceId: string): Promise<BleConnection>;

  disconnect(deviceId: string): Promise<void>;

  subscribeToFlowData(
    deviceId: string,
    callback: (packet: BlePacket) => void
  ): Promise<Subscription>;

  readDeviceInfo(deviceId: string): Promise<DeviceInfo | null>;

  getConnectionState(deviceId: string): Promise<BleConnectionState>;
}

## Types

BleConnection {
  deviceId: string;
  connectedAt: number;
  state: 'connected' | 'disconnected';
}

BlePacket {
  deviceId: string;
  receivedAt: number;
  payload: Uint8Array;
}

DeviceInfo {
  deviceId: string;
  name: string;
  firmwareVersion: string | null;
}

BleConnectionState =
  'scanning' | 'connecting' | 'connected' |
  'disconnecting' | 'disconnected' | 'error';

## BLE Responsibility Boundary

- The Android application acts as the BLE Central / GATT Client.
- The M5 MacBook simulator acts as the BLE Peripheral / GATT Server using native macOS CoreBluetooth APIs.
- The mobile BLE service is responsible for scanning, connecting, subscribing to telemetry, and reporting connection failures.
- Packet decoding and validation should be separated from transport logic so simulator packets and future physical-sensor packets can use the same application contract.
- Exact service and characteristic UUIDs are implementation details to be finalized when the simulator GATT design is frozen.
# 7. Telemetry Parser / Validation API

TelemetryParser {
  parse(packet: BlePacket): ParseResult;

  validate(reading: ParsedFlowReading): ValidationResult;
}

ParsedFlowReading {
  timestamp: number;
  flowRateLpm: number;
  sequenceNumber: number | null;
  status: 'ok' | 'sensor_error' | 'invalid_packet';
}

ParseResult =
  | { ok: true; reading: ParsedFlowReading }
  | { ok: false; errorCode: TelemetryErrorCode };

ValidationResult =
  | { valid: true; reading: ParsedFlowReading }
  | { valid: false; errorCode: TelemetryErrorCode };

TelemetryErrorCode =
  'PACKET_TOO_SHORT' |
  'INVALID_HEADER' |
  'INVALID_LENGTH' |
  'INVALID_FLOW_VALUE' |
  'INVALID_TIMESTAMP' |
  'UNSUPPORTED_VERSION' |
  'SENSOR_ERROR' |
  'DUPLICATE_PACKET' |
  'OUT_OF_ORDER_PACKET';

## Processing Contract

- Malformed packets must not reach usage or leak analysis as valid telemetry.
- Sensor-error packets should be preserved as diagnostic information when appropriate, but excluded from normal usage integration.
- The parser must not assume a final protocol until the simulator packet specification is finalized.
# 8. Leak Analysis Service API

LeakAnalysisService {
  processReading(reading: FlowReading): Promise<LeakAnalysisResult>;

  evaluateWindow(
    sensorId: number,
    from: number,
    to: number
  ): Promise<LeakAnalysisResult>;

  resetSensorState(sensorId: number): Promise<void>;
}

LeakAnalysisResult {
  state: 'idle' | 'flowing' | 'suspected_leak' | 'alarmed' | 'resolved';
  shouldCreateEvent: boolean;
  shouldAlarm: boolean;
  reasonCode: string | null;
  confidence: 'low' | 'medium' | 'high';
}

## Analysis Notes

- The service is intentionally rule/state-based for the OJT scope; machine learning is not required.
- It should distinguish ordinary short-duration usage from sustained or unusual patterns.
- Intermittent and sudden-high-flow scenarios should be testable through the simulator.
- Data-quality and BLE-disconnection conditions should prevent false conclusions when telemetry is unreliable.
- Thresholds and timing values are configurable design parameters and should be validated through testing rather than presented as guaranteed real-world leak detection accuracy.
# 9. Dashboard Query API

DashboardRepository {
  getCurrentStatus(sensorId?: number): Promise<DashboardStatus>;

  getCurrentFlow(sensorId?: number): Promise<number | null>;

  getTodayUsage(sensorId?: number): Promise<number>;

  getRecentUsage(days: number, sensorId?: number): Promise<UsageRecord[]>;

  getActiveLeak(sensorId?: number): Promise<LeakEvent | null>;
}

DashboardStatus {
  sensorStatus: 'connected' | 'disconnected' | 'error' | 'simulated';
  currentFlowRateLpm: number | null;
  todayUsageLitres: number;
  activeLeak: LeakEvent | null;
  lastReadingAt: number | null;
}

# 10. Leak History Query API

LeakHistoryRepository {
  listLeakEvents(
    limit: number,
    offset: number,
    status?: LeakEvent['status']
  ): Promise<LeakEvent[]>;

  getLeakEventDetail(id: number): Promise<LeakEvent | null>;

  getLeakStatistics(): Promise<LeakStatistics>;
}

LeakStatistics {
  totalEvents: number;
  activeEvents: number;
  resolvedEvents: number;
  totalSuspectedLeakDurationSeconds: number;
}

# 11. Testing / Simulation Repository API

SimulationRepository {
  startScenario(
    scenario: SimulationScenario,
    sensorId?: number
  ): Promise<SimulationRun>;

  stopScenario(runId: number): Promise<void>;

  injectPacket(
    sensorId: number,
    packet: BlePacket
  ): Promise<void>;

  getActiveRun(): Promise<SimulationRun | null>;
}

SimulationScenario =
  'normal_flow' |
  'continuous_flow' |
  'intermittent_flow' |
  'sudden_high_flow' |
  'no_flow' |
  'sensor_error' |
  'invalid_packet' |
  'missing_packet' |
  'duplicate_packet' |
  'out_of_order_packet' |
  'impossible_flow' |
  'ble_disconnect';

SimulationRun {
  id: number;
  sensorId: number;
  scenario: SimulationScenario;
  startedAt: number;
  stoppedAt: number | null;
  groundTruth: 'normal' | 'leak' | 'fault' | 'transport_error';
}

## Ground-Truth Principle

- The simulator maintains scenario ground truth so test results can compare detector behaviour with the intended scenario.
- Simulation controls are development/testing tools and are not part of the normal homeowner workflow.
- The simulator is a native macOS application on the M5 MacBook, while AquaSmart runs on Android.
# 12. React Query Hook API (UI Contract)

The UI should consume repositories through React Query hooks. This keeps SQLite, BLE, parsing, and analysis implementation details out of screen components and gives the application predictable loading, caching, invalidation, and error states.

// hooks/useSensors.js
useSensors(filter)
useSensor(id)
useRegisterSensor()
useUpdateSensor()
useRemoveSensor()

// hooks/useTelemetry.js
useLatestReading(sensorId)
useFlowReadings(sensorId, from, to)
useCurrentFlow(sensorId)

// hooks/useUsage.js
useTodayUsage(sensorId)
useUsageHistory(granularity, from, to, sensorId)

// hooks/useLeakEvents.js
useActiveLeak(sensorId)
useLeakEvents(limit, offset, status)
useLeakEventDetail(id)

// hooks/useSettings.js
useAppSettings()
useSetting(key)
useUpdateSetting()

// hooks/useBle.js
useBleDevices()
useBleConnection(deviceId)
useConnectBle()
useDisconnectBle()

// hooks/useSimulation.js
useSimulationRun()
useStartScenario()
useStopScenario()

# 13. Error Handling Convention

class AquaSmartError extends Error {
  constructor(
    code,
    message,
    originalError = undefined
  ) {
    super(message);
    this.code = code;
    this.originalError = originalError;
  }
}

AquaSmartErrorCode =
  'SENSOR_NOT_FOUND' |
  'SENSOR_NAME_DUPLICATE' |
  'BLE_SCAN_FAILED' |
  'BLE_CONNECTION_FAILED' |
  'BLE_DISCONNECTED' |
  'PERMISSION_DENIED' |
  'PACKET_PARSE_FAILED' |
  'INVALID_TELEMETRY' |
  'DUPLICATE_PACKET' |
  'OUT_OF_ORDER_PACKET' |
  'DB_WRITE_FAILED' |
  'DB_READ_FAILED' |
  'LEAK_ANALYSIS_FAILED' |
  'SIMULATION_FAILED';

## UI Error Behaviour

- BLE failures should show connection state and a retry action.
- Invalid telemetry should be logged/recorded for diagnostics without being presented as valid water usage.
- Database failures should surface a clear persistence error and avoid silently losing user-visible data.
- Leak-analysis failures must fail safely: no false 'leak resolved' state should be shown solely because analysis failed.
- React Query mutation/query error handlers should map repository errors to user-friendly messages, while retaining technical error codes for diagnostics.
# 14. Repository Layer Responsibilities

- Repository modules own SQLite reads/writes and map database rows to application domain objects.
- BLE services own transport and connection lifecycle, not business-level leak decisions.
- Telemetry parsing owns packet decoding and validation.
- Usage services own water-volume calculations and aggregation.
- Leak analysis owns pattern/state evaluation and event creation decisions.
- React Query hooks provide the UI-facing data contract.
- Screen components should not contain direct SQLite queries or raw BLE packet parsing.
# 15. API Design Principles

- Offline-first: core monitoring, history, charts, and leak records remain locally available without internet connectivity.
- Separation of concerns: transport, parsing, persistence, calculation, analysis, and presentation are separate responsibilities.
- Testability: simulator scenarios and injectable packets make BLE-dependent behaviour testable without physical hardware.
- Deterministic contracts: repository/service methods return predictable domain objects and typed error codes.
- Future hardware compatibility: replacing the simulator with a physical BLE flow meter should not require rewriting the UI or database contract.
- Protocol flexibility: BLE UUIDs and packet fields remain replaceable until the final simulator protocol is approved.
# 16. API-to-Database Mapping

| API Area | Primary SQLite Tables | Purpose |
| --- | --- | --- |
| SensorRepository | sensors | Configured sensor metadata and status. |
| FlowReadingRepository | flow_readings | Raw/validated telemetry history. |
| UsageRepository | usage_records + flow_readings | Aggregated and calculated water usage. |
| LeakEventRepository | leak_events | Leak lifecycle and alarm history. |
| SettingsRepository | settings | User preferences and application configuration. |
| DashboardRepository | flow_readings + usage_records + leak_events | Current status and summary data. |
| LeakHistoryRepository | leak_events | Historical leak list, details, and statistics. |
| SimulationRepository | sensors + flow_readings | Controlled telemetry generation and test execution. |

# 17. Scope and Deferred Items

- No cloud REST API is required for the OJT MVP.
- No authentication API is required for the local-only MVP.
- Remote BLE shutoff-valve commands are future scope and should be added as a separate actuator service if implemented.
- Multi-sensor synchronization and cross-sensor analytics are stretch scope.
- Exact BLE GATT UUIDs, packet schema, sampling frequency, and firmware metadata are deferred until simulator protocol design is finalized.
- Cloud backup, remote notifications, and account synchronization are outside the current offline-first contract.
# 18. Summary

The AquaSmart local data API defines a clean contract between the React Native application and its local IoT data pipeline. The central flow is BLE telemetry → parsing/validation → SQLite repositories → usage/leak analysis → React Query hooks → UI. The contract is intentionally simulator-compatible so the M5 MacBook BLE peripheral can validate the mobile app before any physical flow sensor is available. The interfaces also keep future hardware integration, additional sensors, and actuator support isolated from the core dashboard and history screens.
