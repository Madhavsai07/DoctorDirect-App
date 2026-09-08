**Observability Design**

**AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App**

Document ID: OBS-AS-01

Status: Draft

Date: 2026-09-07

Track: Application Development / Mobile IoT

# 1. Observability Philosophy for a Mobile IoT App

AquaSmart is primarily a local-first mobile application. Observability therefore focuses on visibility into BLE connectivity, telemetry processing, leak detection, SQLite performance, application errors, and UI performance rather than traditional server-side monitoring.

- Development-time visibility — understand BLE, telemetry, database, store, and UI behavior during development/testing.
- Crash detection — identify application errors and recover gracefully where possible.
- Performance monitoring — identify slow SQLite queries, excessive rendering, memory growth, and dashboard update bottlenecks.
- BLE reliability monitoring — observe connection, disconnection, reconnect, packet validation, and sensor-error conditions.
- Leak-detection visibility — record enough local diagnostic information to understand why a leak state was raised or resolved.
- Privacy-first operation — MVP observability should avoid collecting unnecessary personal or household data.
In MVP, no mandatory third-party analytics platform is required. Diagnostic logging is primarily development/local, with future opt-in crash reporting considered separately.

# 2. Development Observability

## 2.1 React Native Development Tools

| Tool / Area | What It Shows |
| --- | --- |
| React DevTools | Component tree, props, state, and unnecessary re-renders |
| React Native Dev Menu / performance tools | JS/UI frame rate and runtime performance |
| Expo development tooling | Runtime errors, development logs, and build/debug information |
| SQLite inspection/debugging | Tables, records, indexes, and representative local queries |
| Zustand development tooling/logging | Important store transitions such as BLE state and alarm state |

Network inspection should remain secondary because the MVP is designed around local SQLite data and direct BLE communication rather than a required backend.

## 2.2 Zustand Logger Middleware (Development Only)

Important AquaSmart state transitions can be logged during development, for example:

// stores/aquaSmartStore.js
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

export const useAquaSmartStore = create()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // ... store implementation
    })),
    { name: 'AquaSmartStore', enabled: __DEV__ }
  )
);

- Useful events include sensor connection changes, latest valid telemetry, alarm activation/deactivation, and settings updates.
- Sensitive or unnecessary household information should not be placed into debug logs.
- Verbose state logging should remain disabled in production builds.
## 2.3 SQLite Query Timing

Repository queries should have a development-only timing wrapper:

export async function timedQuery(name, queryFn) {
  if (!__DEV__) return queryFn();

  const start = performance.now();
  const result = await queryFn();
  const elapsed = performance.now() - start;

  if (elapsed > 10) {
    console.warn(`[SQLite] Slow query: ${name} took ${elapsed.toFixed(2)}ms`);
  } else {
    console.debug(`[SQLite] ${name}: ${elapsed.toFixed(2)}ms`);
  }
  return result;
}

- Track representative operations such as inserting flow readings, aggregating usage, listing leak history, and loading dashboard summaries.
- The 10 ms warning threshold is a development target and can be tuned after measuring on representative Android hardware.
## 2.4 BLE and Telemetry Diagnostics

| Diagnostic Event | Information to Record |
| --- | --- |
| BLE connection | Connection attempt result, connection state, and timing |
| BLE disconnection | Reason/category if available and reconnect attempt |
| Telemetry received | Timestamp, validated flow value, sequence metadata, and data-quality status |
| Invalid telemetry | Validation category/error code; avoid dumping raw sensitive data |
| Duplicate/out-of-order data | Sequence/order condition and handling decision |
| Sensor error | Sensor error/status category and recovery state |
| Leak detection decision | Detection state/result, configured rule identifier, and event ID where applicable |

The exact BLE UUIDs and packet fields are hardware-dependent and are not assumed here. Once the physical sensor is selected, the final protocol diagnostics should be added without exposing unnecessary raw payloads.

## 2.5 React Native Performance Monitoring

| Metric | Target / Watch |
| --- | --- |
| JS Frame Rate | Aim for smooth 60 fps interaction; investigate sustained drops |
| UI Frame Rate | Aim for smooth native rendering during navigation, charts, and alarm UI |
| Memory / RAM | Watch for unexpected growth during long monitoring sessions |
| JS Heap | Investigate sustained growth that may indicate retained objects/listeners |
| BLE update processing | Avoid unnecessary UI/store updates for every redundant or invalid packet |

Targets are engineering goals, not claims of measured production performance.

# 2.6 Error Boundary

Application screens should be protected by an error boundary so an unexpected JavaScript rendering error produces a recoverable fallback instead of an unusable blank screen.

class ErrorBoundary extends React.Component {
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state?.hasError) {
      return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}

- The fallback should provide a clear retry/reload action.
- Errors should be logged without exposing internal stack traces to normal users.
- Persistent BLE/sensor errors should use the sensor connection/error UI rather than the generic application error boundary.
# 3. Logging

## 3.1 Log Levels

| Level | When Used | Output |
| --- | --- | --- |
| console.error | Repository failures, BLE failures, database errors, unexpected application errors | Development; future opt-in error reporting |
| console.warn | Slow queries, permission issues, recoverable sensor/data problems | Development |
| console.debug | Query timing, detailed telemetry-processing diagnostics, development store transitions | Development only |
| console.info | Major lifecycle events such as database migration completion or sensor connection | Development only |

