# OJT Project 

**Student Name(s): Chinthaginjala Madhav Sai Kiran Roll No(s): 25100010700016 Year & Section: Sem 3 A Project Title (as assigned): AquaSmart - Bluetooth Water Flow Meter & Leak Alarm App Project Type: Application development** 

**Stack / Framework: React Native, Expo, JavaScript, react-native-ble-plx, expo-sqlite, expo-av, Charting Library, BLE Simulator** 

## 1. Problem Understanding 

### **1.1 What is the problem statement in your own words?** 

**AquaSmart aims to address the problem of undetected household water leaks, which can lead to unnecessary water consumption, increased water costs, and potential property damage. Users often lack a simple way to monitor water consumption in real time and identify unusual or persistent water-flow patterns. The application receives water-flow data through Bluetooth, records the readings for analysis, and displays water-usage information through charts. AquaSmart analyzes flow patterns to identify conditions that may indicate a possible leak. When the configured leak-detection conditions are satisfied, including persistent suspicious flow for the defined duration, the application alerts the user with a loud alarm.** 

### **1.2 Why does this problem exist or matter?** 

**The problem matters because undetected water leaks can waste significant amounts of water and increase household expenses. Small leaks may continue for hours or days without the homeowner noticing them. Continuous water flow can also cause damage to walls, floors, furniture, and other property. Most households do not have a simple system to monitor water usage and identify unusual flow patterns. Early detection can help users take action before the problem becomes more serious. AquaSmart provides an affordable and convenient way to monitor water flow and alert users about possible leaks.** 

### **<u>1.3 Key inputs and expected outputs:</u>** 

|**Inputs**|**Process**|**Expected Outputs**|
|---|---|---|
|**BLE Flow Data:**<br>Simulated water-flow<br>telemetry received<br>from the sensor<br>simulator.|**BLE Data**<br>**Processing:**<br>Receive, decode,<br>and validate flow<br>telemetry.|**Water Usage Data:**Stored<br>and processed flow and<br>consumption data.|
|**Sensor Data:**Flow<br>rate and timestamp<br>information.<br>**User Settings:**<br>Leak-detection<br>duration and alarm<br>preferences.<br>**Usage History:**<br>Previously recorded<br>flow readings stored<br>in the local<br>database.|**Data Storage:**Store<br>validated flow<br>readings and<br>timestamps in<br>SQLite.<br>**Usage Analysis:**<br>Calculate estimated<br>water consumption<br>and organize it by<br>time periods.<br>**Flow Pattern**<br>**Analysis:**Analyze<br>flow magnitude,<br>duration,<br>persistence,<br>interruptions, and<br>data quality.|**Usage Charts:**Hourly, daily,<br>and weekly<br>water-consumption<br>visualizations.<br>**Leak Alert:**Visual warning<br>and loud alarm when a<br>possible leak is detected.<br>**Dashboard:**Current flow<br>rate, connection status,<br>current usage, and leak<br>status/risk.|
||**Leak Detection:**<br>Evaluate flow<br>patterns against the<br>defined<br>leak-detection<br>conditions.|**Leak History:**Recorded<br>details of detected<br>possible-leak events.|
||**Alert Processing:**<br>Trigger a loud alarm<br>when a possible leak<br>satisfies the required<br>alert conditions.|**Future Output:**BLE<br>command to a compatible<br>remote shutoff valve.|



## 2. Functional Scope 

- **2.1 What are the core features you plan to build (must-haves)? These are the non-negotiable deliverables required for your final presentation:** 

**● BLE Data Simulator: Generate realistic water-flow telemetry representing different water-usage and leak scenarios.** 

**● BLE Communication & Data Parsing: Receive simulated BLE telemetry, decode it, validate it, and convert it into usable flow measurements.** 

**● SQLite Data Storage: Store validated flow readings, timestamps, calculated usage data, and leak events locally.** 

**● Water Usage Calculation: Calculate estimated water consumption from flow-rate readings and elapsed time, and aggregate the data for analysis. ● Real-Time Dashboard: Display current flow rate, BLE connection status, today's water usage, and current leak status/risk.** 

