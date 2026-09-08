# **UX Requirements** 

## **AquaSmart — Bluetooth Water Flow Meter & Leak Alarm App** 

|Document ID|UX-OJT-AQ-01|
|---|---|
|Status|Draft|
|Date|2026-09-07|
|Track|Application Development / Mobile IoT|



### **1. Information Architecture** 

#### **Navigation Structure** 

AquaSmart App 

│ 

├── Bottom Tab Navigator 

- │   ├── Dashboard (tab 1) 

- │   │   ├── BLE Connection Card 

- │   │   ├── Current Flow Rate 

- │   │   ├── Today's Water Usage 

- │   │   ├── Leak Status / Risk 

- │   │   └── Continuous Flow Duration 

- │   │ 

- │   ├── Usage (tab 2) 

- │   │   ├── Hourly Usage 

- │   │   ├── Daily Usage 

- │   │   ├── Weekly Usage 

- │   │   └── Time Range / View Selector 

- │   │ 

- │   ├── Leak History (tab 3) 

- │   │   ├── Possible-Leak Event List 

- │   │   └── Leak Event Detail 

│   │ 

- │   └── Settings (tab 4) 

- │       ├── Leak Detection Settings 

- │       ├── Alarm Settings 

- │       └── BLE / Sensor Information 

│ 

├── Connection Flow 

- │   ├── Scan for Simulator 

- │   ├── Available BLE Devices 

- │   └── Connected Sensor Status 

│ 

- └── Development / Testing Screen ├── Normal Flow ├── Continuous Flow 

- ├── Intermittent Flow 

- ├── High Flow └── Sensor / BLE Error Scenarios 

### **2. User Flows** 

**Flow 1: Dashboard → Connect to BLE Simulator** 

Dashboard 

→ "Connect Sensor" button 

- → BLE scanning begins 

- → Available AquaSmart BLE simulator appears 

- → User selects simulator 

- → Application connects and discovers the required BLE data 

- → Connection status changes to Connected 

- → Current flow telemetry begins appearing on Dashboard 

- → Continue monitoring 

#### **Flow 2: Monitor Water Usage** 

Dashboard 

→ View current flow rate and today's usage 

→ Tap Usage tab 

→ Select Hourly / Daily / Weekly view 

- → View calculated water-consumption data 

- → Select a time period if required 

- → Return to Dashboard 

#### **Flow 3: Possible Leak Detection and Alarm** 

Connected Dashboard 

→ Continuous telemetry is received 

→ Flow data is validated 

→ Flow pattern is analyzed 

- → Suspicious persistent flow is identified 

- → Detection conditions continue to be evaluated 

- → Defined 30-minute controlled condition is reached 

- → Possible Leak status appears 

- → Visual warning is displayed 

- → Loud siren starts 

- → Event is recorded in Leak History 

- → User acknowledges/stops the alarm 

- → Monitoring continues 

#### **Flow 4: Review Leak History** 

Leak History tab 

→ View list of previous possible-leak events 

- → Select an event 

- → View start time, end time, duration, and relevant flow information → Return to Leak History 

#### **Flow 5: Handle BLE/Data Error** 

Monitoring 

- → BLE disconnect / invalid / missing telemetry detected 

- → Dashboard shows connection or data-quality warning 

- → Invalid data is excluded from normal flow/leak interpretation 

- → User can retry/reconnect 

- → Connection restored 

- → Monitoring resumes 

### **3. Screen Requirements** 

**Screen 1: Dashboard** 

|Attribute|Detail|
|---|---|
|Purpose|Primary real-time monitoring screen for household<br>water flow.|
|Components|BLE connection card, current flow-rate card,<br>today's usage card, leak status/risk card,<br>continuous-flow duration, recent status information.|
|User Actions|Connect/reconnect sensor, open Usage, open<br>Leak History, open Settings, acknowledge/stop an<br>active alarm.|
|Loading State|Connection/loading indicator while BLE scan or<br>connection is being established.|
|Empty State|No sensor connected: "Connect a BLE sensor to<br>start monitoring."|
|Error State|Connection lost or invalid telemetry: clear warning<br>with retry/reconnect action.|
||Prominent possible-leak warning showing current|
|Leak State|flow, continuous suspicious-flow duration, and<br>alarmstate.|



|Dashboard Layout:|
|---|



AquaSmart 

BLE Sensor 

● Connected 

