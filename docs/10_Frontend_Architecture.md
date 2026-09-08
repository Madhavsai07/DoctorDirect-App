Frontend Development — Track-Specific Architecture

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App

| Field | Details |
| --- | --- |
| Document ID | FEA-FE-01 |
| Status | Draft |
| Track | Frontend / Mobile IoT Development |

AquaSmart is an offline-first React Native mobile application whose frontend coordinates BLE telemetry, local SQLite persistence, usage calculations, leak analysis, alarm presentation, and history/chart screens. The Android application is the BLE Central / GATT Client and connects to the physical BLE water-flow sensor during real-world use. A simulator may be used only as a development/testing substitute when physical sensor hardware is unavailable.

# 1. Frontend Architecture Overview

The frontend is responsible for the complete mobile application experience because the MVP does not require a cloud backend. The architecture separates UI components, client state, asynchronous data access, BLE transport, telemetry parsing, domain services, and SQLite persistence.

## Technology Stack

| Area | AquaSmart Choice |
| --- | --- |
| Framework | React Native with Expo |
| Language | JavaScript |
| Routing | Expo Router, file-based routing |
| Client state | Zustand |
| Async/data state | TanStack React Query |
| Local database | expo-sqlite |
| BLE Central | react-native-ble-plx |
| Animations | React Native Reanimated |
| Charts | React Native-compatible charting library |
| Audio | expo-av |
| Forms | React Hook Form where form complexity benefits from it |
| Testing | Jest + React Native Testing Library; E2E framework may be added based on final project setup |

The mobile stack deliberately uses JavaScript rather than TypeScript, matching the project requirement.

# 2. Component Architecture

App (_layout.js)
│
├── Providers
│   ├── SQLite database provider / client
│   ├── QueryClientProvider
│   ├── Theme provider
│   └── Gesture handler root
│
├── (tabs)
│   ├── DashboardScreen
│   │   ├── SensorStatusCard
│   │   ├── CurrentFlowCard / FlowGauge
│   │   ├── TodayUsageCard
│   │   ├── LeakAlertCard
│   │   └── RecentFlowChart
│   ├── UsageScreen
│   │   ├── UsageSummaryCard
│   │   ├── UsageRangeSelector
│   │   └── UsageChart
│   ├── LeakHistoryScreen
│   │   ├── LeakListItem
│   │   └── EmptyState
│   └── SettingsScreen
│       ├── SensorConnectionEntry
│       ├── AlertSettings
│       ├── AlarmSoundToggle
│       └── UnitSettings
│
├── (modals)
│   ├── BleConnectionScreen
│   ├── LeakDetailScreen
│   ├── ActiveAlarmScreen
│   └── SimulationControlsScreen
│
└── Supporting components
    ├── ui/
    ├── ble/
    ├── dashboard/
    ├── usage/
    ├── leaks/
    └── alarm/

# 3. Design System

## Theme System

export const colors = {
  dark: {
    background: '#0D0D0F',
    surface: '#1C1C1E',
    surfaceElevated: '#2C2C2E',
    border: '#3A3A3C',
    primary: '#38BDF8',
    secondary: '#22D3EE',
    danger: '#F87171',
    warning: '#FBBF24',
    success: '#34D399',
    text: '#F9FAFB',
    textMuted: '#9CA3AF',
    textDisabled: '#4B5563'
  },
  light: {
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceElevated: '#F3F4F6',
    border: '#E5E7EB',
    primary: '#0284C7',
    secondary: '#0891B2',
    danger: '#DC2626',
    warning: '#D97706',
    success: '#16A34A',
    text: '#111827',
    textMuted: '#6B7280',
    textDisabled: '#9CA3AF'
  }
};

These values are proposed design tokens, not measurements from a physical device or externally mandated branding. They can be adjusted during UX implementation.

## Typography

