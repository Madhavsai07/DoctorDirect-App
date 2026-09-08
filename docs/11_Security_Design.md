Security Design

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App

| Field | Details |
| --- | --- |
| Document ID | SEC-FE-01 |
| Status | Draft |
| Track | Frontend / Mobile IoT Development |

AquaSmart's security model is primarily based on local-first data handling, mobile app sandboxing, controlled BLE communication, input validation, and minimal permissions. The production application connects to a physical BLE water-flow sensor. A BLE simulator may be used only during development/testing when physical hardware is unavailable.

# 1. Security Philosophy

The AquaSmart MVP does not require a cloud server, user account, or external REST API. Water-flow telemetry, usage history, leak events, and settings are intended to remain on the user's device. This substantially reduces risks associated with server-side breaches, account attacks, and unnecessary data transfer.

| Risk Category | AquaSmart Exposure |
| --- | --- |
| Server-side data breach | Low for MVP — no required cloud server |
| API authentication bypass | Not applicable to the local MVP |
| Internet man-in-the-middle | Not applicable to core local data flow; BLE security still applies |
| Cross-site scripting | Not applicable to the native mobile UI |
| Network-based SQL injection | Not applicable; SQLite is local |
| Credential stuffing | Not applicable; no user accounts in MVP |
| Unauthorized BLE device interaction | Relevant — controlled through BLE discovery/connection and application validation |

# 2. Threat Model

| Threat | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Phone theft → access to water usage/leak history | Medium | Medium | Rely on OS device security and app sandbox; minimize exposed sensitive data. |
| Malicious app attempts to access SQLite | Low | High | Android/iOS application sandboxing and OS security. |
| SQL injection through settings/sensor names | Low | Medium | Parameterized SQLite queries and input validation. |
| Malicious or unexpected BLE telemetry | Medium | High | Validate packet structure, flow values, timestamps, status, duplicates, and ordering. |
| BLE spoofing / unexpected device | Low–Medium | High | Use configured/recognized device identity and validate expected GATT service/characteristic information. |
| BLE disconnect during monitoring | Medium | Medium | Explicit connection state, stale-data handling, retry/reconnect UI. |
| Third-party dependency vulnerability | Low–Medium | High | Dependency review, lockfile, npm audit, and controlled upgrades. |
| Excessive mobile permissions | Low | Medium | Request only permissions required by implemented features. |
| Local backup exposure | Medium | Medium | Review platform backup behaviour and document the chosen backup policy. |
| Debug/simulation controls exposed to normal users | Low | Medium | Keep development testing controls out of normal homeowner navigation/builds where practical. |

# 3. Data Privacy

| Data Type | Stored In | Sensitivity | Leaves Device? |
| --- | --- | --- | --- |
| BLE flow readings | SQLite | Potentially sensitive household usage data | No in MVP |
| Water usage records | SQLite | Potentially sensitive household usage data | No in MVP |
| Leak events/history | SQLite | Potentially sensitive household information | No in MVP |
| Sensor metadata | SQLite | Low–Medium | No in MVP |
| Theme/unit/alert preferences | SQLite / local settings | Low | No in MVP |
| Temporary BLE connection state | In-memory Zustand state | Low | No |

## Privacy Statement

Suggested Settings text: "AquaSmart stores your water-flow, usage, leak history, and application settings locally on this device. The MVP does not require an account or cloud server. Data is not intentionally uploaded to a remote service."

This statement should be updated if cloud synchronization, remote notifications, analytics, or other network features are added in future.

# 4. Input Validation and SQL Injection Prevention

## Parameterized Queries

// CORRECT
await db.runAsync(
  'INSERT INTO sensors (name, device_identifier) VALUES (?, ?)',
  [name, deviceIdentifier]
);

// NEVER
// await db.runAsync(
//   `INSERT INTO sensors (name) VALUES ('${name}')`
// );

- All SQLite queries must use parameterized placeholders rather than string concatenation.
- Repository methods should validate inputs before executing writes.
- BLE-originated values must be treated as untrusted input even though they come from a known sensor.
## Input Validation

| Input | Validation | Suggested Limit |
| --- | --- | --- |
| Sensor name | Required where applicable, trim, reject blank | 50 chars |
| Device identifier | Validate expected identifier format | Defined by BLE integration |
| Flow rate | Finite numeric value, non-negative, within configured engineering range | Sensor/protocol dependent |
| Timestamp | Valid numeric timestamp and sane range | Protocol dependent |
| Sequence number | Integer if supplied | Protocol dependent |
| Volume | Finite, non-negative | Application-defined |
| Settings values | Allow only supported enumerations/ranges | Application-defined |
| Simulation scenario | Allow only predefined scenario values | Fixed enum |