## 3.2 Production Log Policy

- Do not emit continuous telemetry streams into production console logs.
- Do not log personal information or unnecessary household usage history.
- Avoid logging complete BLE payloads unless required for a controlled diagnostic build.
- Production error reporting, if introduced later, should be opt-in and privacy-reviewed.
# 4. Error Reporting

## 4.1 MVP

- No mandatory third-party analytics SDK.
- Development builds expose runtime errors through Expo/React Native development tooling.
- Critical local errors are represented in the app through recoverable error states where possible.
## 4.2 Post-MVP

- An opt-in crash/error reporting service may be evaluated if real users require remote diagnostics.
- Only the minimum diagnostic information necessary should be collected.
- The privacy notice and data handling policy should be updated before enabling remote reporting.
# 5. Performance Monitoring Checklist

## 5.1 UI and Animation Performance

| Check | Target | Pass? |
| --- | --- | --- |
| Dashboard live-flow update | No visible jank during normal telemetry updates |  |
| Usage chart rendering | Smooth range changes and chart interaction |  |
| Leak alarm presentation | Prompt UI response when detection event is raised |  |
| Tab/navigation transitions | Smooth transition without noticeable frame drops |  |
| Leak history scrolling | Smooth with representative history size |  |

## 5.2 SQLite Performance

| Query / Operation | Target |
| --- | --- |
| Flow reading insert | < 10 ms target on representative device |
| Dashboard summary query | < 50 ms target |
| Usage aggregation | < 50 ms target for representative dataset |
| Leak history list | < 50 ms target |

These are initial engineering targets and must be validated on representative physical Android hardware.

# 6. Device Testing Matrix

| Device | OS | Purpose |
| --- | --- | --- |
| Android Emulator | Supported Android API level | Primary UI/E2E development and deterministic simulator/mock telemetry |
| Representative physical Android device | Android version supported by final app | Real BLE connection, performance, permissions, alarm, and persistence testing |
| Lower/mid-range Android device | Supported Android version | Performance and memory validation |

iOS may be used for general React Native UI development if the project configuration supports it, but Android is the primary hardware target for AquaSmart because the production use case requires BLE communication with the physical water-flow sensor.

# 7. Accessibility Audit

Accessibility checks should be performed before the final OJT milestone/release candidate.

| Audit Item | Tool / Method | Pass Criteria |
| --- | --- | --- |
| TalkBack navigation | Android accessibility tools | Interactive elements announced correctly and in logical order |
| Font scaling | Android accessibility settings | No critical clipping or unusable controls at supported large text sizes |
| Color dependence | Manual review / grayscale | Leak, connection, and error states understandable without color alone |
| Touch targets | Manual UI audit | Controls meet the project's minimum touch-target guideline |
| Leak alarm accessibility | TalkBack + manual test | Alarm state and action controls are clearly announced |

# 8. Build Size Monitoring

| Metric | Target | How to Check |
| --- | --- | --- |
| Android APK/internal build size | Keep within practical OJT distribution limits; investigate unexpected growth | EAS build artifact/report |
| Android production AAB size | Monitor release build growth | EAS build artifact/report |
| JavaScript bundle size | Monitor for unexpected increases | Expo export/build output |

Exact size thresholds should be set after the first stable build establishes a baseline. Large increases should trigger dependency and asset review.

Recommended CI check:

npx expo export
# Inspect generated output size and compare with the project baseline

# 9. BLE Reliability and Leak Detection Observability

| Area | Diagnostic Goal |
| --- | --- |
| Connection reliability | Measure connection success, disconnect frequency, and reconnect outcomes during testing |
| Telemetry quality | Track valid, invalid, duplicate, missing, and out-of-order samples in controlled scenarios |
| Usage calculation | Compare calculated totals with known simulator ground truth during automated tests |
| Leak detection | Compare detector decisions against scenario ground truth |
| Alarm behavior | Confirm alarm activation, acknowledgement/stop behavior, and persistence of the leak event |
| Recovery | Confirm app restart/reconnect does not silently lose active events or corrupt history |

For the OJT, scenario-based simulator data can provide ground truth for software validation. This does not replace field validation with a physical sensor.

# 10. Observability Data Retention and Privacy

- Operational application data remains in the local SQLite database according to the database/data lifecycle design.
- Development logs should be ephemeral and should not become a second uncontrolled storage location for household usage data.
- Diagnostic logs should avoid names, addresses, precise household identifiers, or other unnecessary personal information.
- If remote crash reporting is introduced, retention, consent, access, and deletion requirements must be defined before enabling it.
# 11. Summary

AquaSmart observability focuses on the mobile application's most important runtime boundaries: physical BLE sensor connectivity, telemetry integrity, water-usage calculation, leak detection, alarm behavior, SQLite performance, UI responsiveness, and recoverability. Development-only diagnostics provide detailed visibility while the MVP remains privacy-focused and local-first. The BLE simulator is used only for controlled development/testing and is not treated as part of the production sensing architecture.
