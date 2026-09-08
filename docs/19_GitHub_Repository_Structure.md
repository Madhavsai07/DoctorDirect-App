GitHub Repository Structure

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App

# Repository Structure

aquasmart/

│

├── app/                                  # Expo Router — file-based routes

│   ├── _layout.js                        # Root layout, providers and app initialization

│   ├── (tabs)/

│   │   ├── _layout.js                    # Bottom tab navigator configuration

│   │   ├── index.js                      # Dashboard / home tab

│   │   ├── usage/

│   │   │   ├── _layout.js

│   │   │   └── index.js                  # Usage charts and summaries

│   │   ├── leaks/

│   │   │   ├── _layout.js

│   │   │   └── index.js                  # Leak history

│   │   └── settings/

│   │       ├── _layout.js

│   │       └── index.js                  # Settings

│   ├── (modals)/

│   │   ├── ble-connection.js             # BLE sensor connection / status modal

│   │   ├── leak-detail.js                # Leak event detail

│   │   ├── active-alarm.js               # Full-screen active leak alarm

│   │   └── testing.js                    # Development/testing controls

│   └── onboarding/

│       ├── welcome.js

│       ├── permissions.js

│       └── sensor-setup.js

│

├── components/

│   ├── ui/                               # Primitive design-system components

│   │   ├── Button.js

│   │   ├── TextInput.js

│   │   ├── Card.js

│   │   ├── Badge.js

│   │   ├── Chip.js

│   │   ├── Toast.js

│   │   ├── ConfirmDialog.js

│   │   ├── SkeletonLoader.js

│   │   ├── EmptyState.js

│   │   ├── ThemedView.js

│   │   └── ThemedText.js

│   ├── dashboard/

│   │   ├── CurrentFlowCard.js             # Current flow rate and connection status

│   │   ├── UsageSummaryCard.js

│   │   └── LeakStatusCard.js

│   ├── ble/

│   │   ├── SensorConnectionCard.js

│   │   ├── ConnectionStatusBadge.js

│   │   └── SensorSelector.js

│   ├── usage/

│   │   ├── UsageSummary.js

│   │   ├── UsageChart.js

│   │   └── UsagePeriodSelector.js

│   ├── leaks/

│   │   ├── LeakHistoryItem.js

│   │   ├── LeakStatusBadge.js

│   │   └── LeakDetailCard.js

│   ├── alarm/

│   │   ├── LeakAlarmBanner.js

│   │   └── AlarmOverlay.js

│   └── settings/

│       ├── SettingsSection.js

│       └── SettingRow.js

│

├── stores/                               # Zustand client/UI state

│   ├── connectionStore.js

│   ├── settingsStore.js

│   ├── alarmStore.js

│   └── testingStore.js

│

├── hooks/                                # Reusable React hooks

│   ├── useBleConnection.js

│   ├── useFlowReadings.js

│   ├── useUsage.js

│   ├── useLeakEvents.js

│   └── useSettings.js

│

├── repositories/                         # SQLite data-access layer

│   ├── SensorRepository.js

│   ├── FlowReadingRepository.js

│   ├── UsageRepository.js

│   ├── LeakEventRepository.js

│   └── SettingsRepository.js

│

├── database/

│   ├── client.js                         # expo-sqlite initialization / provider

│   ├── migrations/

│   │   ├── index.js                      # Migration runner

│   │   └── v1_initial_schema.js          # Initial tables and indexes

│   └── seeds/

│       └── settings.js                   # Optional default settings

│

├── services/

│   ├── BleService.js                     # Physical BLE sensor connection/client

│   ├── TelemetryParserService.js         # BLE payload parsing

│   ├── TelemetryValidationService.js     # Data quality and validity checks

│   ├── UsageCalculationService.js        # Converts flow rate/time into usage

│   ├── LeakDetectionService.js           # Pattern/state-based leak analysis

│   ├── AlarmService.js                   # Loud leak alarm control

│   └── BleSimulatorService.js             # Development/testing only

│

├── theme/

│   ├── colors.js

│   ├── typography.js

│   ├── spacing.js

│   └── useTheme.js

│

├── types/

│   ├── models.js                         # Sensor, FlowReading, UsageRecord, LeakEvent

│   └── errors.js                         # AquaSmart error codes / error objects

│

├── utils/

│   ├── date.js

│   ├── units.js

│   ├── flow.js

│   └── validation.js

│

├── __tests__/

│   ├── repositories/

│   │   ├── SensorRepository.test.js

│   │   ├── FlowReadingRepository.test.js

│   │   ├── UsageRepository.test.js

│   │   └── LeakEventRepository.test.js

│   ├── services/

│   │   ├── TelemetryParserService.test.js

│   │   ├── TelemetryValidationService.test.js

│   │   ├── UsageCalculationService.test.js

│   │   └── LeakDetectionService.test.js

│   ├── stores/

│   │   ├── connectionStore.test.js

│   │   └── alarmStore.test.js

│   ├── utils/

│   │   └── validation.test.js

│   ├── components/

│   │   ├── CurrentFlowCard.test.js

│   │   ├── UsageChart.test.js

│   │   └── LeakAlarmBanner.test.js

│   └── integration/

│       └── TelemetryToLeakDetection.test.js

│