# 5. BLE Security

BLE is part of AquaSmart's real production data path, so it requires explicit security consideration. The application should not assume that receiving a BLE packet automatically makes the data trustworthy.

- Scan and connect only to the expected sensor/device where practical.
- Verify expected GATT service and characteristic information before subscribing to telemetry.
- Validate every telemetry packet before persistence or analysis.
- Handle unexpected disconnects and reconnect attempts without corrupting usage calculations.
- Avoid exposing raw BLE payloads in production logs.
- Use the security capabilities supported by the selected physical sensor and BLE platform configuration.
- Exact pairing/bonding requirements depend on the selected physical sensor hardware and are therefore a design/TBD item until hardware is finalized.
# 6. Permissions

| Permission / Capability | Required? | When Requested | Why |
| --- | --- | --- | --- |
| Bluetooth / Nearby devices | Yes | When BLE functionality is first needed, according to Android requirements | Discover and communicate with the water-flow sensor. |
| Notifications | Future / optional | Only if notification feature is implemented | Leak or usage notifications when the app is not foregrounded. |
| Location | Avoid unless platform/sensor requirements force it | Only if technically required by the chosen BLE setup | Not a business requirement for AquaSmart. |
| Camera | No | Never for MVP | Not needed. |
| Contacts | No | Never | Not needed. |
| Motion / Activity | No for core AquaSmart flow monitoring | Never unless a future feature requires it | Water-flow monitoring does not require a phone pedometer. |
| Storage permission | No for normal SQLite use | Never | Application-private storage is sufficient. |

## Permission Denied Handling

const permission = await requestBluetoothPermission();

if (permission.granted) {
  // Continue to BLE discovery/connection
} else {
  // Show clear explanation and retry/settings guidance
  // App remains usable for local history/settings where possible
}

The exact permission API and platform-specific permission set should follow the final React Native/Expo BLE implementation and target Android version.

# 7. Third-Party Dependency Security

| Tool / Practice | Use |
| --- | --- |
| npm audit | Check known dependency vulnerabilities. |
| package-lock.json | Pin reproducible dependency resolution. |
| Dependabot | Optional automated dependency update review. |
| Code review | Review BLE, database, storage, and permission changes carefully. |
| License review | Confirm production dependencies have acceptable licenses. |

- Dependencies should be actively maintained and appropriate for React Native/Expo.
- Avoid adding analytics, advertising, or cloud SDKs that conflict with the MVP's local-first privacy model.
- New native BLE libraries should receive additional review because they interact with device permissions and transport layers.
# 8. Data Storage Security

AquaSmart stores its persistent data in the application's private SQLite database. Other ordinary applications should not be able to access that database through normal mobile sandbox mechanisms.

| Platform | Storage Model | Other Apps Access? |
| --- | --- | --- |
| Android | Application-private SQLite database | Normally no |
| iOS | Application sandbox SQLite database | Normally no |

- Do not place telemetry or leak history in general-purpose shared storage.
- Do not put sensitive telemetry data in logs, URLs, or clipboard content.
- AsyncStorage/local preference storage should be limited to non-sensitive configuration unless a future security review approves otherwise.
- If platform backup is enabled, the project must explicitly decide whether household telemetry should be included; this decision should be documented rather than assumed.
# 9. Code Security Practices

| Practice | Implementation |
| --- | --- |
| JavaScript linting | Use ESLint rules appropriate to the project. |
| No eval | Do not use eval() or equivalent dynamic code execution. |
| No dynamic SQL | Use repository parameter binding. |
| Dependency pinning | Commit lockfile and use reproducible CI installs. |
| No secrets in source | Do not store credentials, private keys, or future API secrets in the repository. |
| Production logging | Remove/debug-gate raw packet and sensitive telemetry logging. |
| Error abstraction | Show user-safe errors while retaining technical codes for diagnostics. |
| Input validation | Validate UI and BLE data before persistence/analysis. |

Because AquaSmart uses JavaScript, TypeScript-specific security controls from the FitTrack sample are intentionally not copied.

# 10. Device-Level Security

AquaSmart relies primarily on Android/iOS device security and application sandboxing for protection of local data at rest.

| Protection | Platform / Approach |
| --- | --- |
| App sandboxing | Android/iOS application sandbox |
| Device encryption | Use OS-provided encryption when the device is configured for it |
| Screen lock | OS-level PIN/password/biometric protection |
| Database access | Private application storage |
| Debug builds | Do not treat development builds as production-secure |