export const typography = {
  display: { fontSize: 40, lineHeight: 48 },
  h1: { fontSize: 28, lineHeight: 36 },
  h2: { fontSize: 22, lineHeight: 30 },
  h3: { fontSize: 18, lineHeight: 26 },
  body: { fontSize: 16, lineHeight: 24 },
  bodySmall: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
  mono: { fontSize: 16, lineHeight: 24 }
};

# 4. State Management

| Store / Layer | State | Actions / Role |
| --- | --- | --- |
| connectionStore | active sensor, BLE device ID, connection state, last seen, error | scan, connect, disconnect, update state |
| alarmStore | alarm active, reason, startedAt | activate, stop, reset |
| settingsStore | theme, units, alert preferences, default sensor | update settings |
| React Query | repository query/mutation results | fetch, cache, invalidate, refetch |
| SQLite | persistent domain data | repositories own reads/writes |

Short-lived connection and alarm state belongs in Zustand. Persistent domain data belongs in SQLite. React Query manages asynchronous repository data and cache state.

## React Query Strategy

- Use stale-while-revalidate behaviour for SQLite-backed queries where appropriate.
- Invalidate usage, dashboard, and leak-history queries after relevant mutations.
- Keep rapidly changing current-flow data fresh without forcing unrelated screens to re-render.
- Prefetch lightweight sensor/configuration data when useful.
- Do not use the React Query cache as the system of record; SQLite remains the persistent source.
# 5. Routing

| File | Route | Type |
| --- | --- | --- |
| app/(tabs)/index.js | / | Dashboard tab |
| app/(tabs)/usage.js | /usage | Usage tab |
| app/(tabs)/leaks.js | /leaks | Leak History tab |
| app/(tabs)/settings.js | /settings | Settings tab |
| app/(modals)/ble-connect.js | /ble-connect | Modal |
| app/(modals)/leak-detail.js | /leak-detail | Modal |
| app/(modals)/active-alarm.js | /active-alarm | Modal / alarm presentation |
| app/(modals)/simulation.js | /simulation | Development/testing modal |

Exact Expo Router grouping can be adjusted during implementation without changing the domain architecture.

## Navigation Guards

- If the application requires first-run setup, route the user through onboarding before normal monitoring screens.
- BLE-dependent screens should handle disconnected state rather than assuming a sensor is always available.
- Simulation controls should be hidden or protected in the normal homeowner-facing navigation.
# 6. API Integration

AquaSmart has no required external REST API for the MVP. UI data is obtained through repository methods exposed by React Query hooks.

useLatestReading(sensorId)
useFlowReadings(sensorId, from, to)
useTodayUsage(sensorId)
useUsageHistory(granularity, from, to, sensorId)
useActiveLeak(sensorId)
useLeakEvents(limit, offset, status)
useSensors(filter)
useAppSettings()
useBleConnection(deviceId)
useStartScenario()
useStopScenario()

The BLE service is a device integration layer, not a cloud API. The repository API and frontend hook contract are defined in the separate Repository API document.

# 7. BLE and Telemetry Integration

Physical BLE Water Flow Sensor
        │
        │ BLE GATT notifications
        ▼
react-native-ble-plx
        │
        ▼
BleService
        │
        ▼
TelemetryParser
        │
        ▼
Validation
        │
        ├── invalid → diagnostics / ignore for normal calculations
        │
        ▼
FlowReadingRepository
        │
        ▼
SQLite
   ┌────┴───────────────┐
   ▼                    ▼
UsageCalculation   LeakAnalysis
   │                    │
   ▼                    ▼
UsageRepository     LeakEventRepository
                         │
                         ▼
                    AlarmService
                         │
                         ▼
                         UI

- The Android app acts as BLE Central / GATT Client.
- The native BLE simulator acts as BLE Peripheral / GATT Server.
- The exact GATT UUIDs, packet layout, byte order, scaling, and sampling details remain TBD until the selected sensor protocol or development BLE test protocol is finalized.
- The UI never consumes raw BLE packets directly.
# 8. Form Architecture