├── e2e/                                  # Android E2E tests

│   ├── onboarding.test.js

│   ├── ble-connection.test.js

│   ├── dashboard.test.js

│   ├── leak-alarm.test.js

│   └── settings.test.js

│

├── assets/

│   ├── icon.png

│   ├── splash.png

│   └── adaptive-icon.png

│

├── docs/

│   ├── 01-project-overview.docx

│   ├── 02-business-requirements.docx

│   ├── 03-product-requirements.docx

│   ├── 04-ux-requirements.docx

│   ├── 05-technical-requirements.docx

│   ├── 06-high-level-design.docx

│   ├── 07-database-data-design.docx

│   ├── 08-repository-api-specification.docx

│   ├── 09-low-level-design.docx

│   ├── 10-frontend-architecture.docx

│   ├── 11-security-design.docx

│   ├── 12-testing-strategy.docx

│   ├── 13-ci-cd-pipeline.docx

│   ├── 14-observability-design.docx

│   ├── 15-deployment-architecture.docx

│   ├── 16-cost-analysis.docx

│   ├── 17-project-roadmap.docx

│   ├── 18-team-responsibilities.docx

│   ├── 19-github-repository-structure.docx

│   ├── 20-readme.docx

│   └── 21-architecture-decision-records.docx

│

├── .github/

│   ├── workflows/

│   │   ├── ci.yml                        # Lint + unit/integration tests

│   │   └── deploy.yml                    # EAS build on approved release flow

│   ├── ISSUE_TEMPLATE/

│   │   ├── feature.md

│   │   └── bug.md

│   └── PULL_REQUEST_TEMPLATE.md

│

├── app.json

├── eas.json

├── babel.config.js

├── jest.config.js

├── .eslintrc.json

├── .prettierrc

├── package.json

├── package-lock.json

├── README.md

├── CONTRIBUTING.md

├── CHANGELOG.md

└── LICENSE

# Key Conventions

## Branch Naming

- feature/ble-connection
- feature/sqlite-migrations
- feature/leak-detection
- feature/usage-charts
- fix/telemetry-validation
- fix/ble-reconnect
- test/leak-detection-scenarios
- docs/update-readme
## Commit Message Format (Conventional Commits)

- feat(ble): add physical sensor connection service
- feat(db): implement flow reading repository
- feat(leak): add pattern-based leak detection logic
- fix(telemetry): reject invalid flow readings
- test(leak): add continuous-flow detection scenarios
- docs(readme): add Android setup instructions
- chore(ci): add lint and unit test workflow
## PR Naming

- [S1] feat: implement BLE connection and telemetry parsing
- [S2] feat: add leak detection and alarm handling
- [S3] feat: add usage charts and leak history
- refactor: simplify telemetry validation
- docs: update repository architecture
## File Naming

- React components: PascalCase.js
- Hooks: camelCase.js with a use... prefix
- Repositories: PascalCaseRepository.js
- Services: PascalCaseService.js
- Stores: camelCaseStore.js
- Utility modules: camelCase.js
- Tests: matching module name with .test.js or .test.jsx where required
# Architecture and Repository Conventions

- Production data flow is centered on the physical BLE water-flow sensor communicating with the Android AquaSmart application.
- The Android application acts as the BLE Central / GATT Client and owns connection, telemetry parsing, validation, persistence, analysis, and presentation.
- BleSimulatorService.js is restricted to development and controlled testing. It is not a production dependency and does not replace the physical sensor in the product architecture.
- SQLite repositories isolate database access from UI components and business services.
- Telemetry parsing and validation are separated so malformed, missing, duplicate, out-of-order, or otherwise invalid readings can be handled explicitly.
- LeakDetectionService.js contains pattern/state-based detection logic. Specific hardware protocol details and final sensor calibration remain configurable/TBD until the physical sensor is selected.
- JavaScript is used throughout the application; TypeScript files and a tsconfig.json are intentionally not part of this repository structure.
- Sensitive configuration and credentials must be supplied through environment/secrets management rather than committed to Git.
- Documentation files are kept separately so each OJT deliverable can be reviewed and updated independently.
# Repository Ownership

- Student — Chinthaginjala Madhav Sai Kiran: owns application code, BLE integration, data layer, leak detection, testing, CI/CD, documentation, and release preparation.
- Mentor — Kshitiz Dhooria: provides technical guidance, review, and milestone feedback.
- Project mode: solo OJT application development.
# Important Scope Boundary

**Physical sensor: **The intended real-world architecture is Physical BLE Water Flow Sensor → Android AquaSmart App.

**Simulator: **A BLE simulator is included only to generate controlled telemetry for development and testing because physical sensor hardware is not available during the OJT. Exact service UUIDs, characteristic UUIDs, packet structure, byte order, scaling, and other hardware-specific protocol details remain TBD until the sensor is selected.

# Summary

This repository structure separates routing, reusable UI components, state, hooks, SQLite repositories, BLE and telemetry services, business logic, testing, documentation, and CI/CD configuration. It keeps the physical BLE sensor as the primary production integration while providing a contained simulator for OJT testing. The structure is intentionally modular so additional sensors, richer reporting, smart notifications, or a future BLE shutoff-valve capability can be added without coupling hardware logic directly to the UI.