**● Water Usage Charts: Display hourly, daily, and weekly water-consumption data.** 

**● Leak Detection: Analyze validated flow patterns, persistence, interruptions, and data quality to identify conditions that may indicate a possible leak. Persistent suspicious flow, will be evaluated by the detection algorithm.** 

**● Leak Alarm: Trigger a loud siren and visual warning when the leak-detection conditions are satisfied.** 

**● Leak History: Store and display detected possible-leak events, including relevant time and duration information.** 

**● BLE & Data Error Handling: Handle BLE disconnections, missing readings, invalid telemetry, and other data-quality issues without incorrectly interpreting them as water flow or a leak.** 

**● Testing/Simulation Controls: Provide predefined flow scenarios that can be used to test normal usage, continuous flow, intermittent flow, sensor errors, and other leak-detection conditions.** 

- **2.2 What stretch goals could you attempt if time permits?** 

**To make this project "production-ready" or more advanced for your portfolio:** 

- **Water Bill Calculator: Estimate water costs based on recorded consumption and a user-defined tariff.** 

- **Usage Reports: Provide weekly and monthly water-consumption summaries.** 

- **Unusual Usage Detection: Identify consumption that differs significantly from the** 

**user's historical usage patterns.** 

   - **Multiple Sensor Support: Allow the application to monitor multiple compatible BLE flow sensors.** 

   - **Smart Notifications: Send mobile notifications for detected leaks or unusual water usage.** 

   - **Remote BLE Shutoff Valve: Automatically or manually send a BLE command to a compatible shutoff valve when a possible leak is detected.** 

- **2.3 Which libraries or tools will you use?** 

   - **React Native – Mobile application framework** 

   - **Expo – Development and application tooling** 

   - **JavaScript – Application programming language** 

   - **react-native-ble-plx – BLE communication** 

   - **expo-sqlite – Local SQLite database** 

   - **expo-av – Alarm/audio playback** 

   - **Charting Library – Water-usage visualization** 

   - **BLE Telemetry Simulator – Simulated sensor/BLE data source** 

## 3.System & Design Thinking 

- **3.1 Sketch or describe your app flow / pipeline:** 

**Start App → Connect to BLE Simulator → Receive & Parse Data → Validate** 

**Data → Store Data in SQLite → Calculate Water Usage → Update Dashboard** 

**& Charts → Analyze Flow Patterns → Evaluate Leak Conditions → Trigger** 

**Alarm if Required → Record Leak Event → Continue Monitoring** 

### **3.2 What data structures or algorithms are central to this project?** 

**SQLite Tables → Store flow readings, usage data, and leak events.** 

**BLE Data Parsing → Convert simulated BLE telemetry into usable flow measurements.** 

**Data Validation → Check readings for invalid, missing, or unreliable data.** 

**Water Usage Calculation → Calculate water consumption from flow rate and elapsed time.** 

**Flow Pattern Analysis → Analyze flow magnitude, duration, persistence, and interruptions.** 

**Leak Detection Algorithm → Identify possible leaks based on analyzed flow patterns and defined conditions.** 

**Time-Series Processing → Organize data for hourly, daily, and weekly usage charts.** 

- **3.3 How will you test correctness or performance?** 

   - **BLE Testing → Verify simulated data is received and parsed correctly. ● Database Testing → Verify flow readings, usage data, and leak events are stored and retrieved correctly.** 

   - **Usage Testing → Verify calculated consumption matches expected values. ● Leak Detection Testing → Test normal, continuous, intermittent, and abnormal flow scenarios.** 

   - **Alarm Testing → Verify the alarm activates only when leak conditions are satisfied.** 

   - **●Chart Testing → Compare charts with stored and calculated usage data.** 

   - **Error Testing → Test invalid/missing data and BLE disconnections.** 

   - **Edge Case Testing → Test sudden flow changes, short interruptions, prolonged flow, and sensor errors.** 

   - **Performance Testing → Evaluate database operations, data processing, and** 

