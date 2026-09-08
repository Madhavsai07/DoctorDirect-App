**Testing Strategy**

**AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App**

Document ID: TEST-AS-01

Status: Draft

Date: 2026-09-07

Track: Application Development / Mobile IoT

# 1. Testing Goals

| Goal | Target |
| --- | --- |
| Repository and data-access coverage | > 90% line coverage |
| Leak detection logic coverage | 100% branch coverage for critical decision paths |
| Telemetry parser and validation coverage | > 90% line coverage; malformed-input cases included |
| Component render coverage | > 70% |
| Zero regressions on core flows | Automated tests for all MVP Must Have features |
| SQLite migration safety | All migrations tested from clean and representative prior schemas |
| BLE integration | Integration tests with mocked BLE peripheral data and disconnect/error cases |
| Alarm reliability | Critical leak-alarm scenarios covered by unit, integration, and E2E tests |

# 2. Testing Stack

| Layer | Framework / Tool | What It Tests |
| --- | --- | --- |
| Unit | Jest | Repository logic, telemetry parsing, validation, usage calculation, leak detection, Zustand/store actions |
| Component | React Native Testing Library (RNTL) | Component rendering, user interactions, accessibility |
| Integration | Jest + mocked BLE + Expo SQLite test database | BLE-to-parser-to-repository integration and database behavior |
| E2E | Detox | Full Android application flows on emulator/device |
| Performance | React Native performance tooling + timing logs | Startup, navigation, list rendering, database operations, dashboard updates |
| BLE | Mock BLE peripheral / simulator test data | Telemetry scenarios, malformed packets, missing/duplicate/out-of-order data, disconnects |

# 3. Unit Tests

## 3.1 Repository Logic Tests

File: __tests__/repositories/FlowReadingRepository.test.js

| Test ID | Description | Input | Expected Output |
| --- | --- | --- | --- |
| UT-FR-001 | Insert valid flow reading | Valid sensor ID, timestamp, flow rate | Reading stored with correct fields |
| UT-FR-002 | Reject invalid flow reading | Impossible/invalid flow value | Validation error; reading not stored |
| UT-FR-003 | List readings by time range | Start/end timestamps | Only readings inside requested range returned |
| UT-FR-004 | Preserve sequence metadata | Reading with sequence number | Sequence value stored and returned correctly |
| UT-FR-005 | Filter by sensor | Multiple sensors | Only selected sensor readings returned |

File: __tests__/repositories/UsageRepository.test.js

| Test ID | Description | Input | Expected Output |
| --- | --- | --- | --- |
| UT-UR-001 | Save calculated usage record | Valid usage interval | Usage record persisted |
| UT-UR-002 | Daily usage aggregation | Multiple readings in one day | Correct daily total |
| UT-UR-003 | Hourly usage aggregation | Readings spanning hours | Correct hourly buckets |
| UT-UR-004 | Weekly usage aggregation | Seven-day dataset | Correct weekly totals |

File: __tests__/repositories/LeakEventRepository.test.js

| Test ID | Description | Input | Expected Output |
| --- | --- | --- | --- |
| UT-LR-001 | Create leak event | Valid suspected-leak event | Event saved with active status |
| UT-LR-002 | Resolve leak event | Active event ID | Event marked resolved with end time |
| UT-LR-003 | List leak history | Multiple events | Events returned in newest-first order |
| UT-LR-004 | Retrieve event details | Known event ID | Correct event and associated details returned |

## 3.2 Telemetry Parsing and Validation Tests

File: __tests__/services/TelemetryParser.test.js

| Test ID | Description | Input | Expected |
| --- | --- | --- | --- |
| UT-TEL-001 | Parse valid telemetry | Valid protocol payload | Normalized flow reading returned |
| UT-TEL-002 | Reject malformed packet | Truncated/invalid payload | Parse error returned |
| UT-TEL-003 | Reject impossible flow | Out-of-range flow value | Validation failure |
| UT-TEL-004 | Handle missing packet fields | Incomplete payload | Invalid reading rejected |
| UT-TEL-005 | Detect duplicate sequence | Repeated sequence number | Duplicate identified and not double-counted |
| UT-TEL-006 | Detect out-of-order data | Older sequence/timestamp | Reading marked or handled as out-of-order |
| UT-TEL-007 | Preserve data quality | Valid/invalid quality metadata | Quality status propagated |

Note: The final BLE packet structure, UUIDs, byte order, scaling, and status values remain hardware-dependent and must be finalized when the physical sensor is selected. Tests should use a documented test fixture rather than assuming an unconfirmed production protocol.