Current Flow 3.5 L/min 

Today's Usage 125 L 

Status NORMAL 

Continuous Flow 

08:42 

[ Usage ]   [ Leak History ] 

##### **Dashboard Status Design** 

|State|User-Facing Information|
|---|---|
|Disconnected|Sensor disconnected—Connect/Reconnect|
|Connected / Normal|Sensor connected — Current flow and usage<br>visible|



|Monitoring|Flow is being received and analyzed|
|---|---|
|Suspicious Flow|Possible suspicious continuous flow — monitoring<br>condition|
|Possible Leak|Possible Leak — alarm active / user attention<br>required|
|Data Error|Invalid or missing telemetry — data is not being<br>interpreted as normal flow|



**Screen 2: BLE Connection Screen** 

|Attribute|Detail|
|---|---|
|Purpose|Discover and connect AquaSmart to the BLE<br>sensor simulator.|
|Components|Scan button, device list, device name, connection<br>state, retry/reconnect action.|
|User Actions|Start scan, select simulator, connect, disconnect,<br>retry.|
|Loading State|Scanning indicator while BLE discovery is active.|
|Empty State|No compatible simulator found: "No AquaSmart<br>sensor found. Make sure the simulator isrunning."|
|Error State|BLE permission, connection, or discovery error<br>with a retry option.|
|Behavior|After successful connection, return to Dashboard<br>and begin telemetry monitoring.|



**Screen 3: Usage Screen** 

|Attribute|Detail|
|---|---|
|Purpose|Visualize calculated water consumption over time.|
|Components|Time-range selector, usage summary, hourly chart,<br>daily chart, weekly chart.|
|User Actions|Switch between time ranges/views, inspect chart<br>data, return to Dashboard.|
|Loading State|Skeleton chart or compact loading indicator while<br>local data is queried.|
|Empty State|No usage data: "No water-usage data available<br>yet."|
|Error State|Unable to load usage data: retry action.|
|Behavior|Charts use processed data derived from stored<br>flow readings.|



**Screen 4: Leak History** 

|Attribute|Detail|
|---|---|
|Purpose|Review previously recorded possible-leak events.|
|Components|Date/time, duration, flow summary, event status,<br>list of recorded events.|
|User Actions|Tap event to open details; return to list.|
|Loading State|Skeleton event list while SQLite data is queried.|
|Empty State|No events:"No possible leaks detected."|
|Error State|Unable to load history: retry action.|
|Behavior|Events are read from the local SQLite database.|



#### **Screen 5: Leak Event Detail** 

|Attribute|Detail|
|---|---|
|Purpose|Show detailed information about one recorded<br>possible-leakevent.|



|Components|Start time, end time, duration, flow information,<br>detection status.|
|---|---|
|User Actions|Review event and return to history.|
|Data Source|Leak event records stored in SQLite.|



**Screen 6: Settings** 

|Attribute|Detail|
|---|---|
|Purpose|Configure monitoring and alarm preferences.|
|Components|Leak-detection duration/conditions, alarm<br>enable/disable, alarm volume preference where<br>supported, BLE/sensor information.|
|User Actions|Change supported settings and save/apply them.|
|Validation|Settings must remain within defined acceptable<br>ranges.|
|Persistence|Usersettings are storedlocally.|



**Screen 7: Active Leak Alarm** 

|Attribute|Detail|
|---|---|
|Purpose|Immediately notify the user when a possible leak<br>satisfies the configured alarm conditions.|
|Components|Prominent warning, current flow rate,<br>continuous-flow duration, alarm indicator,<br>stop/acknowledge control.|
|User Actions|Acknowledge/stop the alarm and inspect Leak<br>History.|
|Visual State|High-priority warning state distinct from normal<br>Dashboard status.|
|Audio|Play loud siren using the application's audio<br>capability.|



**Screen 8: Testing / Simulation Controls** 

|Attribute|Detail|
|---|---|
|Purpose|Provide controlled scenarios for development and<br>verificationof AquaSmart.|
|Components|Scenario buttons for normal flow, continuous flow,<br>intermittent flow, sudden high flow, zero flow,<br>invalid telemetry, missing readings, and BLE<br>disconnect.|
|User Actions|Start/stop a scenario and observe the resulting<br>application behavior.|
|Behavior|Scenario controls are intended for<br>development/testing and should not be confused<br>with production sensor controls.|



