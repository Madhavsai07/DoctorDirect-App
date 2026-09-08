**CI/CD Pipeline**

**AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App**

Document ID: CICD-AS-01

Status: Draft

Date: 2026-09-07

Track: Application Development / Mobile IoT

# 1. Pipeline Overview

Developer
  ↓ git push feature branch
GitHub
  ↓ Pull Request → main
GitHub Actions CI Pipeline
  ├── ESLint
  ├── Unit + Component Tests (Jest + RNTL)
  ├── Integration Tests
  ├── Security Scan (npm audit / dependency scan)
  └── Expo/EAS build validation
  ↓ All required checks green + PR approved → merge to main
GitHub Actions CD Pipeline
  └── EAS production build
      └── Internal distribution / release channel

- The pipeline is designed for the AquaSmart React Native + Expo JavaScript application.
- The production data architecture remains the physical BLE water-flow sensor → Android AquaSmart app. CI/CD validates the software; it does not replace physical sensor validation.
- BLE simulator/mock telemetry is used only for automated and development testing where deterministic BLE input is required.
# 2. Branching Strategy

| Branch | Purpose | Protected |
| --- | --- | --- |
| main | Production-ready code | Yes — PR required + CI pass |
| develop | Integration branch for ongoing OJT development | Yes |
| feature/* | Individual AquaSmart features | No |
| fix/* | Bug fixes | No |
| release/* | Release candidate stabilization | Yes |

# 3. GitHub Actions Workflows

## Workflow 1: CI (Pull Request)

File: .github/workflows/ci.yml

Trigger: pull_request to main or develop

Recommended CI stages:

- Checkout repository.
- Set up the supported Node.js version defined by the project.
- Install dependencies using npm ci.
- Run ESLint.
- Run Jest unit and component tests with coverage.
- Run integration tests using controlled SQLite and BLE mocks.
- Run dependency/security checks.
- Validate the Expo project/build configuration.
- Upload coverage and test artifacts for review.
Example job structure:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup Node.js
      - npm ci
      - npm run lint
      - npm run test:coverage

  integration:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - checkout
      - setup Node.js
      - npm ci
      - npm run test:integration

  security:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - checkout
      - setup Node.js
      - npm ci
      - npm audit --audit-level=high

  build-check:
    runs-on: ubuntu-latest
    needs: [quality, integration, security]
    steps:
      - checkout
      - setup Node.js
      - npm ci
      - Expo/EAS build configuration validation

## Workflow 2: CD (Build on merge to main)

File: .github/workflows/deploy.yml

Trigger: push to main

- Install dependencies from the lockfile.
- Authenticate to Expo/EAS using a GitHub encrypted secret.
- Create the configured Android build.
- Optionally create an iOS build if iOS distribution is included in the release plan and Apple credentials are available.
- Publish the resulting build to the selected internal distribution channel.
For the OJT, Android should be the primary release target because AquaSmart's real BLE sensor connection is intended for Android.

# 4. EAS Build Profiles

File: eas.json

{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "internal": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true,
      "android": { "buildType": "app-bundle" }
    }
  }
}

- development: used for developer testing and debugging.
- internal: used for OJT/internal tester distribution.
- production: used for a release build when the project is ready for production distribution.
- Exact EAS settings should be finalized with the actual Expo project configuration.
# 5. Local Development Setup

- npm install
- npx expo start
- npx expo start --android
- npm test
- npm run lint
- npm run test:coverage
- npx expo start --clear
A physical Android device should be used for real BLE testing when the selected water-flow sensor is available. Emulator/simulator testing can use controlled mock/simulated telemetry.

# 6. Pre-commit Hooks

Recommended tools: Husky + lint-staged

Example package configuration:

"lint-staged": {
  "*.{js,jsx}": ["eslint --fix", "prettier --write"],
  "*.json": ["prettier --write"]
}

Recommended pre-commit checks:

- Run lint-staged formatting/lint fixes.
- Run ESLint on changed JavaScript files.
- Optionally run a fast unit-test subset.
- Keep full integration/E2E tests in CI rather than slowing every commit.
# 7. Code Quality Tools

| Tool | Purpose | Configuration |
| --- | --- | --- |
| ESLint | Linting JavaScript + React Native code | eslint.config.js / project ESLint configuration |
| Prettier | Consistent code formatting | .prettierrc |
| React Hooks lint rules | Detect incorrect hook dependencies and common hook mistakes | ESLint configuration |
| Jest | Unit and integration testing | jest.config.js / package configuration |
| React Native Testing Library | Component and interaction testing | Test files under __tests__/ |

# 8. Secrets Management

| Secret | Stored In |
| --- | --- |
| EXPO_TOKEN | GitHub Actions encrypted secret |
| Android/Google Play credentials, if store submission is enabled | GitHub Actions encrypted secret or approved secure credential mechanism |
| Apple credentials, if iOS distribution is enabled | GitHub Actions encrypted secrets / EAS-managed credentials |

- Do not commit tokens, signing keys, service-account JSON files, BLE credentials, or private certificates to Git.
- A local .env file should not be committed. If environment configuration is introduced later, use .env.example for non-secret variable names only.
- The MVP is local-first and does not require a backend URL or application API key.
# 9. Dependency Scanning

| Tool | How Used |
| --- | --- |
| npm audit | Run in CI; review/fail on high-risk vulnerabilities according to release policy |
| GitHub Dependabot | Automated dependency update/security PRs |
| Lockfile review | Keep package-lock.json synchronized and review unexpected dependency changes |

- Only use additional scanners such as Trivy if the project introduces artifacts or filesystems where that scan provides meaningful coverage.
- Dependency findings should be triaged rather than blindly ignored.
# 10. Build Artifact Management

| Artifact | Where Stored | Retention / Policy |
| --- | --- | --- |
| Android internal APK | EAS/internal distribution | Keep according to OJT release policy |
| Android production AAB | EAS build storage / release system | Retain release artifacts according to project policy |
| Coverage report | GitHub Actions artifact | Short-term CI retention |
| Test reports/logs | GitHub Actions artifact | Short-term CI retention |

Exact retention periods should be configured after the project's GitHub/EAS plan and OJT submission requirements are known.

# 11. Release Process

1. Create release/vX.Y.Z from develop when a release candidate is ready.

2. Update the application version/build number according to the Expo/EAS configuration.

3. Open a pull request from release/vX.Y.Z to main.

4. CI must pass: lint, tests, security checks, and build validation.

5. Obtain review/approval and merge to main.

6. CD automatically starts the configured EAS build.

7. Distribute the Android build to internal testers.

8. Perform release-candidate smoke tests, including BLE connection, live flow monitoring, usage calculation, leak alarm, history, and recovery.

9. Record known limitations, especially any tests that could not be performed with the physical sensor.

# 12. CI/CD Quality Gates

| Gate | Required Result |
| --- | --- |
| Lint | No blocking lint errors |
| Unit tests | All required tests pass |
| Integration tests | All critical data/BLE/database integration tests pass |
| Security scan | No unaccepted high/critical vulnerability |
| Build validation | Expo/EAS configuration produces a valid build or validation result |
| E2E smoke tests | Core MVP flows pass before release candidate |
| Database migrations | Migration tests pass |
| Leak detection regression suite | Normal, intermittent, suspicious continuous flow, invalid telemetry, and recovery scenarios pass |

- A simulator-only passing result must not be described as physical sensor validation.
- A release may be blocked when a critical defect affects leak alarming, telemetry integrity, data persistence, or application stability.
# 13. OJT Development and Hardware Boundary

- During OJT development, deterministic BLE simulator/mock data may be injected into the application to test telemetry parsing, usage calculation, leak detection, alarms, and error handling.
- In real use, AquaSmart connects to the physical BLE water-flow sensor; the simulator is not part of the production sensing path.
- The final BLE service UUID, characteristic UUID, payload structure, scaling, and device-specific pairing behavior must be incorporated into the CI-tested code once the physical sensor specification is finalized.
- Hardware-in-the-loop testing should be added later when the physical sensor is available.
# 14. Summary

The AquaSmart CI/CD pipeline provides automated quality checks for the JavaScript React Native application before code reaches the main branch, and controlled EAS builds for internal distribution after approved merges. The pipeline prioritizes automated testing of BLE telemetry handling, SQLite persistence, usage calculation, leak detection, alarms, and core UI behavior. Physical sensor validation remains a separate hardware-testing activity; simulated BLE data is used only to make software tests deterministic during OJT development.