- An in-app PIN/biometric lock is not required for the MVP unless later requirements justify it.
- Custom database encryption is not assumed for the MVP; if threat analysis later requires it, the storage design should be revisited.
# 11. BLE Data Integrity and Safety

The most important AquaSmart-specific security boundary is the telemetry pipeline.

BLE packet
   ↓
Packet parsing
   ↓
Schema / protocol validation
   ↓
Flow + timestamp validation
   ↓
Duplicate / ordering checks
   ↓
SQLite persistence
   ↓
Usage + leak analysis

- Malformed packets must not be processed as valid water usage.
- Duplicate packets must not be double-counted.
- Out-of-order packets must not overwrite or corrupt newer state.
- Impossible flow values must be rejected or explicitly stored as invalid diagnostic test data.
- Sensor-error status must not automatically become normal zero-flow data.
- Missing packets should be represented as missing/unavailable telemetry rather than fabricated readings.
- Leak analysis should fail safely when telemetry quality is insufficient.
# 12. Security of Leak Alarms

- A leak alarm is a safety-oriented application feature, but it should not be described as guaranteed physical protection.
- The alarm UI should clearly show when the app has detected a suspicious/leak condition.
- If audio playback fails, the visual alarm state should remain active.
- A BLE disconnect should not silently clear an existing leak event.
- Future automatic shutoff-valve control requires a separate authorization and command-security design before implementation.
# 13. Development and Simulation Security

A BLE simulator is a testing tool only. It should not weaken the production architecture or be presented as the normal sensor connection.

- Simulation controls should be clearly separated from homeowner-facing screens.
- Test packets should be clearly identifiable as test data.
- Simulator scenarios should cover invalid packets, duplicates, out-of-order packets, impossible values, and disconnects.
- Production builds should not expose unrestricted packet injection controls unless explicitly required.
- Ground-truth labels used by tests should not be treated as production sensor data.
# 14. Privacy / Compliance Considerations

| Principle | AquaSmart MVP Approach |
| --- | --- |
| Data minimization | Store only data required for monitoring, usage, leak history, and settings. |
| Purpose limitation | Use telemetry for water monitoring, usage calculation, and leak analysis. |
| Local processing | Keep core processing on-device. |
| User control | Provide settings for alerts, alarm sound, units, and sensor configuration. |
| Deletion | Provide a documented local-data deletion/reset path; uninstall behaviour depends on OS. |
| Third-party sharing | No intentional third-party sharing in the local-only MVP. |
| Transparency | Explain local storage and BLE permissions in Settings/onboarding. |

Legal compliance cannot be guaranteed solely by architecture. If AquaSmart is distributed commercially, privacy notices, consent wording, retention, backup behaviour, and applicable regulations should be reviewed for the target markets.

# 15. Security Testing

| Test Area | Example Tests |
| --- | --- |
| SQL safety | Names/settings containing quotes, special characters, and long inputs. |
| BLE validation | Malformed, truncated, invalid, duplicate, out-of-order, and impossible packets. |
| Connection security | Unexpected device, disconnect/reconnect, repeated connection attempts. |
| Permission handling | Bluetooth permission denied/revoked and retry. |
| Storage isolation | Verify data is stored only in app-private locations. |
| Logging | Confirm raw telemetry and sensitive local data are not exposed in production logs. |
| Dependency security | Run npm audit and review dependency updates. |
| Alarm safety | Audio failure, app backgrounding, disconnect during alarm, persisted active event. |
| Simulation isolation | Ensure development controls are not accidentally exposed in normal production navigation. |

# 16. Security Assumptions and Deferred Decisions

- The selected physical sensor's BLE pairing/bonding and authentication capabilities are not yet finalized.
- Exact GATT UUIDs and packet encoding are not finalized.
- Whether database-level encryption is required beyond OS/device protection should be reviewed after the threat model is validated.
- Cloud synchronization and remote notifications are outside the MVP security boundary.
- Remote BLE shutoff-valve control requires a dedicated command-authentication and authorization design.
- If user accounts or cloud services are added later, the security architecture must be expanded substantially.
# 17. Summary

AquaSmart's security design is based on local-first storage, mobile sandboxing, minimum permissions, parameterized SQLite access, dependency hygiene, and strict validation of BLE telemetry. The physical BLE water-flow sensor is the normal source of production telemetry. A development BLE simulator is used only for controlled testing when physical hardware is unavailable. The design intentionally avoids unsupported claims about sensor authentication, packet security, encryption, or regulatory compliance until the selected hardware and final deployment requirements are known.