### **4. Accessibility** 

|Requirement|Implementation|
|---|---|
|Screen Reader|All interactive controls should have meaningful<br>accessibility labels; leak warnings should clearly<br>announcethe activewarning state.|
|Font Scaling|Text should support system font scaling without<br>hiding essential flow, usage, or alarm information.|
|Color Independence|Connection, leak, warning, and error states should<br>use text/icons in addition to color.|



|Touch Targets|Interactive controls should use sufficiently large<br>touch targets for reliable mobile interaction.|
|---|---|
|Reduced Motion|Non-essential animations should be reduced or<br>disabled when the operating system requests<br>reduced motion.|
|Audio Alert Alternative|A possible leak must also have a prominent visual<br>warning so users are not dependent only on<br>sound.|
|Error Messages|Errors should explain what happened and provide<br>a clear recovery action where possible.|



### **5. UX Principles** 

|Principle|Application|
|---|---|
|Clarity|The Dashboard should make current flow, usage,<br>connection state, and leak status understandable<br>at a glance.|
|Safety First|Possible-leak warnings should be visually<br>prominent andrequire clearuserattention.|
|Simple Monitoring|The user should not need to navigate through<br>multiple screens to see the current water-flow<br>state.|
|Fast Feedback|New telemetry should update the relevant<br>Dashboard information without unnecessary<br>interaction.|
|Error Prevention|Invalid or missing telemetry should not be<br>interpreted as genuine water flow or a leak.|
|Consistency|Flow, usage, connection, and leak states should<br>use consistent terminology throughout the<br>application.|
|Transparency|The UI should distinguish a possible leak from a<br>confirmed physical plumbing diagnosis.|
|Testing Separation|Simulator controls should be clearly identified as<br>development/testing functionality.|
|Local Data Awareness|The application should make it clear when<br>information is stored locally on the device.|



### **6. Design System Tokens** 

**Colors — Suggested Primary Theme** 

|Token|Value|Usage|
|---|---|---|
|--color-bg|#F7FAFC|Main application background|
|--color-surface|#FFFFFF|Cards, panels, and sheets|
|--color-border|#D9E2EC|Dividers and input borders|
|--color-primary|#0EA5A8|Primary actions and<br>water-related UI|
|--color-secondary|#2563EB|Charts and secondary<br>information|
|--color-danger|#DC2626|Possible leak, alarm, and critical<br>errors|
|--color-warning|#D97706|Suspicious-flow and warning<br>states|



|--color-success|#16A34A|Normal/healthy connection or<br>successful actions|
|---|---|---|
|--color-text|#102A43|Primary text|
|--color-text-muted|#627D98|Secondary labels|



#### **Typography** 

- Font: Use a clean, readable system or bundled sans-serif font appropriate for React Native. 

- Headings: Bold/semibold for section and card titles. 

- Body: Regular weight for descriptions and supporting information. 

- Numerics: Strong/bold typography for current flow rate and today's usage. 

- Alarm Text: Bold, high-visibility typography for possible-leak status. 

#### **Spacing** 

- Base unit: 4dp. 

- Common spacing: 4, 8, 12, 16, 20, 24, 32dp. 

- Screen horizontal padding: 16dp. 

- Cards should have consistent internal padding and spacing between metric groups. 

#### **Border Radius** 

- Cards: 16dp. 

- Buttons: 12dp. 

- Input fields: 10dp. 

- Status chips: 16–20dp. 

### **7. Animation Specifications** 

|Animation|Implementation|Details|
|---|---|---|
|Telemetry value update|React Native animation where<br>useful|Use a subtle transition when<br>displayed flow/usage values<br>change; avoid distracting<br>movement.|
|BLE connection state|React Native animation|Compact transition between<br>connecting, connected, and<br>disconnected states.|
|Chart update|Charting library / React Native<br>animation|Animate or update chart data<br>smoothly without blocking<br>telemetry processing.|
|Leak warning|React Native animation|Use a clear attention animation<br>for an active possible-leak state;<br>keep it accessible and<br>non-essential motion reducible.|
|Alarm activation|Audio + visual state change|Immediately switch the UI to the<br>high-priority leak state when<br>alarm conditions are satisfied.|
|Screen transitions|React Navigation / Expo<br>navigation|Use simple, consistent<br>transitions between primary<br>screens.|



_AquaSmart — UX Requirements | Polaris School of Technology_ 

