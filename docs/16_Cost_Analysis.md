**Cost Analysis**

**AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App**

Document ID: COST-AS-01

Status: Draft

Date: 2026-09-07

Track: Application Development / Mobile IoT

# 1. Total Development Cost

For the software portion of the OJT MVP, the expected infrastructure cost is approximately $0/month because AquaSmart uses local SQLite storage and does not require a backend server, cloud database, CDN, authentication service, or mandatory analytics platform.

Important: this does not mean the complete project has no possible cost. The physical BLE water-flow sensor is a hardware dependency for real-world operation, and its price depends on the sensor selected. The OJT does not currently have physical sensor hardware.

# 2. Development Tooling Costs

| Tool / Resource | Expected Cost | Notes |
| --- | --- | --- |
| Node.js | Free | Open-source runtime |
| React Native | Free | Open-source mobile framework |
| Expo / Expo CLI | Free | Development tooling |
| EAS Build | Plan/quota dependent | Use available EAS quota; verify current pricing before sustained production use |
| Expo Go | Free | Useful for compatible development/testing scenarios |
| GitHub | Free / plan dependent | Repository and source control; student/free plan may be sufficient |
| GitHub Actions | Plan/quota dependent | Automated CI; free allowance depends on account/repository context |
| Android Studio | Free | Android SDK, emulator, and development tools |
| Figma | Free / plan dependent | Wireframes and UI design |
| JavaScript tooling (ESLint, Prettier, Jest) | Free | Open-source development/test tooling |

Estimated software tooling cost for the OJT: $0 if available free tiers/quotas are sufficient.

# 3. Hardware Costs

| Item | Cost | Purpose |
| --- | --- | --- |
| Physical BLE water-flow sensor | TBD | Real production telemetry source and hardware validation |
| Android test device | Existing device or TBD | Real BLE connectivity, performance, permissions, and alarm testing |
| Developer computer | Existing device | Application development and build preparation |

- The sensor cost cannot be finalized until the specific compatible BLE flow sensor is selected.
- The OJT software can continue using controlled BLE simulator/mock data for development and automated tests while physical hardware is unavailable.
- Simulator availability should not be counted as eliminating the eventual hardware cost for a real deployment.
# 4. Distribution Costs

| Target | Potential Cost | MVP Treatment |
| --- | --- | --- |
| Internal Android APK | $0 if existing EAS/internal distribution quota is sufficient | Primary OJT distribution method |
| Google Play Store | One-time developer registration fee may apply | Not required for the OJT unless public publishing is planned |
| iOS App Store | Apple Developer Program fee may apply | Not a primary deployment target for this project |

Current platform fees and EAS pricing can change. Verify the applicable fees and quotas at the time of purchase or publication rather than treating sample-document prices as fixed.

# 5. No Required Operational Backend Costs

| Service | AquaSmart MVP Cost | Reason |
| --- | --- | --- |
| Backend server | $0 | No required application backend |
| Cloud database | $0 | SQLite stores core data locally on the Android device |
| CDN | $0 | No required web delivery layer |
| SSL/server certificate | $0 | No backend endpoint is required for core MVP operation |
| Authentication service | $0 | MVP does not require user accounts |
| Analytics platform | $0 | No mandatory analytics SDK |
| Cloud object storage | $0 | No required user file upload |
| Remote error monitoring | $0 | Not mandatory in MVP |

The local-first architecture reduces recurring software infrastructure costs, but it does not eliminate costs associated with optional cloud features, app-store publication, EAS usage beyond included quotas, or physical IoT hardware.

# 6. Cost at Scale (Future / Hypothetical)

If a later AquaSmart release adds cloud synchronization, remote notifications, user accounts, multi-device access, or cloud backup, additional recurring costs will be introduced.

| Future Component | Purpose | Cost Status |
| --- | --- | --- |
| Backend/API | Sync and remote application services | TBD based on provider and usage |
| Cloud database | Optional synchronized data | TBD |
| Cloud backup/object storage | Remote backup of selected local data | TBD |
| Authentication | User accounts and secure multi-device access | TBD |
| Push notification service | Remote leak/usage notifications | Provider-dependent; usage and infrastructure must be evaluated |
| Monitoring/error reporting | Remote diagnostics | TBD; privacy implications must be reviewed |

- Future cloud architecture should preserve SQLite as a resilient local data layer where practical.
- Cost estimates should be based on expected users, telemetry volume, synchronization frequency, retention, and notification volume rather than copied fixed numbers.
# 7. Student Project Budget Summary

| Item | Expected OJT Cost |
| --- | --- |
| Software development tools | $0 if free tiers are sufficient |
| CI/CD | $0 if included quotas are sufficient |
| Local SQLite storage | $0 |
| Internal Android distribution | $0 if existing distribution/build quota is sufficient |
| Backend hosting | $0 for MVP |
| Physical BLE sensor | TBD / hardware-dependent |
| Public app-store publication | Optional; platform fee dependent |
| TOTAL SOFTWARE INFRASTRUCTURE | Approximately $0/month |

The strongest cost advantage of AquaSmart is its local-first architecture: core monitoring, usage history, leak analysis, and alarm functionality can operate without a continuously running cloud backend. The main unresolved project cost is the physical BLE water-flow sensor required for real-world validation and eventual deployment.

# 8. Cost Assumptions and Limitations

- Costs in this document are planning estimates, not vendor quotations.
- Free-tier availability, build quotas, CI minutes, and app-store fees can change.
- No cost is assigned to equipment already available to the student unless a purchase is required.
- Physical sensor pricing is intentionally marked TBD because no final sensor model has been selected.
- Future cloud costs are excluded from the MVP total.
# 9. Summary

AquaSmart can be developed as a low-cost OJT project because the MVP does not require a backend or cloud database. React Native, Expo, JavaScript, Jest, local SQLite, and development tooling can generally be used without recurring software infrastructure charges when free tiers are sufficient. However, real-world deployment still depends on compatible BLE water-flow sensor hardware, and optional future cloud features or public distribution may introduce additional costs.
