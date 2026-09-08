# **Technical Requirements Document (TRD)** 

## **AquaSmart — Bluetooth Water Flow Meter & Leak Alarm App** 

|Document ID|TRD-OJT-AQ-01|
|---|---|
|Version|1.0|
|Status|Draft|
|Date|2026-09-07|
|Track|Application Development / Mobile IoT|



### **1. Technical Goals** 

|Goal|Description|
|---|---|
|BLE Sensor Simulation|<br>Provide a realistic BLE peripheral/GATT server on<br>the MacBook that can generate controlled<br>water-flow telemetry for AquaSmart testing.|
|Reliable Telemetry Processing|Receive, decode, validate, and process BLE flow<br>readings without treating malformed data as valid<br>measurements.|
|Local Data Durability|Persist validated flow readings, usage information,<br>usersettings, and possible-leakeventsinSQLite.|
|Real-Time Monitoring|Update the dashboard as new valid BLE telemetry<br>is received.|
|Water-Usage Calculation|Calculate estimated water consumption from flow<br>rate and elapsed time and aggregate it for hourly,<br>daily, and weekly views.|
|Leak Detection|Evaluate flow magnitude, persistence,<br>interruptions, and data quality using deterministic,<br>testable logic.|
|Alarm Reliability|Trigger a loud audio alarm and visual warning only<br>when configured possible-leak conditions are<br>satisfied.|
|Testability|Keep BLE, parsing, calculation, storage, and<br>leak-detection logic separated so each core area<br>can be tested independently.|
||Keep the application processing pipeline|
|Future Hardware Compatibility|independent of the simulator so a compatible real<br>BLE flow sensor can replace it later.|



### **2. Technical Constraints** 

|Constraint|Description|
|---|---|
|Application Platform|React Native mobile application using JavaScript<br>and Expo.|
|BLE Central|AquaSmart acts as the BLE Central/GATT Client<br>and receives telemetry from the simulator.|
|BLE Simulator|MacBook acts as a BLE Peripheral/GATT Server<br>using a native macOS implementation with<br>CoreBluetooth.|
|BLE Library|react-native-ble-plx is used on the mobile<br>application side for BLE central/client<br>communication.|



|Native BLE Requirement|Because BLE communication requires native<br>functionality, the mobile project should use an<br>Expo development build rather than relying only on<br>Expo Go.|
|---|---|
|Data Store|SQLite through expo-sqlite for application data;<br>business data should not depend on a remote<br>backend.|
|Language|JavaScript for the AquaSmart React Native<br>application. The simulator may use Swift because<br>it is a native macOS BLE component.|
|Backend|No backend server is required for the OJT MVP.|
|Hardware|No physical water-flow sensor is available for the<br>OJT; the simulator is the controlled sensor<br>substitute.|
|Project Duration|9weeks.|
|Team|Solo student project.|



### **3. Technology Selection** 

#### **3.1 Mobile Framework: React Native + Expo** 

React Native is selected for AquaSmart because the application is a mobile IoT monitoring client and requires a single JavaScript-based application codebase. Expo is used to simplify React Native project setup, development, builds, and access to supported device capabilities. 

|Criterion|React Native+Expo|Alternative Native App|
|---|---|---|
|Development|Single JavaScript application<br>codebase|Separate platform-specific<br>codebases may be required|
|UI Development|React component model|Platform-specific UI frameworks|
|Local Storage|expo-sqlite integration|Native SQLite APIs|
|Build|Expo/EAS development and<br>build tooling|Native Android/iOS build tooling|
|Decision|Selected|Not selected for the AquaSmart<br>mobile application|



Decision: React Native + Expo, with an Expo development build to support the required BLE native functionality. 

#### **3.2 BLE Communication: react-native-ble-plx** 

AquaSmart uses react-native-ble-plx on the mobile application side to scan for, connect to, discover, and receive data from the BLE sensor simulator. The library is used as the BLE Central/GATT Client. 