## 3.3 Water Usage Calculation Tests

File: __tests__/services/UsageCalculationService.test.js

| Test ID | Description | Input | Expected |
| --- | --- | --- | --- |
| UT-USE-001 | Calculate interval usage | Flow rate + elapsed time | Correct liters calculated |
| UT-USE-002 | Zero-flow interval | 0 L/min over interval | 0 liters |
| UT-USE-003 | Multiple readings | Sequential flow samples | Correct accumulated usage |
| UT-USE-004 | Ignore invalid reading | Invalid sample in sequence | Invalid sample excluded according to policy |
| UT-USE-005 | Handle time gap | Large sample interval | Gap handled according to defined interpolation/aggregation rule |

## 3.4 Leak Detection Tests

File: __tests__/services/LeakDetectionService.test.js

| Test ID | Description | Input | Expected |
| --- | --- | --- | --- |
| UT-LD-001 | Normal short flow | Normal flow followed by stop | No leak event |
| UT-LD-002 | Continuous suspicious flow | Continuous suspicious flow for configured OJT test duration | Leak suspicion raised |
| UT-LD-003 | Intermittent flow | Repeated short flow bursts | No false leak when pattern remains within configured normal behavior |
| UT-LD-004 | Sudden high flow | Abrupt high-flow sample | High-flow condition evaluated without immediately assuming a leak |
| UT-LD-005 | Leak persists | Suspicious flow remains active | Active leak event maintained; repeated alerts suppressed according to policy |
| UT-LD-006 | Flow stops | Leak flow returns to normal/zero | Leak event can transition to resolved |
| UT-LD-007 | Sensor error during suspicion | Invalid/error telemetry | Detection pauses or degrades safely; sensor error is recorded |
| UT-LD-008 | Restart recovery | Active event stored before app restart | Event state restored consistently |

The continuous suspicious-flow duration is a controlled OJT test condition, not a universal definition of every real-world leak. The detector should be implemented as configurable pattern/state-based logic so that thresholds and durations can be tuned after real sensor validation.

## 3.5 Validation Tests

File: __tests__/utils/validation.test.js

| Test ID | Description | Input | Expected |
| --- | --- | --- | --- |
| UT-VAL-001 | Invalid sensor identifier rejected | Empty/invalid ID | Validation error |
| UT-VAL-002 | Negative flow rejected | -5 L/min | Validation error |
| UT-VAL-003 | Valid zero flow accepted | 0 L/min | true |
| UT-VAL-004 | Timestamp validation | Malformed/future-invalid timestamp | Validation error |
| UT-VAL-005 | Settings validation | Invalid threshold/duration | Validation error |

## 3.6 Store Tests

File: __tests__/stores/aquaSmartStore.test.js

| Test ID | Description | Expected |
| --- | --- | --- |
| UT-ST-001 | BLE connection state updates | Connected/disconnected state is correct |
| UT-ST-002 | Latest telemetry updates | Dashboard receives latest valid reading |
| UT-ST-003 | Leak alarm state updates | Active alarm state reflected in UI store |
| UT-ST-004 | Stop alarm clears active playback state | Alarm playback state reset |
| UT-ST-005 | Sensor unavailable handled | UI exposes disconnected/unavailable state without crash |

# 4. Component Tests (React Native Testing Library)

File: __tests__/components/FlowDashboard.test.js

| Test ID | Description |
| --- | --- |
| CT-FD-001 | Renders current flow rate correctly |
| CT-FD-002 | Renders current usage summary |
| CT-FD-003 | Shows connected sensor state |
| CT-FD-004 | Shows disconnected state clearly |
| CT-FD-005 | Updates when new telemetry arrives |
| CT-FD-006 | Does not crash when no reading is available |

File: __tests__/components/UsageChart.test.js

| Test ID | Description |
| --- | --- |
| CT-UC-001 | Renders hourly/daily/weekly usage data |
| CT-UC-002 | Switching time range requests correct dataset |
| CT-UC-003 | Empty dataset shows an informative empty state |
| CT-UC-004 | Large values remain readable without layout failure |

File: __tests__/components/LeakAlarm.test.js

| Test ID | Description |
| --- | --- |
| CT-LA-001 | Active leak state is visually prominent |
| CT-LA-002 | Stop/mute control calls the correct action |
| CT-LA-003 | Leak details are accessible to screen readers |
| CT-LA-004 | Alarm state does not depend only on color |

File: __tests__/components/BLEConnection.test.js

