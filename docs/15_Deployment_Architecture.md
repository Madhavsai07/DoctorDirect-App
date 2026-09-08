**Deployment Architecture**

**AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App**

Document ID: DEPLOY-AS-01

Status: Draft

Date: 2026-09-07

Track: Application Development / Mobile IoT

# 1. Deployment Overview

AquaSmart is a mobile IoT application. The MVP has no required application server or cloud database. Deployment primarily means building the Android application and distributing it to development/internal testers. The real production data path is the physical BLE water-flow sensor → AquaSmart Android app.

| Environment | Distribution Method | Users |
| --- | --- | --- |
| Development | Expo development server / development build | Developer |
| Internal Testing | EAS Build → internal Android APK | OJT mentor, developer, testers |
| Production (future) | Google Play Store / approved distribution channel | End users |

- The physical BLE water-flow sensor is a runtime device dependency for real-world use, but it is not a cloud deployment component.
- The BLE simulator/mock is a development and testing substitute only and is not part of the production deployment architecture.
# 2. Development Environment

Recommended setup:

- Install the supported Node.js LTS version defined by the project.
- Install project dependencies with npm install.
- Start the Expo development environment with npx expo start.
- Use an Android emulator for UI development where BLE hardware is not required.
- Use a physical Android device for real BLE testing when the selected physical water-flow sensor is available.
| Command | Result |
| --- | --- |
| npx expo start | Starts Expo development server |
| npx expo start --android | Runs the app on an Android emulator/device |
| npm test | Runs automated tests |
| npm run lint | Runs JavaScript linting |

BLE note: an emulator/development environment should not be reported as physical sensor validation. Controlled simulated telemetry can be used for software testing.

# 3. EAS Build (Expo Application Services)

## 3.1 What EAS Does

- Builds the React Native/Expo project into installable Android artifacts.
- Can manage cloud builds and signing configuration.
- Provides build artifacts and distribution mechanisms for internal testing.
- Separates development/internal/production build profiles.
## 3.2 Build Profiles

Recommended baseline:

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

## 3.3 Build Commands

- eas build --platform android --profile development
- eas build --platform android --profile internal
- eas build --platform android --profile production
## 3.4 Build Output

| Profile | Android | Purpose |
| --- | --- | --- |
| development | APK | Developer/debug testing |
| internal | APK | OJT/internal tester distribution |
| production | AAB | Google Play production submission |

# 4. Distribution

## 4.1 Internal Distribution (MVP / Testing)

| Platform | Internal Method |
| --- | --- |
| Android | EAS internal distribution APK / controlled sideloading |

- Share the internal APK only with intended testers.
- Before installation, testers should verify that the APK came from the project/EAS build channel.
- A physical Android device should be used to validate the actual BLE connection once the sensor is available.
## 4.2 Production Distribution (Post-MVP)

| Target | Method |
| --- | --- |
| Google Play Store | EAS production build followed by Play Console submission |
| Other controlled distribution | Signed production APK/AAB where appropriate |

iOS deployment is not a primary AquaSmart target because the documented production use case is Android BLE sensor connectivity. If iOS support is added later, it should be treated as a separate platform deployment track.

# 5. App Configuration

The Expo configuration should define the AquaSmart application identity, Android package, icon/splash assets, BLE-related permissions/configuration required by the selected library, and SQLite/native plugin configuration as applicable.

{
  "expo": {
    "name": "AquaSmart",
    "slug": "aquasmart",
    "version": "1.0.0",
    "orientation": "portrait",
    "android": {
      "package": "com.aquasmart.app"
    }
  }
}

- The exact Android BLE permission configuration must match the final React Native BLE library version and Android API behavior.
- Do not copy permissions from unrelated applications; only request permissions actually required by AquaSmart.
- The final package identifier should be confirmed before the first production build because changing it later affects distribution identity.
# 6. Versioning Strategy

| Field | Example | When to Increment |
| --- | --- | --- |
| version | 1.0.0 | Every public/release milestone |
| Android versionCode | 1, 2, 3... | Every distributed Android build |