|Criterion|react-native-ble-plx|Web Bluetooth|
|---|---|---|
|Mobile BLE Central|Designed for React Native BLE<br>communication|Browser-dependent|
|GATT Access|Service/characteristic discovery<br>and notifications|Browser API limitations vary|
|Application Type|Nativemobile application|Web application|
|Decision|Selected|Not selected|



Important boundary: react-native-ble-plx is used for the AquaSmart mobile client. It is not used to make the MacBook simulator a BLE peripheral. The simulator uses the native macOS CoreBluetooth peripheral APIs. 

#### **3.3 BLE Sensor Simulator: Swift + SwiftUI + CoreBluetooth** 

The OJT sensor simulator runs as a native macOS application. Swift and SwiftUI are used for the simulator application and CoreBluetooth is used to expose the simulator as a BLE Peripheral/GATT Server. 

|Criterion|Native macOS Simulator|Web Simulator|
|---|---|---|
|BLE Peripheral Role|Supported through<br>CoreBluetooth|Browser support is not suitable<br>fortherequired peripheral role|
|GATT Service/Characteristic<br>Control|Direct native control|Limited/unsuitable for this<br>architecture|
|Scenario Engine|Runs locally with controlled<br>timing|Would add browser/runtime<br>constraints|
|Decision|Selected|Not selected|



#### **3.4 Local Database: SQLite via expo-sqlite** 

SQLite is selected because AquaSmart stores time-series flow readings, usage summaries, leak events, and settings that benefit from structured queries and persistence. 

|Criterion|SQLite|Simple Key-Value Storage|
|---|---|---|
|Time-Series Queries|Yes|Limited|
|Filtering/Aggregation|SQL queries|Application-side processing|
|Structured Relationships|Yes|No native relational model|
|Persistence|Local durable storage|Local durable storage|
|Decision|Selected|Not selected for core business<br>data|



Decision: expo-sqlite for core application data. Simple preferences may use an appropriate local preference mechanism if needed, but operational flow/leak data remains in SQLite. 

#### **3.5 State Management** 

AquaSmart should keep application state separated from persistent data. A lightweight state-management approach may be used for current BLE connection state, live telemetry, alarm state, and UI preferences, while SQLite remains the source of truth for historical data. 

Decision: Use a lightweight React Native state-management approach such as Zustand where global client state is needed. SQLite repository functions remain responsible for persisted business data. 

#### **3.6 Audio Alarm: expo-av** 

expo-av is used for the OJT alarm capability where supported by the selected Expo environment. The alarm service must be separated from leak-detection logic so that detection decides when an alarm is required and the audio layer handles playback. 

Decision: Use expo-av for the loud leak-alarm audio requirement. 

#### **3.7 Charts** 

A React Native-compatible charting library will be used to display hourly, daily, and weekly water-usage data. The final library can be fixed during implementation based on Expo compatibility and project stability. 

Decision: Use a React Native-compatible charting library; the specific package is an implementation decision to be finalized before chart development. 

### **4. System Requirements** 

<u>Requirement Value</u> 

|Mobile Framework|React Native+Expo|
|---|---|
|Application Language|JavaScript|
|BLE Mobile Client|react-native-ble-plx|
|BLE Simulator|Native macOS application using Swift/SwiftUI +<br>CoreBluetooth|
|Database|SQLite via expo-sqlite|
|Audio|expo-av|
|Mobile Target|Android phone for the primary OJT demonstration|
|DevelopmentMachine|M5MacBook|
|BLE Roles|MacBook = BLE Peripheral/GATT Server; Android<br>app=BLE Central/GATT Client|
|Backend|None required for MVP|
|Duration|9 weeks|



### **5. Functional Technical Requirements** 