| Test ID | Description |
| --- | --- |
| CT-BLE-001 | Connect action starts connection process |
| CT-BLE-002 | Connected state shows sensor information |
| CT-BLE-003 | Disconnect/error state is presented clearly |
| CT-BLE-004 | Retry action can restart connection |

# 5. Integration Tests

File: __tests__/integration/TelemetryFlow.test.js

Tests the integration of BLE data handling, telemetry parsing/validation, usage calculation, repositories, leak analysis, and state updates using mocked BLE data and a test SQLite database.

| Test ID | Description | Steps |
| --- | --- | --- |
| IT-001 | Normal telemetry flow | Connect → receive valid readings → parse → validate → store → update dashboard |
| IT-002 | Usage accumulation | Receive sequential readings → calculate interval usage → save usage → verify totals |
| IT-003 | Leak detection flow | Receive configured suspicious-flow pattern → detector evaluates pattern → leak event created → alarm state activated |
| IT-004 | Leak resolution | Active leak → valid flow stops/returns normal → event resolved → history updated |
| IT-005 | BLE disconnect recovery | Connected → disconnect → error state → reconnect → telemetry resumes |
| IT-006 | Invalid packet handling | Malformed payload → parser rejects → error logged → app continues processing later valid packets |
| IT-007 | Duplicate packet handling | Duplicate reading → duplicate detected → usage is not double-counted |
| IT-008 | Out-of-order packet handling | Older packet arrives → ordering policy applied → aggregates remain consistent |
| IT-009 | SQLite migration | Run migration on empty/representative DB → required tables/indexes exist |
| IT-010 | Crash recovery | Persist active leak/event state → restart app → recover state without corrupting history |

# 6. End-to-End Tests (Detox)

Target: Android Emulator and, when available, a representative physical Android device. The production application connects to the physical BLE water-flow sensor. For OJT automation, BLE input may be supplied through a controlled simulator/mock because physical sensor hardware is not available.

File: e2e/aquasmart.test.js

| Test ID | Flow | Steps |
| --- | --- | --- |
| E2E-001 | First launch | Launch → permissions/settings → continue → Dashboard |
| E2E-002 | Connect sensor | Open BLE screen → scan/connect to available test sensor → connected state shown |
| E2E-003 | Live flow monitoring | Connect → receive flow data → dashboard shows current rate and usage |
| E2E-004 | Usage history | Generate/store readings → open Usage → hourly/daily/weekly chart displays data |
| E2E-005 | Leak alarm | Inject controlled suspicious-flow scenario → leak alert appears → alarm activates → acknowledge/stop → event stored |
| E2E-006 | Leak history | Open Leak History → active/resolved events listed → open detail |
| E2E-007 | Settings | Change leak detection settings → save → new settings persist after restart |
| E2E-008 | Offline/local operation | Disable network → monitor stored data/history → core local features continue working |
| E2E-009 | BLE disconnect | Connected sensor → disconnect → warning shown → reconnect → monitoring resumes |
| E2E-010 | Invalid telemetry | Inject invalid/malformed test data → error handled without app crash |

# 7. Accessibility Testing

| Tool / Test | Pass Criteria |
| --- | --- |
| Android TalkBack | All interactive elements have meaningful labels and logical navigation order |
| Android font scale | At large supported font sizes, no critical text or controls are clipped |
| Color/grayscale test | Leak and connection states remain understandable without relying only on color |
| Tap target audit | Interactive controls meet the project's minimum touch-target guideline |
| Alarm accessibility | Leak alarm message and state are exposed through accessible text/status announcements |

# 8. Performance Testing

| Test | Target | Tool |
| --- | --- | --- |
| App cold start | < 2 seconds target on representative Android hardware | Timing measurement |
| Dashboard update responsiveness | No visible jank during normal telemetry updates | React Native performance tooling |
| Usage chart rendering | Smooth interaction with representative history dataset | Performance profiler |
| Leak alarm activation | Alert UI responds promptly after detection decision | Custom timing log |
| SQLite: insert reading | < 10 ms target for representative local insert | Repository timing log |
| SQLite: history query | < 50 ms target for representative history dataset | Repository timing log |
| BLE reconnect | Reconnect completes within an acceptable configured timeout | BLE integration timing log |

# 9. Test Coverage Targets

| Layer | Coverage Target |
| --- | --- |
| repositories/ | > 90% line coverage |
| services/ (leak detection + telemetry) | 100% branch coverage for critical decision logic |
| utils/ | > 90% |
| stores/ | > 80% |
| components/ | > 70% |
| E2E core flows | 100% of MVP Must Have flows represented |