React Hook Form can be used for settings and structured forms where it reduces unnecessary re-renders. Simple controls may use ordinary React state to avoid unnecessary abstraction.

function SensorSettingsForm({ onSuccess }) {
  const { control, handleSubmit, formState: { errors } } =
    useForm({
      defaultValues: {
        name: '',
        alertEnabled: true,
        alarmSoundEnabled: true
      }
    });

  const { mutate: saveSettings } = useUpdateSetting();

  const onSubmit = data => {
    // validate, persist through repository, then refresh UI
  };
}

- Validate flow-related and configuration values before persistence.
- Do not allow invalid unit or sensor identifiers to reach repository writes.
# 9. Error States

| Component | Error | Display / Behaviour |
| --- | --- | --- |
| Dashboard | No sensor connected | Clear disconnected card + Connect/Retry action |
| BLE Connection | Permission denied | Explain permission requirement + retry/settings guidance |
| BLE Connection | Connection failed | Retry action and technical state indicator |
| Dashboard / Charts | No telemetry | Empty state explaining that data will appear after readings arrive |
| UsageScreen | Database read failure | Inline error + retry |
| Leak History | Database read failure | Error state + retry |
| Active Alarm | Audio failure | Keep visual alarm active and show audio error |
| Telemetry pipeline | Invalid packet | Do not count as valid usage; retain diagnostic information |
| Settings | Invalid value | Inline validation |

# 10. Loading States

| Screen / Component | Loading State |
| --- | --- |
| Dashboard | Placeholder/skeleton for current flow and usage cards |
| Usage chart | Chart skeleton while query loads |
| Leak history | Skeleton list |
| BLE device list | Scanning indicator and skeleton/empty state |
| Settings | Placeholder while persisted settings load |

- Loading indicators should not imply zero water flow or zero usage.
- A disconnected or unavailable sensor must be visually different from a loading state.
# 11. Accessibility

| Feature | Implementation |
| --- | --- |
| Screen reader labels | accessibilityLabel on buttons, sensor controls, alarm actions, and charts where practical |
| Current flow | Announce value with unit, e.g. L/min |
| Leak alert | Use clear alert semantics and text, not colour alone |
| Alarm stop | Explicit accessible button label |
| Reduced motion | Respect reduced-motion preference for nonessential animations |
| Font scaling | Allow system font scaling; avoid clipping at large text sizes |
| Tap targets | Use sufficiently large interactive areas |

- Critical leak information must remain understandable without relying on colour, animation, or sound alone.
# 12. Responsive Design

| Pattern | Implementation |
| --- | --- |
| Horizontal padding | Consistent spacing token rather than hard-coded screen widths |
| Cards | Flexbox-based layouts that adapt to different Android screen sizes |
| Charts | Calculate available width from layout measurement |
| Flow gauge | Scale within available container; avoid assuming a fixed device size |
| Safe areas | Use safe-area insets for system bars and notches |
| Large text | Allow content to reflow rather than truncating critical values |

# 13. Performance Optimization

| Optimization | Implementation |
| --- | --- |
| Telemetry updates | Update only components that need current flow/connection state |
| Lists | FlatList for leak history and BLE device lists |
| Memoization | React.memo for repeated list items where profiling shows benefit |
| Handlers | useCallback/useMemo selectively for expensive list props |
| Animations | Reanimated for UI-thread animations |
| SQLite | Use indexed time/sensor queries defined in the database design |
| React Query | Cache stable history/settings data; keep high-frequency telemetry appropriately fresh |
| Charts | Aggregate data before rendering long time ranges |

- Do not over-optimize before profiling; the expected OJT dataset is modest.
# 14. Code Splitting / Lazy Loading

| Target | Method |
| --- | --- |
| Secondary screens | Load through normal Expo Router navigation; keep startup path lightweight |
| Simulation controls | Keep outside the normal startup UI |
| Chart-heavy screens | Initialize chart rendering when the usage screen is opened |
| Development-only tools | Exclude from normal user navigation where practical |