|ID|Requirement|Description|Maps To|
|---|---|---|---|
|TR-001|BLE Device Scan|Scan for the AquaSmart<br>simulator and identify<br>compatible BLE<br>devices.|BR-001|
|TR-002|BLE Connection|Connect to the selected<br>simulator and report<br>connection state.|BR-001|
|TR-003|GATT Discovery|Discover the simulator's<br>defined service and<br>flow-data characteristic.|BR-001 / BR-002|
|TR-004|Telemetry Subscription|Subscribe to flow<br>notifications from the<br>simulator characteristic.|BR-001|
|TR-005|BLE Packet Parsing|Decode the simulator's<br>defined byte packet into<br>application-level flow<br>data.|BR-002|
|TR-006|Telemetry Validation|Validate flow values,<br>packet structure,<br>sequence information,<br>and other defined fields<br>before processing.|BR-003|
|TR-007|Timestamping|Associate each<br>accepted reading with<br>an application<br>timestamp; use sensor<br>timestamp only if the<br>defined protocol<br>provides one.|BR-004 / BR-005|
|TR-008|Flow Storage|Insert validated flow<br>readings into SQLite.|BR-004|
|TR-009|Water-Usage<br>Calculation|Calculate volume from<br>flow rate and elapsed<br>time and aggregate it for<br>required periods.|BR-005|
|TR-010|Dashboard Updates|Update current flow,<br>today's usage, BLE<br>status, andleakstate as|BR-006|



|||valid telemetry is<br>processed.||
|---|---|---|---|
|TR-011|Usage Aggregation|Provide hourly, daily,<br>and weekly datasets for<br>chart rendering.|BR-007|
|TR-012|Leak Detection Engine|Analyze validated flow<br>patterns, persistence,<br>interruptions, and data<br>quality to classify<br>predefined scenarios.|BR-008|
|TR-013|Leak Alarm|Start a loud alarm and<br>visual warning when<br>configured leak<br>conditions are satisfied.|BR-009|
|TR-014|Leak Event Persistence|Store possible-leak<br>event start/end times,<br>duration, and relevant<br>flow information.|BR-010|
|TR-015|BLE Error Handling|Handle scan,<br>connection, discovery,<br>subscription, and<br>disconnect errors.|BR-011|
|TR-016|Data Error Handling|Handle invalid, missing,<br>duplicate, out-of-order,<br>or impossible telemetry<br>according to the defined<br>protocol.|BR-011|
|TR-017|Alarm Recovery|Stop or acknowledge<br>the alarm and move the<br>application back to a<br>monitoring/recovery<br>state according to the<br>defined logic.|BR-009|
|TR-018|Simulator Scenarios|Support controlled<br>normal, continuous,<br>intermittent, high-flow,<br>zero-flow, and error<br>scenarios.|BR-012|
|TR-019|Simulator Ground Truth|Keep the intended<br>scenario value available<br>to compare simulator<br>output with AquaSmart's<br>decoded value during<br>testing.|BR-012|
|TR-020|Future Shutoff<br>Command|Keep a command<br>boundary for a future<br>compatible BLE shutoff<br>valve without making<br>valve control part of the<br>MVP.|BR-013|



### **6. Non-Functional Requirements** 

|Category|Metric|Target|
|---|---|---|



|Performance|BLE telemetry processing|Process normal simulator<br>readings without blocking the UI.|
|---|---|---|
|Performance|Dashboard update|Current flow and status update<br>promptly after valid telemetry is<br>received.|
|Performance|SQLite write|Persist normal readings without<br>causing visible UI lag under the<br>defined OJT sampling rate.|
|Performance|Chart rendering|Render required<br>hourly/daily/weekly datasets<br>responsively for the expected<br>OJT data volume.|
|Reliability|Valid telemetry|All predefined valid simulator<br>packets are parsed correctly.|
|Reliability|Invalid telemetry|Invalid predefined packets are<br>rejected orsafelyhandled.|
|Reliability|Alarm|No alarm for predefined normal<br>scenarios; alarm for predefined<br>leakscenarios.|
|Data Integrity|Persistence|Stored flow and leak records<br>remain retrievable after app<br>restart.|
|BLE|Reconnect|Application can recover from a<br>controlled disconnect scenario.|
|Usability|Monitoring clarity|Connection, current flow, usage,<br>and leak status are<br>understandable at a glance.|
|Testability|Core logic|Parser, validation, calculation,<br>and leak detection can be tested<br>independently.|



### **7. API Requirements** 

No REST API or cloud API is required for the AquaSmart MVP. The application is designed around local BLE and SQLite operations. 