- Use semantic application versions for release milestones.
- Use an increasing Android build number/versionCode for each distributable build.
- EAS auto-increment can be enabled for production builds if desired.
# 7. Over-the-Air (OTA) Updates

OTA JavaScript updates may be considered after the MVP, but they are not required for the initial OJT deployment.

| Change | OTA Appropriate? | Reason |
| --- | --- | --- |
| Pure JavaScript/UI change | Potentially yes | No native binary change |
| Leak detection JavaScript rule change | Potentially yes, after safety review | Changes application behavior without necessarily changing native code |
| New native BLE module | No | Requires a new native build |
| BLE native configuration/permission change | No | Requires a new native build |
| Expo/native dependency upgrade | Usually no | Rebuild and regression test |

- For a water-leak alarm application, OTA changes affecting detection/alarm behavior should be released only after the relevant regression tests pass.
- MVP deployment can keep all releases on the EAS build path for simpler traceability.
# 8. Database Migration on Update

When the SQLite schema changes, AquaSmart should run controlled migrations during application startup before repositories depend on the new schema.

async function runMigrations(db) {
  const currentVersion = await getDatabaseVersion(db);

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      await runMigrationInTransaction(db, migration);
    }
  }
}

- Migrations must be tested from a clean database and from representative previous schemas.
- Existing flow readings, usage records, leak events, sensor records, and settings must not be silently lost.
- Destructive schema changes should require an explicit migration design and backup/recovery consideration rather than being assumed safe.
- Migration failures should surface a recoverable application error and be logged for diagnosis.
# 9. Infrastructure Cost

| Component | Cost / MVP Treatment |
| --- | --- |
| Backend server | $0 — no required backend |
| Cloud database | $0 — SQLite stored locally on device |
| CDN/web hosting | $0 — not required for the mobile MVP |
| Expo/EAS | Use available plan/quota; verify current pricing before long-term production use |
| Google Play Developer account | Required only if publishing publicly; current fee should be verified before purchase |
| Physical BLE sensor | Hardware cost depends on selected sensor; not included in software infrastructure |

The earlier FitTrack sample's fixed EAS/free-tier and store-fee amounts are not treated as AquaSmart commitments; service pricing and quotas can change and should be checked at the time of deployment.

# 10. Deployment Checklist

| Checklist Item | Status |
| --- | --- |
| Automated unit/component/integration tests pass |  |
| Core E2E tests pass on Android |  |
| Android internal build installs successfully |  |
| BLE permissions are correct for the final Android target |  |
| Real physical sensor connection tested, when hardware is available |  |
| Invalid/missing/duplicate/out-of-order telemetry tested |  |
| Leak alarm tested with controlled scenarios |  |
| SQLite migration tests pass |  |
| App works with network unavailable for local-first features |  |
| Large-font/accessibility checks completed |  |
| Production package/version/build number verified |  |
| Release notes/CHANGELOG updated |  |

- If physical sensor hardware is unavailable during the OJT, mark the physical-sensor checklist item as not testable rather than passing it using simulator data.
- Before a production release, perform a final smoke test using the actual selected sensor and Android device.
# 11. Production Deployment Architecture

Physical BLE Water-Flow Sensor
        ↓ BLE
AquaSmart Android Application
        ↓
Telemetry Parser & Validation
        ↓
SQLite Local Storage
        ↓
Usage Analysis + Leak Detection
        ↓
Dashboard / Usage Charts / Leak History / Alarm

No cloud server is required for the core monitoring path. Future cloud synchronization, remote notifications, or remote valve control would introduce additional deployment infrastructure and should be documented as separate architecture changes.

# 12. Summary

AquaSmart deployment is centered on a signed Android mobile application distributed through Expo/EAS for development and internal testing, with Google Play as the future public distribution channel. The application is local-first and does not require a backend or cloud database for the MVP. The physical BLE water-flow sensor is the real runtime input, while simulated BLE data is limited to development and automated testing. Database migrations, Android permissions, leak-alarm behavior, and physical BLE validation are release-critical checks.