# 15. Caching

| Cache | Mechanism | Suggested Policy |
| --- | --- | --- |
| Sensor metadata | React Query | Several minutes; invalidate after configuration change |
| Latest reading | React Query / state | Short freshness window because telemetry changes frequently |
| Usage history | React Query | Short-to-moderate freshness; invalidate after new aggregate data |
| Leak history | React Query | Invalidate after event creation/resolution |
| Settings | Zustand + SQLite | Persist locally; refresh on startup |
| Connection state | Zustand | In-memory; reflects live BLE state |

SQLite remains the durable local source. Cache policies are implementation parameters and can be tuned after performance testing.

# 16. Security and Privacy in the Frontend

- Keep sensor identifiers and telemetry local unless a future cloud feature explicitly requires transmission.
- Do not log raw telemetry unnecessarily in production builds.
- Avoid exposing internal database errors directly to end users.
- Restrict simulation/development controls from normal user-facing navigation.
- Validate BLE-originated data before storing or analysing it.
- Future remote-control functionality, such as a BLE shutoff valve, should require a separate security review.
# 17. Testing

| Level | Tools / Focus |
| --- | --- |
| Unit | Jest — validation, usage calculations, parser, leak-analysis rules |
| Component | React Native Testing Library — dashboard cards, charts states, alarm UI, forms |
| Repository integration | Test SQLite repository operations with a controlled test database/mock |
| BLE integration | Mock react-native-ble-plx and feed deterministic simulator packets |
| Scenario testing | Run simulator scenarios and compare detector output against ground truth |
| E2E | Use the selected mobile E2E framework if configured for the OJT project |

- Test cases must include normal flow, continuous suspicious flow, intermittent flow, sudden high flow, no flow, invalid packets, duplicates, out-of-order data, impossible values, and BLE disconnect.
# 18. Development and CI/CD

The frontend should be checked automatically on pull requests using the project's configured GitHub Actions pipeline.

- JavaScript linting and formatting checks.
- Unit and component tests.
- Build validation for the Expo application.
- Optional E2E checks when the Android test environment is available.
- No TypeScript compiler step is required because AquaSmart uses JavaScript.
# 19. SEO / ASO

SEO is not applicable to the mobile application itself. If the project is published later, App Store / Play Store optimization can use messaging around household water monitoring, leak alerts, BLE connectivity, offline-first operation, and water usage history. Exact store copy should be finalized during release preparation.

# 20. Frontend Design Principles

- Offline-first: core monitoring history and analysis should remain usable without internet access.
- Data ownership: SQLite is the local source of truth for persistent application data.
- Separation of concerns: screens do not directly parse BLE packets or execute SQLite queries.
- Fail-safe behaviour: bad telemetry or analysis errors must not silently become valid usage or a false resolved-leak state.
- Hardware independence: the BLE transport and telemetry-processing layers should isolate sensor-specific details so the selected physical BLE flow meter can be integrated without rewriting the dashboard, history, or analysis UI.
- Testability: simulator scenarios provide repeatable telemetry and known ground truth.
- Progressive enhancement: advanced features such as bill calculation, multiple sensors, notifications, and a BLE shutoff valve can be added without redesigning the basic frontend contract.
# 21. Summary

The AquaSmart frontend architecture is a JavaScript-based React Native/Expo client organized around reusable UI components, Zustand client state, React Query data state, BLE services, telemetry validation, SQLite repositories, usage calculation, leak analysis, and alarm presentation. In normal operation, a physical BLE water-flow sensor supplies telemetry to the Android app. A development BLE simulator is used only when controlled testing is required or physical hardware is unavailable. The architecture deliberately keeps transport, persistence, business analysis, and presentation separate so the OJT MVP remains understandable, testable, and extensible.