# 10. Test Commands

The exact scripts may be adjusted to the final repository configuration. Recommended commands:

- npm test
- npm run test:coverage
- npm run test:watch
- npx detox build --configuration android.emu
- npx detox test --configuration android.emu
# 11. Testing Conventions

| Convention | Detail |
| --- | --- |
| Test file location | Use a consistent __tests__/ structure under the project test directory |
| Mock BLE | Use deterministic mocked peripheral data for unit/integration tests; do not treat the simulator as a production dependency |
| Mock SQLite | Use an isolated test database or controlled SQLite mock for repository tests |
| Factory functions | Use factories such as createMockSensor(), createMockFlowReading(), createMockLeakEvent() |
| Deterministic telemetry | Scenario fixtures should have known timestamps, flow values, sequence numbers, and expected outcomes |
| No flaky tests | Avoid arbitrary sleeps; use deterministic waits/events and fix timing issues rather than increasing retries |
| Hardware boundary | Keep hardware-specific UUIDs/protocol details isolated so tests can use fixtures until the physical sensor specification is finalized |
| Ground truth | Scenario-based simulator data should include expected detection/usage outcomes so algorithm tests can compare actual vs expected behavior |

# 12. Test Data and Scenario Matrix

| Scenario | Telemetry Pattern | Expected Result |
| --- | --- | --- |
| Normal usage | Short flow followed by zero flow | Usage recorded; no leak |
| Continuous suspicious flow | Sustained configured suspicious flow | Leak suspicion/alarm according to configured policy |
| Intermittent usage | Repeated short flow bursts | Usage recorded; avoid false leak |
| Sudden high flow | Abrupt high-rate reading | High-flow condition evaluated; no automatic leak assumption |
| No flow | Repeated zero-flow readings | No leak; connection remains healthy |
| Sensor error | Explicit error/invalid quality status | Reading rejected/degraded; error surfaced |
| Missing packet | Expected sequence gap | Gap detected/recorded; no duplicate usage |
| Duplicate packet | Repeated sequence/timestamp | Duplicate ignored or marked; no double counting |
| Out-of-order packet | Older reading arrives after newer one | Ordering policy applied; aggregates remain safe |
| Impossible flow | Value outside configured sensor range | Rejected as invalid |
| BLE disconnect | Connection lost | Disconnected state shown; reconnect path available |

# 13. Defect Severity and Release Gates

| Severity | Example | Release Rule |
| --- | --- | --- |
| Critical | False leak alarm that cannot be stopped, data corruption, app crash during core monitoring | Must fix before release |
| High | Leak event not recorded, major BLE connection failure, incorrect usage totals | Must fix before MVP release |
| Medium | Non-critical chart/UI issue, recoverable settings issue | Fix or explicitly accept before release |
| Low | Minor visual or copy issue | Can be deferred if documented |

- All Critical and High defects must be resolved or formally accepted before an MVP demonstration/release.
- Core E2E tests must pass before a release candidate is produced.
- Database migrations must pass against a clean database and representative prior versions.
- Leak detection tests must pass for normal, intermittent, continuous suspicious, invalid-data, and recovery scenarios.
- A failed physical-sensor test must not be reported as passed using simulator results; simulator results are clearly labeled as development/testing evidence.
# 14. Testing Limitations and Deferred Validation

- A physical BLE water-flow sensor is not available for the OJT, so hardware behavior, radio reliability, sensor calibration, and final packet protocol cannot be fully validated during the OJT.
- The BLE simulator is a development/testing substitute only. It must not be represented as the production sensing architecture.
- Exact BLE UUIDs, payload fields, scaling factors, byte order, sequence behavior, and sensor error codes remain TBD until the physical sensor is selected.
- Real-world leak detection accuracy requires field testing with controlled and naturally occurring usage patterns. OJT tests can demonstrate the algorithm and alert pipeline but cannot prove universal leak-detection accuracy.
- Performance targets are engineering targets and should be re-measured on representative Android hardware before final release.
# 15. Summary

AquaSmart testing is organized across unit, component, integration, accessibility, performance, and end-to-end layers. The highest-risk areas—BLE telemetry integrity, water-usage calculation, leak detection, alarm behavior, SQLite persistence, and reconnect/recovery—receive explicit scenario-based coverage. The physical BLE water-flow sensor remains the production input boundary, while simulator/mock telemetry is used only where controlled test data is needed during OJT development.