### **dashboard responsiveness.** 

## <u>4.Timeline & Milestones (9 Weeks)</u> 

|**Week**|**Planned Deliverables**|**Mentor**<br>**sCheckpoint**|
|---|---|---|
|**W1**|Project scope, users, and tech stack||
|**W2**|UI design and user flow||
|**W3**|App architecture, database, and algorithms||
|**W4**|BLE simulator, parser, and SQLite setup||
|**W5**|Dashboard and usage charts||
|**W6**|Leak detection and siren||
|**W7**|Testing and bug fixing||
|**W8**|Performance, error handling, and documentation||



**W9** Final demo, documentation, and viva 

## 5.Risks & Dependencies 

- **5.1 What’s the hardest part technically for you right now?** 

- **Understanding and implementing BLE communication with the simulator.** 

- **Designing reliable telemetry parsing, validation, and storage.** 

- **Developing a robust leak-detection algorithm for different flow patterns.** 

- **Handling BLE disconnections, missing readings, and invalid sensor data.** 

- **Ensuring efficient real-time data processing and dashboard updates.** 

- **5.2 What dependencies or help do you need from mentors?** 

   - **Guidance on BLE communication and telemetry simulation.** 

   - **Review of the leak-detection algorithm and its conditions.** 

   - **Advice on SQLite database design and data handling.** 

   - **Feedback on application architecture and technical decisions.** 

   - **Support in validating the testing approach and final demonstration.** 

- 6.Evaluation Readiness 

- **6.1 How will you prove that your project “works”?** 

   - **BLE Testing → Demonstrate simulated flow data being received, parsed, and** 

### **validated correctly.** 

   - **Database Testing → Show flow readings, usage data, and leak events being stored and retrieved from SQLite.** 

   - **Usage Testing → Verify that calculated water consumption and displayed charts match the expected data.** 

   - **Leak Detection Testing → Test predefined normal, continuous, intermittent, and abnormal flow scenarios.** 

   - **Alarm Testing → Verify that the alarm triggers only when the leak-detection conditions are satisfied.** 

   - **Error Testing → Demonstrate correct handling of invalid data and BLE disconnection.** 

   - **End-to-End Demonstration → Show the complete process from simulated BLE telemetry → processing → SQLite → dashboard → leak detection → alarm.** 

- **6.2 What success metric or goal will you aim for?** 

- **100% successful processing of valid simulated BLE readings in predefined test cases.** 

- **Correct classification of predefined leak and normal-flow scenarios.** 

- **No false alarms in predefined normal-usage scenarios.** 

- **Accurate water-usage calculations against expected test values.** 

- **Accurate SQLite storage and retrieval of flow and leak data.** 

- **Responsive dashboard and charts during continuous data processing.** 

- **Successful end-to-end demonstration from simulated BLE data to leak alert.** 

## 7.Responsibilities 

### **7.1 Responsibilities** 

|**Task**|**Student 1**|**Student 2**|**Mentor Notes**|
|---|---|---|---|
|**BLE Data**|☐|☐||
|**Simulation &**||||
|**Parsing**: Generate||||



|and process<br>simulated water-flow<br>telemetry.|||
|---|---|---|
|**SQLite Data**<br>**Management**:<br>Store and retrieve<br>flow<br>readings and leak<br>events.|☐|☐|
|**App Development**:<br>Build dashboard,<br>usage charts, and<br>navigation.|☐|☐|
|**Leak Detection**<br>**& Alarm:**<br>Implement<br>leak-detection<br>logic based on<br>flow patterns,<br>persistence,<br>interruptions, and<br>defined<br>conditions, and<br>implement the<br>siren.|☐|☐|



|**Testing & Final**<br>☐<br>☐|
|---|
|**Delivery**: Test|
|features, fix bugs,|
|document the project,|
|and prepare the final<br>demo.|



### **Signatures (Students):** 



**Mentor Approval: Kshitiz Dhooria Sir Date: 27 /8/26** 