The application should use repository/service boundaries rather than allowing UI components to execute raw database queries directly. 

Example repository pattern: 

interface FlowRepository { addReading(reading): Promise<void>; getReadings(startTime, endTime): Promise<FlowReading[]>; getUsageSummary(startTime, endTime): Promise<UsageSummary>; } 

interface LeakRepository { createEvent(event): Promise<void>; listEvents(limit, offset): Promise<LeakEvent[]>; getEventById(id): Promise<LeakEvent | null>; } 

The exact JavaScript implementation and data types will be defined in the LLD and Repository API Specification documents. 

### **8. Integration Requirements** 

|Integration|Purpose|Technology|
|---|---|---|
|BLE Sensor Simulator|Generate and expose water-flow<br>telemetry over BLE.|Swift / SwiftUI / CoreBluetooth|
|BLE Mobile Client|Scan, connect, discover GATT<br>services, and receive telemetry.|react-native-ble-plx|
|SQLite|Persist flow readings, usage<br>data, settings, and leak events.|expo-sqlite|
|Audio|Playtheleaksiren.|expo-av|
|Charts|Visualize hourly, daily, and<br>weekly water usage.|React Native-compatible chart<br>library|
|Navigation|Move between Dashboard,<br>Usage, Leak History, Settings,<br>and connection screens.|React Navigation /<br>Expo-compatible navigation|



### **9. Security Requirements** 

|Requirement|Implementation|
|---|---|
|Local Data|Core flow and leak data remains on the device; no<br>backend is required for the MVP.|
|BLE Validation|Only telemetry matching the application's defined<br>simulator protocol should be accepted for<br>processing.|
|Input Validation|Reject impossible or malformed flow values and<br>malformed packets.|
|No Embedded Secrets|The MVP should not require cloud API keys or<br>server credentials.|
|Permissions|Request only the Bluetooth permissions required<br>by the target mobile platform and BLE functionality.|
|Privacy|The application should clearly communicate that<br>the OJT MVP stores operational data locally.|
||Any future shutoff-valve command must require|
|Future BLE Control|<br>explicit device identification and protocol validation<br>before execution.|



### **10. Observability Requirements** 

|Signal|Tool / Method|Purpose|
|---|---|---|
|BLE Connection Logs|Development logging|Track scan, connection,<br>discovery, disconnect, and<br>reconnect behavior.|
|Packet Parsing Logs|Parser diagnostics|Compare raw test packets with<br>decoded values during<br>development.|
|Data Validation Logs|Validation diagnostics|Identify rejected or malformed<br>telemetry.|
|Leak Detection Logs|Development diagnostics|Record state transitions and<br>detection reasons during<br>controlled testing.|



|SQLite Diagnostics|Repository logging|Identify failed writes, queries,<br>and unexpected database states.|
|---|---|---|
|Alarm Diagnostics|Alarm service logging|Confirm alarm start, stop, and<br>recovery behavior.|
|Simulator Logs|macOS simulator console|Track generated scenarios,<br>sequence numbers, and<br>transmitted packets.|



### **11. Deployment Requirements** 

|Requirement|Detail|
|---|---|
|Mobile Development|Develop the React Native application on the M5<br>MacBook and run it on the Android test device.|
|BLE Development|Run the native macOS BLE simulator on the M5<br>MacBook.|
|Development Build|Use an Expo development build because the<br>application requires native BLE functionality.|
|Demo Architecture|MacBook BLE Simulator → BLE → Android<br>AquaSmart App.|
|Testing|Use controlled simulator scenarios to test normal<br>flow, continuous flow, intermittent flow, high flow,<br>zero flow, and error conditions.|
|Presentation|The Android AquaSmart application can be<br>mirrored to the MacBook/projector for<br>demonstration while the MacBook simultaneously<br>runs the BLE simulator.|
||A compatible physical BLE flow sensor can replace|
|Future Hardware|the simulator only after its actual BLE protocol is<br>documented and tested.|



_AquaSmart — Technical Requirements Document | Polaris School of Technology_ 

