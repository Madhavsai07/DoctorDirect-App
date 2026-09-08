## **AquaSmart** 

Bluetooth Water Flow Meter & Leak Alarm App 

Complete Project Documentation 

21 Documents Combined 

Student: Chinthaginjala Madhav Sai Kiran Roll No: 25100010700016 Year & Section: Sem 3 A 

Mentor: Kshitiz Dhooria Institution: Polaris School of Technology Project Duration: 9 Weeks 

Project Type: Application Development / Mobile IoT 

Documents are maintained in the original 1–21 sequence, with each document preserved as its own section. 

AquaSmart — Combined Project Documentation | Page 1 

#### **Combined Documentation Index** 

- 1. Project Overview 

- 2. Business Requirements Document (BRD) 

- 3. Product Requirements Document (PRD) 

- 4. UX Requirements 

- 5. Technical Requirements Document (TRD) 

- 6. High-Level Design (HLD) 

- 7. Database / Data Design 

- 8. Repository API Specification 

- 9. Low-Level Design (LLD) 

- 10. Frontend Architecture 

- 11. Security Design 

- 12. Testing Strategy 

- 13. CI/CD Pipeline 

- 14. Observability Design 

- 15. Deployment Architecture 

- 16. Cost Analysis 

- 17. Project Roadmap 

- 18. Team Responsibilities 

- 19. GitHub Repository Structure 

- 20. README 

- 21. Architecture Decision Records (ADRs) 

Document 3 uses the uploaded AquaSmart OJT PRD PDF. Its original 10-page content, including its tables and signature page, is retained in the combined PDF rather than being rewritten. 

AquaSmart — Combined Project Documentation | Page 1 

#### **Document 1: Project Overview** 

Project Overview — AquaSmart: Bluetooth Water Flow Meter & Leak Alarm App 

Project Code: OJT-AQ-01 Track: Application Development / Mobile IoT Duration: 9 Weeks Team Size: 1 Student Skill Level: Intermediate 

#### **Project Identity** 

#### **Problem Summary** 

- Water wastage — continuous or unusual water flow can consume significant amounts of water. 

- Increased water costs — undetected flow can unnecessarily increase household water consumption. 

- Property damage — prolonged leaks may damage walls, floors, furniture, and other parts of a property. 

- Lack of real-time monitoring — homeowners often do not have a simple way to observe water flow and identify suspicious usage patterns. 

The result is that a small or persistent water-flow problem may continue until the user notices it manually or significant damage has already occurred. 

#### **Proposed Solution** 

AquaSmart is a React Native mobile application that monitors water-flow telemetry received through Bluetooth Low Energy (BLE) and helps users identify possible water leaks. 

- Receive BLE flow telemetry from a BLE sensor simulator representing a water-flow sensor. 

- Parse and validate sensor data to convert BLE telemetry into usable flow measurements. 

- Store flow readings locally using SQLite for historical analysis. 

- Calculate water consumption from flow-rate readings and elapsed time. 

- Display real-time information such as current flow rate, BLE connection status, today's usage, and leak status. 

- Visualize water usage through hourly, daily, and weekly charts. 

- Analyze flow patterns to identify persistent suspicious water flow. 

- Trigger a loud alarm when the configured leak-detection conditions are satisfied. 

- Maintain leak history for previously detected possible-leak events. 

For the OJT implementation, a BLE sensor simulator is used because a physical water-flow sensor is not available. The system architecture is intended to allow a compatible real BLE flow sensor to replace the simulator in the future. 

#### **Core Capabilities** 

1. BLE Data Simulator — Generate realistic water-flow telemetry representing normal usage, continuous flow, intermittent flow, and other test scenarios. 

2. BLE Communication & Data Parsing — Receive simulated BLE telemetry, decode it, validate it, and convert it into usable flow measurements. 

3. SQLite Data Storage — Store validated flow readings, timestamps, usage information, and leak events locally. 

4. Water Usage Calculation — Estimate water consumption from flow-rate readings and elapsed time and organize the data for analysis. 

5. Real-Time Dashboard — Display current flow rate, BLE connection status, today's water usage, and current leak status/risk. 

6. Water Usage Charts — Visualize hourly, daily, and weekly water-consumption data. 

7. Leak Detection — Analyze flow magnitude, persistence, interruptions, and data quality to identify conditions that may indicate a possible leak. Persistent suspicious flow, including the defined 30-minute condition, is evaluated by the detection logic. 

AquaSmart — Combined Project Documentation | Page 1 

8. Leak Alarm — Trigger a loud siren and visual warning when the configured leak-detection conditions are satisfied. 

9. Leak History — Record and display details of detected possible-leak events. 

10. BLE & Data Error Handling — Handle BLE disconnections, missing readings, invalid telemetry, and other data-quality problems without incorrectly treating them as water flow or a leak. 

#### **Business Value** 

#### **What Makes This Different from a Basic College Project** 

- Real BLE communication architecture rather than only generating values inside the app. 

- BLE sensor simulation that represents a water-flow sensor for OJT testing. 

- Telemetry parsing and validation between raw BLE data and application-level measurements. 

- Local SQLite persistence for continuous flow readings and leak events. 

- Real-time data processing for dashboard updates and leak analysis. 

- Time-series water-usage analysis for hourly, daily, and weekly visualization. 

- Rule/state-based leak detection rather than relying only on a simple timer. 

- BLE and sensor-error handling for disconnections, missing data, and invalid telemetry. 

- Audio and visual leak alarms for possible leak conditions. 

- Future hardware extensibility, allowing the simulator to eventually be replaced by a compatible real BLE water-flow sensor. 

- Future IoT expansion through a possible BLE-controlled remote water shutoff valve. 

AquaSmart — Project Overview | Polaris School of Technology 

|Field|Value|
|---|---|
|Project Name|AquaSmart — Bluetooth Water Flow Meter & Leak Alarm<br>App|
|Project Code|OJT-AQ-01|
|Track|Application Development / Mobile IoT|
|Technology Stack|JavaScript, React Native, Expo, react-native-ble-plx,<br>expo-sqlite, expo-av, Charting Library, BLE Sensor<br>Simulator|
|Duration|9 Weeks|
|Team Size|1 Student|
|Skill Level|Intermediate|
|Institution|Polaris School of Technology|
|Mentor|Kshitiz Dhooria|



|Stakeholder|Value|
|---|---|
|Homeowners|Monitor household water flow and receive alerts about<br>possible leaks.|
|Plumbers|Use flow information and leak events as supporting<br>information when investigating water-flow problems.|
|Water-Conscious Users|Understand consumption patterns and identify unusual or<br>persistent flow.|



AquaSmart — Combined Project Documentation | Page 2 

|Stakeholder|Value|
|---|---|
|Students / Portfolio|Demonstrates React Native, BLE communication, telemetry<br>parsing, SQLite, real-time processing, data visualization,<br>and IoT-oriented application development.|



AquaSmart — Combined Project Documentation | Page 3 

#### **Document 2: Business Requirements Document (BRD)** 

AquaSmart — Bluetooth Water Flow Meter & Leak Alarm App 

#### **1. Executive Summary** 

##### **Product** 

AquaSmart is a mobile IoT application for monitoring water-flow telemetry through Bluetooth Low Energy (BLE), recording water-consumption data locally, visualizing usage, and identifying flow patterns that may indicate a possible household water leak. 

##### **Problem** 

Household water leaks can remain unnoticed for long periods, resulting in water wastage, higher water costs, and potential property damage. Users may not have a simple way to monitor water flow in real time or recognize persistent suspicious flow. 

##### **Target Users** 

The primary target users are homeowners who want to monitor household water usage and receive possible-leak alerts, and plumbers who can use flow information and recorded leak events as supporting information when investigating water-flow problems. 

##### **Proposed Solution** 

AquaSmart uses a BLE sensor simulator for the OJT implementation because a physical water-flow sensor is not available. The simulator provides BLE telemetry to the mobile application, which receives, parses, validates, stores, and analyzes the readings. 

##### **Business Value** 

- Helps homeowners become aware of persistent or suspicious water flow. 

- Supports better understanding of household water consumption through usage charts. 

- Provides a local record of flow readings and possible-leak events. 

- Demonstrates a practical mobile IoT solution using BLE, SQLite, real-time processing, and data visualization. 

#### **2. Problem Statement** 

##### **Current Problem** 

- Household water flow may continue for long periods without the user noticing. 

- Users may not have real-time visibility into current water flow and daily consumption. 

- Persistent or unusual flow patterns can be difficult to identify manually. 

- A delayed response to a leak can result in unnecessary water consumption and property damage. 

##### **Who Faces It** 

- Homeowners who want simple monitoring of household water consumption. 

- Users who may not notice continuous water flow when they are away from home or occupied. 

- Plumbers who need flow information and event history as supporting information during investigation. 

##### **Why Current Solutions Are Insufficient** 

##### **Impact of the Problem** 

- Unnecessary water consumption can continue until a problem is noticed. 

- Household water expenses may increase because of undetected flow. 

AquaSmart — Combined Project Documentation | Page 1 

• Prolonged leaks may contribute to damage to walls, floors, furniture, or other property. 

#### **3. Vision** 

“Provide a simple mobile system that makes household water flow visible, records consumption, and alerts users when persistent suspicious flow may indicate a leak.” 

AquaSmart aims to demonstrate a practical and extensible mobile IoT monitoring solution in which the BLE simulator used for the OJT can later be replaced by a compatible real BLE water-flow sensor. 

#### **4. Objectives** 

#### **5. Target Users / Personas** 

**Persona 1 — Homeowner Persona 2 — Plumber** 

#### **6. User Journey** 

##### **Homeowner Journey** 

Problem Awareness → User notices unexpectedly high water usage or wants to monitor household flow → Opens AquaSmart and connects to the BLE sensor simulator → Views current flow rate and connection status → Uses the app while simulated readings are continuously received → Views water-consumption charts to understand usage over time → Persistent suspicious flow is analyzed by the leak-detection logic → If configured leak conditions are satisfied, a visual warning and loud alarm are triggered → User reviews the possible-leak event in leak history → Successful Outcome: User is informed of possible persistent water flow and can investigate the source 

##### **Plumber Journey** 

Investigation Need → Plumber needs supporting information about household water-flow behavior → Reviews current flow and connection status → Examines recorded water-flow history and usage patterns → Reviews possible-leak event timing and duration → Uses the information as supporting evidence during investigation → Successful Outcome: Flow behavior and possible-leak events are available in an organized form 

#### **7. Business Use Cases** 

UC-001: Monitor Water Flow 

Actor: Homeowner 

Goal: View current water-flow information and BLE connection status. 

UC-002: Record Flow Telemetry Actor: AquaSmart System Goal: Receive valid BLE telemetry and store flow readings with timestamps. UC-003: View Water Usage Actor: Homeowner / Plumber 

Goal: View calculated water consumption through dashboard and charts. UC-004: Detect Possible Leak Actor: AquaSmart System 

Goal: Analyze flow patterns and identify a possible leak when configured conditions are satisfied. UC-005: Receive Leak Alert Actor: Homeowner 

AquaSmart — Combined Project Documentation | Page 2 

Goal: Receive a visual warning and loud alarm for a detected possible-leak condition. 

UC-006: Review Leak History 

Actor: Homeowner / Plumber 

Goal: View previously recorded possible-leak events and relevant timing information. 

UC-007: Handle BLE/Data Errors 

Actor: AquaSmart System 

Goal: Handle disconnections, missing readings, invalid telemetry, and other data-quality problems. 

#### **8. Functional Business Requirements** 

#### **9. Non-Functional Business Requirements** 

#### **10. Success Metrics** 

#### **11. Assumptions** 

- A physical water-flow sensor is not available for the OJT implementation. 

- A BLE sensor simulator will provide the telemetry used for development and demonstration. 

- The simulator is intended to represent the behavior of a compatible BLE water-flow sensor. 

- The exact BLE packet structure used by the simulator will be defined as part of the technical design. 

- A compatible real BLE water-flow sensor may replace the simulator in future work. 

- Water-consumption calculations are estimates derived from the received flow-rate telemetry. 

- The 30-minute condition is a controlled OJT test condition and is not a claim of universal real-world leak-detection accuracy. 

- A future remote shutoff valve requires compatible hardware and is outside the required core implementation. 

#### **12. Constraints** 

#### **13. Risks** 

#### **14. MVP Scope** 

##### **IN SCOPE** 

- BLE sensor simulator providing realistic flow telemetry. 

- BLE communication and telemetry reception. 

- BLE data parsing and validation. 

- SQLite storage of validated flow readings and leak events. 

- Water-usage calculation and time-based aggregation. 

- Real-time dashboard with flow rate, connection status, today's usage, and leak status/risk. 

- Hourly, daily, and weekly water-usage charts. 

- Leak detection using analyzed flow patterns and the defined controlled 30-minute persistent-flow condition. 

- Visual leak warning and loud alarm. 

- Leak history. 

- BLE/data error handling. 

AquaSmart — Combined Project Documentation | Page 3 

- Testing and simulation controls for predefined scenarios. 

##### **OUT OF SCOPE (MVP)** 

- Physical water-flow sensor deployment and physical sensor testing. 

- Automatic control of a real water shutoff valve. 

- Cloud backend and remote data synchronization. 

- Multi-sensor production deployment. 

- Machine-learning-based leak detection. 

- Claims of universal real-world leak-detection accuracy. 

#### **15. Future Scope** 

- Remote BLE shutoff valve control using compatible hardware. 

- Water bill calculator based on consumption and a user-defined tariff. 

- Weekly and monthly usage reports. 

- Smart notifications for possible leaks or unusual water usage. 

- Multiple compatible BLE flow sensors. 

- Advanced simulator scenarios for more realistic household usage patterns. 

- Integration with a compatible real BLE water-flow sensor. 

AquaSmart — Business Requirements Document | Polaris School of Technology 

|Document ID|BRD-OJT-AQ-01|
|---|---|
|Version|1.0|
|Status|Draft|
|Date|2026-09-07|
|Track|Application Development / Mobile IoT|



|Approach|Gap|
|---|---|
|Manual observation|Users may not continuously observe water flow and can<br>miss persistent flow.|
|Water meter checking|Periodic checking does not provide continuous in-app<br>monitoring or immediate alarm functionality.|
|Basic usage display|A usage total alone may not identify persistent suspicious<br>flow.|
|AquaSmart OJT prototype|Combines BLE telemetry, local storage, usage analysis,<br>leak detection, and an alarm in one application.|



|ID|Objective|Metric|Target|Timeline|
|---|---|---|---|---|
|OBJ-01|Reliable BLE telemetry<br>processing|Valid simulated<br>readings successfully<br>received, parsed, and<br>validated|100% of predefined<br>valid test cases|Week 4–7|
|OBJ-02|Accurate water-usage<br>calculation|Calculated<br>consumption versus<br>expected test values|Correct for predefined<br>test scenarios|Week 5–7|



AquaSmart — Combined Project Documentation | Page 4 

|ID|Objective|Metric|Target|Timeline|
|---|---|---|---|---|
|OBJ-03|Leak detection|Correct classification<br>of predefined normal<br>and suspicious-flow<br>scenarios|Correct classification<br>in controlled test cases|Week 6–7|
|OBJ-04|Alarm correctness|Alarm activates only<br>when configured leak<br>conditions are satisfied|No false alarms in<br>predefined normal<br>scenarios|Week 6–7|
|OBJ-05|Local data persistence|Flow and leak data<br>retained and<br>retrievable from<br>SQLite|100% successful<br>predefined persistence<br>tests|Week 4–7|
|OBJ-06|Real-time application<br>responsiveness|Dashboard and charts<br>remain responsive<br>during continuous<br>simulated telemetry|Responsive during<br>defined test load|Week 7–8|
|OBJ-07|End-to-end<br>demonstration|Simulator→BLE→<br>parsing→SQLite→<br>analysis→dashboard<br>→alarm|Complete successful<br>demonstration|Week 9|



|Attribute|Detail|
|---|---|
|Role|Household owner / resident|
|Goals|Monitor current water flow, understand consumption, and<br>become aware of possible leaks.|
|Pain Points|May not notice persistent flow or small leaks; wants simple<br>monitoring rather than manual meter checking.|
|Technical Proficiency|Basic to medium|
|Expectations|Clear dashboard, easy-to-understand usage charts, and a<br>noticeable leak warning.|



|Attribute|Detail|
|---|---|
|Role|Plumbing professional|
|Goals|Use flow information and recorded possible-leak events as<br>supporting information when investigating water-flow<br>problems.|
|Pain Points|Intermittent or persistent flow may be difficult to understand<br>from manual observation alone.|
|Technical Proficiency|Medium|
|Expectations|Readable flow information, event timing, duration, and<br>useful historical records.|



|ID|Requirement|Description|Priority|Business<br>Justification|Acceptance<br>Criteria|
|---|---|---|---|---|---|
|BR-001|BLE Telemetry<br>Reception|Receive simulated<br>water-flow<br>telemetry through<br>BLE.|Must Have|Represents the<br>sensor-to-application<br>communication path.|Valid predefined<br>simulator<br>readings are<br>received by<br>AquaSmart.|



AquaSmart — Combined Project Documentation | Page 5 

|ID|Requirement|Description|Priority|Business<br>Justification|Acceptance<br>Criteria|
|---|---|---|---|---|---|
|BR-002|BLE Data Parsing|Decode received<br>telemetry into<br>usable flow<br>measurements.|Must Have|Raw BLE data must<br>be converted into<br>application-level<br>values.|Known test<br>packets produce<br>the expected flow<br>values.|
|BR-003|Data Validation|Validate incoming<br>readings before<br>processing and<br>storage.|Must Have|Invalid data must not<br>be interpreted as<br>real water flow.|Invalid predefined<br>packets/readings<br>are rejected or<br>handled safely.|
|BR-004|SQLite Data<br>Storage|Store validated<br>readings,<br>timestamps, usage<br>information, and<br>leak events locally.|Must Have|Provides historical<br>data and supports<br>offline/local<br>operation.|Stored records<br>can be retrieved<br>correctly in<br>predefined tests.|
|BR-005|Water Usage<br>Calculation|Calculate<br>estimated water<br>consumption from<br>flow-rate readings<br>and elapsed time.|Must Have|Converts telemetry<br>into useful<br>consumption<br>information.|Calculated values<br>match expected<br>predefined test<br>values.|
|BR-006|Real-Time<br>Dashboard|Display current<br>flow rate,<br>connection status,<br>today's usage, and<br>leak status/risk.|Must Have|Provides immediate<br>visibility into system<br>state.|Dashboard<br>updates correctly<br>during simulated<br>telemetry.|
|BR-007|Usage Charts|Display hourly,<br>daily, and weekly<br>water-consumption<br>data.|Must Have|Helps users<br>understand water<br>usage over time.|Chart values<br>correspond to<br>stored/calculated<br>usage data.|
|BR-008|Leak Detection|Analyze flow<br>magnitude,<br>persistence,<br>interruptions, and<br>data quality to<br>identify possible<br>leaks.|Must Have|Supports early<br>awareness of<br>persistent suspicious<br>flow.|Predefined<br>normal and leak<br>scenarios are<br>classified<br>correctly.|
|BR-009|Leak Alarm|Trigger a loud<br>siren and visual<br>warning when<br>configured leak<br>conditions are<br>satisfied.|Must Have|Provides immediate<br>user notification.|Alarm triggers<br>only when the<br>required<br>conditions are<br>satisfied.|
|BR-010|Leak History|Record and<br>display detected<br>possible-leak<br>events with<br>relevant timing<br>information.|Must Have|Allows users to<br>review previous<br>events.|Detected events<br>are stored and<br>displayed<br>correctly.|
|BR-011|BLE & Data Error<br>Handling|Handle<br>disconnections,<br>missing readings,<br>invalid telemetry,<br>and other<br>data-quality<br>issues.|Must Have|Prevents<br>communication/data<br>problems from<br>becoming false<br>water-flow or leak<br>events.|Predefined error<br>scenarios are<br>handled without<br>false leak alarms.|



AquaSmart — Combined Project Documentation | Page 6 

|ID|Requirement|Description<br>Priority|Business<br>Justification|Acceptance<br>Criteria|
|---|---|---|---|---|
|BR-012|Testing/Simulation<br>Controls|Provide predefined<br>flow scenarios for<br>testing normal and<br>abnormal<br>conditions.<br>Should Have|Makes controlled<br>validation of the<br>leak-detection<br>system possible.|Predefined<br>scenarios can be<br>executed and<br>observed.|
|BR-013|Remote BLE<br>Shutoff Valve|Send a BLE<br>command to a<br>compatible remote<br>shutoff valve.<br>Future / Stretch|Could enable<br>automated response<br>to a possible leak.|Demonstrated<br>only if compatible<br>hardware or a<br>suitable<br>simulation is<br>available.|
|Category||Requirement|Target||
|Performance||Real-time data processing|Dashboard remains<br>continuous simulato|responsive during<br>r telemetry.|
|Performance||Database operations|Flow and event reco<br>stored/retrieved relia<br>defined prototype te|rds are<br>bly under the<br>st load.|
|Reliability||Data validation|Invalid/missing telem<br>create false flow or l<br>predefined tests.|etry does not<br>eak events in|
|Reliability||Leak alarm behavior|Alarm activates only<br>leak conditions are s|when configured<br>atisfied.|
|Data Integrity||SQLite persistence|Validated readings a<br>remain correctly retr<br>restart.|nd leak events<br>ievable after app|
|Compatibility||Mobile application|Target Android impl<br>OJT demonstration.|ementation for the|
|BLE||Connection handling|Application reports/h<br>connection loss and<br>appropriately.|andles BLE<br>recovery|
|Usability||Dashboard clarity|Current flow, usage,<br>leak status are unde<br>glance.|connection, and<br>rstandable at a|
|Scalability||Future sensor replacement|Application architect<br>source separate so<br>BLE sensor can repl|ure keeps the data<br>a compatible real<br>ace the simulator.|
|Metric||Target|Measurement||
|Valid BLE telemetr|y processing|100% of predefined valid test cases|Compare simulator<br>application values.|output with parsed|
|Leak scenario clas|sification|Correct classification of predefined<br>normal and leak scenarios|Controlled simulator|test cases.|
|False alarms||No false alarms in predefined<br>normal-usage scenarios|Normal-flow test suit|e.|
|Water-usage calcu|lation|Accurate against expected test values|Compare calculated<br>scenario values.|totals with known|
|SQLite persistence||Successful storage and retrieval in<br>predefined tests|Database test cases|.|



AquaSmart — Combined Project Documentation | Page 7 

|Metric|Target|Measurement|
|---|---|---|
|Dashboard responsiveness|Responsive during continuous<br>simulated data processing|Performance observation/testing.|
|End-to-end operation|Complete successful flow from<br>simulator to alarm|Final demonstration.|



|Constraint|Description|
|---|---|
|Hardware|No physical water-flow sensor is available for the OJT<br>project.|
|Simulator Dependency|BLE simulator is required to provide the sensor-like<br>telemetry used for testing.|
|Infrastructure|The core OJT prototype uses local SQLite rather than a<br>backend server.|
|Duration|Implementation and documentation are planned across 9<br>weeks.|
|Team|The project is being developed by one student.|
|BLE|Actual sensor packet formats cannot be assumed; future<br>real hardware must provide its documented BLE<br>specification.|
|Future Hardware|Remote shutoff valve control is a stretch goal and depends<br>on compatible hardware.|
|Scope|Cloud services and unrelated smart-home features are<br>outside the core project scope.|



|Risk|Probability|Impact|Mitigation|
|---|---|---|---|
|BLE simulator/peripheral<br>communication is difficult to<br>implement|Medium|High|Develop and test BLE<br>communication early and<br>isolate BLE-specific code from<br>application logic.|
|Telemetry parsing errors|Medium|High|Define a controlled simulator<br>packet format and create parser<br>test cases.|
|False leak detection|Medium|High|Use predefined normal,<br>continuous, intermittent, and<br>error scenarios and test the<br>detection logic before final<br>integration.|
|BLE disconnection or<br>missing readings|Medium|Medium|Implement explicit connection<br>and data-quality states and test<br>disconnect/reconnect<br>scenarios.|
|SQLite data errors|Low–Medium|High|Use a defined schema,<br>validation, and database tests.|
|Real-time processing<br>affects responsiveness|Medium|Medium|Use a controlled sampling<br>interval and measure<br>processing/database/dashboard<br>responsiveness.|



AquaSmart — Combined Project Documentation | Page 8 

|Risk|Probability|Impact|Mitigation|
|---|---|---|---|
|Scope creep|High|High|Prioritize core BLE, storage,<br>usage, dashboard, leak<br>detection, alarm, and testing<br>features; keep valve control and<br>other enhancements as stretch<br>goals.|
|Real-world sensor<br>compatibility|Medium|Medium|Do not claim physical sensor<br>compatibility until an actual<br>sensor specification and<br>hardware test are available.|



AquaSmart — Combined Project Documentation | Page 9 

# OJT Project 

**Student Name(s): Chinthaginjala Madhav Sai Kiran Roll No(s): 25100010700016 Year & Section: Sem 3 A Project Title (as assigned): AquaSmart - Bluetooth Water Flow Meter & Leak Alarm App Project Type: Application development** 

**Stack / Framework: React Native, Expo, JavaScript, react-native-ble-plx, expo-sqlite, expo-av, Charting Library, BLE Simulator** 

### 1. Problem Understanding 

###### **1.1 What is the problem statement in your own words?** 

**AquaSmart aims to address the problem of undetected household water leaks, which can lead to unnecessary water consumption, increased water costs, and potential property damage. Users often lack a simple way to monitor water consumption in real time and identify unusual or persistent water-flow patterns. The application receives water-flow data through Bluetooth, records the readings for analysis, and displays water-usage information through charts. AquaSmart analyzes flow patterns to identify conditions that may indicate a possible leak. When the configured leak-detection conditions are satisfied, including persistent suspicious flow for the defined duration, the application alerts the user with a loud alarm.** 

###### **1.2 Why does this problem exist or matter?** 

**The problem matters because undetected water leaks can waste significant amounts of water and increase household expenses. Small leaks may continue for hours or days without the homeowner noticing them. Continuous water flow can also cause damage to walls, floors, furniture, and other property. Most households do not have a simple system to monitor water usage and identify unusual flow patterns. Early detection can help users take action before the problem becomes more serious. AquaSmart provides an affordable and convenient way to monitor water flow and alert users about possible leaks.** 

###### **<u>1.3 Key inputs and expected outputs:</u>** 

|**Inputs**|**Process**|**Expected Outputs**|
|---|---|---|
|**BLE Flow Data:**<br>Simulated water-flow<br>telemetry received<br>from the sensor<br>simulator.|**BLE Data**<br>**Processing:**<br>Receive, decode,<br>and validate flow<br>telemetry.|**Water Usage Data:**Stored<br>and processed flow and<br>consumption data.|
|**Sensor Data:**Flow<br>rate and timestamp<br>information.<br>**User Settings:**<br>Leak-detection<br>duration and alarm<br>preferences.<br>**Usage History:**<br>Previously recorded<br>flow readings stored<br>in the local<br>database.|**Data Storage:**Store<br>validated flow<br>readings and<br>timestamps in<br>SQLite.<br>**Usage Analysis:**<br>Calculate estimated<br>water consumption<br>and organize it by<br>time periods.<br>**Flow Pattern**<br>**Analysis:**Analyze<br>flow magnitude,<br>duration,<br>persistence,<br>interruptions, and<br>data quality.|**Usage Charts:**Hourly, daily,<br>and weekly<br>water-consumption<br>visualizations.<br>**Leak Alert:**Visual warning<br>and loud alarm when a<br>possible leak is detected.<br>**Dashboard:**Current flow<br>rate, connection status,<br>current usage, and leak<br>status/risk.|
||**Leak Detection:**<br>Evaluate flow<br>patterns against the<br>defined<br>leak-detection<br>conditions.|**Leak History:**Recorded<br>details of detected<br>possible-leak events.|
||**Alert Processing:**<br>Trigger a loud alarm<br>when a possible leak<br>satisfies the required<br>alert conditions.|**Future Output:**BLE<br>command to a compatible<br>remote shutoff valve.|



### 2. Functional Scope 

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

### 3.System & Design Thinking 

- **3.1 Sketch or describe your app flow / pipeline:** 

**Start App → Connect to BLE Simulator → Receive & Parse Data → Validate** 

**Data → Store Data in SQLite → Calculate Water Usage → Update Dashboard** 

**& Charts → Analyze Flow Patterns → Evaluate Leak Conditions → Trigger** 

**Alarm if Required → Record Leak Event → Continue Monitoring** 

###### **3.2 What data structures or algorithms are central to this project?** 

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

###### **dashboard responsiveness.** 

### <u>4.Timeline & Milestones (9 Weeks)</u> 

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

### 5.Risks & Dependencies 

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

###### **validated correctly.** 

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

### 7.Responsibilities 

###### **7.1 Responsibilities** 

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



###### **Signatures (Students):** 



**Mentor Approval: Kshitiz Dhooria Sir Date: 27 /8/26** 

#### **Document 4: UX Requirements** 

AquaSmart — Bluetooth Water Flow Meter & Leak Alarm App 

#### **1. Information Architecture** 

##### **Navigation Structure** 

AquaSmart App I III Bottom Tab Navigator I III Dashboard (tab 1) I I III BLE Connection Card I I III Current Flow Rate I I III Today's Water Usage I I III Leak Status / Risk I I III Continuous Flow Duration I I I III Usage (tab 2) I I III Hourly Usage I I III Daily Usage I I III Weekly Usage I I III Time Range / View Selector I I I III Leak History (tab 3) I I III Possible-Leak Event List I I III Leak Event Detail I I I III Settings (tab 4) I III Leak Detection Settings I III Alarm Settings I III BLE / Sensor Information I III Connection Flow I III Scan for Simulator I III Available BLE Devices I III Connected Sensor Status I III Development / Testing Screen III Normal Flow III Continuous Flow III Intermittent Flow III High Flow III Sensor / BLE Error Scenarios 

#### **2. User Flows** 

##### **Flow 1: Dashboard** → **Connect to BLE Simulator** 

Dashboard → "Connect Sensor" button → BLE scanning begins → Available AquaSmart BLE simulator appears → User selects simulator → Application connects and discovers the required BLE data → Connection status changes to Connected → Current flow telemetry begins appearing on Dashboard → Continue monitoring 

##### **Flow 2: Monitor Water Usage** 

Dashboard → View current flow rate and today's usage → Tap Usage tab → Select Hourly / Daily / Weekly view → View calculated water-consumption data → Select a time period if required → Return to Dashboard 

##### **Flow 3: Possible Leak Detection and Alarm** 

Connected Dashboard → Continuous telemetry is received → Flow data is validated → Flow pattern is analyzed → Suspicious persistent flow is identified → Detection conditions continue to be evaluated → Defined 30-minute controlled condition is reached → Possible Leak status appears → Visual warning is displayed → Loud siren starts → Event is recorded in Leak History → User acknowledges/stops the alarm → Monitoring continues 

##### **Flow 4: Review Leak History** 

Leak History tab → View list of previous possible-leak events → Select an event → View start time, end time, duration, and relevant flow information → Return to Leak History 

##### **Flow 5: Handle BLE/Data Error** 

Monitoring → BLE disconnect / invalid / missing telemetry detected → Dashboard shows connection or data-quality warning → Invalid data is excluded from normal flow/leak interpretation → User can retry/reconnect → Connection restored → Monitoring resumes 

#### **3. Screen Requirements** 

##### **Screen 1: Dashboard** 

Dashboard Layout: 

AquaSmart BLE Sensor G Connected Current Flow 3.5 L/min Today's Usage 125 L Status NORMAL Continuous Flow 08:42 [ Usage ] [ Leak History ] 

###### **_Dashboard Status Design_** 

##### **Screen 2: BLE Connection Screen** 

##### **Screen 3: Usage Screen** 

AquaSmart — Combined Project Documentation | Page 1 

##### **Screen 4: Leak History** 

##### **Screen 5: Leak Event Detail** 

##### **Screen 6: Settings** 

**Screen 7: Active Leak Alarm** 

**Screen 8: Testing / Simulation Controls** 

#### **4. Accessibility** 

#### **5. UX Principles** 

#### **6. Design System Tokens** 

##### **Colors — Suggested Primary Theme** 

##### **Typography** 

- Font: Use a clean, readable system or bundled sans-serif font appropriate for React Native. 

- Headings: Bold/semibold for section and card titles. 

- Body: Regular weight for descriptions and supporting information. 

- Numerics: Strong/bold typography for current flow rate and today's usage. 

- Alarm Text: Bold, high-visibility typography for possible-leak status. 

##### **Spacing** 

- Base unit: 4dp. 

- Common spacing: 4, 8, 12, 16, 20, 24, 32dp. 

- Screen horizontal padding: 16dp. 

- Cards should have consistent internal padding and spacing between metric groups. 

##### **Border Radius** 

- Cards: 16dp. 

- Buttons: 12dp. 

- Input fields: 10dp. 

- Status chips: 16–20dp. 

#### **7. Animation Specifications** 

AquaSmart — UX Requirements | Polaris School of Technology 

|Document ID|UX-OJT-AQ-01|
|---|---|
|Version|1.0|
|Status|Draft|
|Date|2026-09-07|
|Track|Application Development / Mobile IoT|



AquaSmart — Combined Project Documentation | Page 2 

|Attribute|Detail|
|---|---|
|Purpose|Primary real-time monitoring screen for household water<br>flow.|
|Components|BLE connection card, current flow-rate card, today's usage<br>card, leak status/risk card, continuous-flow duration, recent<br>status information.|
|User Actions|Connect/reconnect sensor, open Usage, open Leak History,<br>open Settings, acknowledge/stop an active alarm.|
|Loading State|Connection/loading indicator while BLE scan or connection<br>is being established.|
|Empty State|No sensor connected: "Connect a BLE sensor to start<br>monitoring."|
|Error State|Connection lost or invalid telemetry: clear warning with<br>retry/reconnect action.|
|Leak State|Prominent possible-leak warning showing current flow,<br>continuous suspicious-flow duration, and alarm state.|



|State|User-Facing Information|
|---|---|
|Disconnected|Sensor disconnected — Connect/Reconnect|
|Connected / Normal|Sensor connected — Current flow and usage visible|
|Monitoring|Flow is being received and analyzed|
|Suspicious Flow|Possible suspicious continuous flow — monitoring condition|
|Possible Leak|Possible Leak — alarm active / user attention required|
|Data Error|Invalid or missing telemetry — data is not being interpreted<br>as normal flow|



|Attribute|Detail|
|---|---|
|Purpose|Discover and connect AquaSmart to the BLE sensor<br>simulator.|
|Components|Scan button, device list, device name, connection state,<br>retry/reconnect action.|
|User Actions|Start scan, select simulator, connect, disconnect, retry.|
|Loading State|Scanning indicator while BLE discovery is active.|
|Empty State|No compatible simulator found: "No AquaSmart sensor<br>found. Make sure the simulator is running."|
|Error State|BLE permission, connection, or discovery error with a retry<br>option.|
|Behavior|After successful connection, return to Dashboard and begin<br>telemetry monitoring.|



|Attribute|Detail|
|---|---|
|Purpose|Visualize calculated water consumption over time.|
|Components|Time-range selector, usage summary, hourly chart, daily<br>chart, weekly chart.|
|User Actions|Switch between time ranges/views, inspect chart data,<br>return to Dashboard.|



AquaSmart — Combined Project Documentation | Page 3 

|Attribute|Detail|
|---|---|
|Loading State|Skeleton chart or compact loading indicator while local data<br>is queried.|
|Empty State|No usage data: "No water-usage data available yet."|
|Error State|Unable to load usage data: retry action.|
|Behavior|Charts use processed data derived from stored flow<br>readings.|



|Attribute|Detail|
|---|---|
|Purpose|Review previously recorded possible-leak events.|
|Components|Date/time, duration, flow summary, event status, list of<br>recorded events.|
|User Actions|Tap event to open details; return to list.|
|Loading State|Skeleton event list while SQLite data is queried.|
|Empty State|No events: "No possible leaks detected."|
|Error State|Unable to load history: retry action.|
|Behavior|Events are read from the local SQLite database.|



|Attribute|Detail|
|---|---|
|Purpose|Show detailed information about one recorded possible-leak<br>event.|
|Components|Start time, end time, duration, flow information, detection<br>status.|
|User Actions|Review event and return to history.|
|Data Source|Leak event records stored in SQLite.|



|Attribute|Detail|
|---|---|
|Purpose|Configure monitoring and alarm preferences.|
|Components|Leak-detection duration/conditions, alarm enable/disable,<br>alarm volume preference where supported, BLE/sensor<br>information.|
|User Actions|Change supported settings and save/apply them.|
|Validation|Settings must remain within defined acceptable ranges.|
|Persistence|User settings are stored locally.|



|Attribute|Detail|
|---|---|
|Purpose|Immediately notify the user when a possible leak satisfies<br>the configured alarm conditions.|
|Components|Prominent warning, current flow rate, continuous-flow<br>duration, alarm indicator, stop/acknowledge control.|
|User Actions|Acknowledge/stop the alarm and inspect Leak History.|
|Visual State|High-priority warning state distinct from normal Dashboard<br>status.|
|Audio|Play loud siren using the application's audio capability.|



AquaSmart — Combined Project Documentation | Page 4 

|Attribute|Detail|
|---|---|
|Purpose|Provide controlled scenarios for development and<br>verification of AquaSmart.|
|Components|Scenario buttons for normal flow, continuous flow,<br>intermittent flow, sudden high flow, zero flow, invalid<br>telemetry, missing readings, and BLE disconnect.|
|User Actions|Start/stop a scenario and observe the resulting application<br>behavior.|
|Behavior|Scenario controls are intended for development/testing and<br>should not be confused with production sensor controls.|
|Requirement|Implementation|
|Screen Reader|All interactive controls should have meaningful accessibility<br>labels; leak warnings should clearly announce the active<br>warning state.|
|Font Scaling|Text should support system font scaling without hiding<br>essential flow, usage, or alarm information.|
|Color Independence|Connection, leak, warning, and error states should use<br>text/icons in addition to color.|
|Touch Targets|Interactive controls should use sufficiently large touch<br>targets for reliable mobile interaction.|
|Reduced Motion|Non-essential animations should be reduced or disabled<br>when the operating system requests reduced motion.|
|Audio Alert Alternative|A possible leak must also have a prominent visual warning<br>so users are not dependent only on sound.|
|Error Messages|Errors should explain what happened and provide a clear<br>recovery action where possible.|



|Principle|Application|
|---|---|
|Clarity|The Dashboard should make current flow, usage,<br>connection state, and leak status understandable at a<br>glance.|
|Safety First|Possible-leak warnings should be visually prominent and<br>require clear user attention.|
|Simple Monitoring|The user should not need to navigate through multiple<br>screens to see the current water-flow state.|
|Fast Feedback|New telemetry should update the relevant Dashboard<br>information without unnecessary interaction.|
|Error Prevention|Invalid or missing telemetry should not be interpreted as<br>genuine water flow or a leak.|
|Consistency|Flow, usage, connection, and leak states should use<br>consistent terminology throughout the application.|
|Transparency|The UI should distinguish a possible leak from a confirmed<br>physical plumbing diagnosis.|
|Testing Separation|Simulator controls should be clearly identified as<br>development/testing functionality.|
|Local Data Awareness|The application should make it clear when information is<br>stored locally on the device.|



AquaSmart — Combined Project Documentation | Page 5 

|Token|Value|Usage|
|---|---|---|
|--color-bg|#F7FAFC|Main application background|
|--color-surface|#FFFFFF|Cards, panels, and sheets|
|--color-border|#D9E2EC|Dividers and input borders|
|--color-primary|#0EA5A8|Primary actions and water-related UI|
|--color-secondary|#2563EB|Charts and secondary information|
|--color-danger|#DC2626|Possible leak, alarm, and critical errors|
|--color-warning|#D97706|Suspicious-flow and warning states|
|--color-success|#16A34A|Normal/healthy connection or<br>successful actions|
|--color-text|#102A43|Primary text|
|--color-text-muted|#627D98|Secondary labels|
|Animation|Implementation|Details|
|Telemetry value update|React Native animation where useful|Use a subtle transition when displayed<br>flow/usage values change; avoid<br>distracting movement.|
|BLE connection state|React Native animation|Compact transition between<br>connecting, connected, and<br>disconnected states.|
|Chart update|Charting library / React Native<br>animation|Animate or update chart data smoothly<br>without blocking telemetry processing.|
|Leak warning|React Native animation|Use a clear attention animation for an<br>active possible-leak state; keep it<br>accessible and non-essential motion<br>reducible.|
|Alarm activation|Audio + visual state change|Immediately switch the UI to the<br>high-priority leak state when alarm<br>conditions are satisfied.|
|Screen transitions|React Navigation / Expo navigation|Use simple, consistent transitions<br>between primary screens.|



AquaSmart — Combined Project Documentation | Page 6 

#### **Document 5: Technical Requirements Document (TRD)** 

AquaSmart — Bluetooth Water Flow Meter & Leak Alarm App 

#### **1. Technical Goals** 

#### **2. Technical Constraints** 

#### **3. Technology Selection** 

##### **3.1 Mobile Framework: React Native + Expo** 

React Native is selected for AquaSmart because the application is a mobile IoT monitoring client and requires a single JavaScript-based application codebase. Expo is used to simplify React Native project setup, development, builds, and access to supported device capabilities. 

Decision: React Native + Expo, with an Expo development build to support the required BLE native functionality. 

##### **3.2 BLE Communication: react-native-ble-plx** 

AquaSmart uses react-native-ble-plx on the mobile application side to scan for, connect to, discover, and receive data from the BLE sensor simulator. The library is used as the BLE Central/GATT Client. 

Important boundary: react-native-ble-plx is used for the AquaSmart mobile client. It is not used to make the MacBook simulator a BLE peripheral. The simulator uses the native macOS CoreBluetooth peripheral APIs. 

##### **3.3 BLE Sensor Simulator: Swift + SwiftUI + CoreBluetooth** 

The OJT sensor simulator runs as a native macOS application. Swift and SwiftUI are used for the simulator application and CoreBluetooth is used to expose the simulator as a BLE Peripheral/GATT Server. 

##### **3.4 Local Database: SQLite via expo-sqlite** 

SQLite is selected because AquaSmart stores time-series flow readings, usage summaries, leak events, and settings that benefit from structured queries and persistence. 

Decision: expo-sqlite for core application data. Simple preferences may use an appropriate local preference mechanism if needed, but operational flow/leak data remains in SQLite. 

##### **3.5 State Management** 

AquaSmart should keep application state separated from persistent data. A lightweight state-management approach may be used for current BLE connection state, live telemetry, alarm state, and UI preferences, while SQLite remains the source of truth for historical data. 

Decision: Use a lightweight React Native state-management approach such as Zustand where global client state is needed. SQLite repository functions remain responsible for persisted business data. 

##### **3.6 Audio Alarm: expo-av** 

expo-av is used for the OJT alarm capability where supported by the selected Expo environment. The alarm service must be separated from leak-detection logic so that detection decides when an alarm is required and the audio layer handles playback. 

Decision: Use expo-av for the loud leak-alarm audio requirement. 

##### **3.7 Charts** 

A React Native-compatible charting library will be used to display hourly, daily, and weekly water-usage data. The final library can be fixed during implementation based on Expo compatibility and project stability. 

Decision: Use a React Native-compatible charting library; the specific package is an implementation decision to be finalized before chart development. 

AquaSmart — Combined Project Documentation | Page 1 

#### **4. System Requirements** 

#### **5. Functional Technical Requirements** 

#### **6. Non-Functional Requirements** 

#### **7. API Requirements** 

No REST API or cloud API is required for the AquaSmart MVP. The application is designed around local BLE and SQLite operations. 

The application should use repository/service boundaries rather than allowing UI components to execute raw database queries directly. 

Example repository pattern: 

interface FlowRepository { addReading(reading): Promise<void>; getReadings(startTime, endTime): Promise<FlowReading[]>; getUsageSummary(startTime, endTime): Promise<UsageSummary>; } interface LeakRepository { createEvent(event): Promise<void>; listEvents(limit, offset): Promise<LeakEvent[]>; getEventById(id): Promise<LeakEvent | null>; } 

The exact JavaScript implementation and data types will be defined in the LLD and Repository API Specification documents. 

#### **8. Integration Requirements** 

#### **9. Security Requirements** 

#### **10. Observability Requirements** 

#### **11. Deployment Requirements** 

AquaSmart — Technical Requirements Document | Polaris School of Technology 

|Document ID|TRD-OJT-AQ-01|
|---|---|
|Version|1.0|
|Status|Draft|
|Date|2026-09-07|
|Track|Application Development / Mobile IoT|
|Goal|Description|
|BLE Sensor Simulation|Provide a realistic BLE peripheral/GATT server on the<br>MacBook that can generate controlled water-flow telemetry<br>for AquaSmart testing.|
|Reliable Telemetry Processing|Receive, decode, validate, and process BLE flow readings<br>without treating malformed data as valid measurements.|
|Local Data Durability|Persist validated flow readings, usage information, user<br>settings, and possible-leak events in SQLite.|
|Real-Time Monitoring|Update the dashboard as new valid BLE telemetry is<br>received.|
|Water-Usage Calculation|Calculate estimated water consumption from flow rate and<br>elapsed time and aggregate it for hourly, daily, and weekly<br>views.|



AquaSmart — Combined Project Documentation | Page 2 

|Goal|Description|
|---|---|
|Leak Detection|Evaluate flow magnitude, persistence, interruptions, and<br>data quality using deterministic, testable logic.|
|Alarm Reliability|Trigger a loud audio alarm and visual warning only when<br>configured possible-leak conditions are satisfied.|
|Testability|Keep BLE, parsing, calculation, storage, and leak-detection<br>logic separated so each core area can be tested<br>independently.|
|Future Hardware Compatibility|Keep the application processing pipeline independent of the<br>simulator so a compatible real BLE flow sensor can replace<br>it later.|
|Constraint|Description|
|Application Platform|React Native mobile application using JavaScript and Expo.|
|BLE Central|AquaSmart acts as the BLE Central/GATT Client and<br>receives telemetry from the simulator.|
|BLE Simulator|MacBook acts as a BLE Peripheral/GATT Server using a<br>native macOS implementation with CoreBluetooth.|
|BLE Library|react-native-ble-plx is used on the mobile application side<br>for BLE central/client communication.|
|Native BLE Requirement|Because BLE communication requires native functionality,<br>the mobile project should use an Expo development build<br>rather than relying only on Expo Go.|
|Data Store|SQLite through expo-sqlite for application data; business<br>data should not depend on a remote backend.|
|Language|JavaScript for the AquaSmart React Native application. The<br>simulator may use Swift because it is a native macOS BLE<br>component.|
|Backend|No backend server is required for the OJT MVP.|
|Hardware|No physical water-flow sensor is available for the OJT; the<br>simulator is the controlled sensor substitute.|
|Project Duration|9 weeks.|
|Team|Solo student project.|



|Criterion|React Native + Expo|Alternative Native App|
|---|---|---|
|Development|Single JavaScript application codebase|Separate platform-specific codebases<br>may be required|
|UI Development|React component model|Platform-specific UI frameworks|
|Local Storage|expo-sqlite integration|Native SQLite APIs|
|Build|Expo/EAS development and build<br>tooling|Native Android/iOS build tooling|
|Decision|Selected|Not selected for the AquaSmart mobile<br>application|
|Criterion|react-native-ble-plx|Web Bluetooth|
|Mobile BLE Central|Designed for React Native BLE<br>communication|Browser-dependent|



AquaSmart — Combined Project Documentation | Page 3 

|Criterion|react-native-ble-plx|Web Bluetooth|
|---|---|---|
|GATT Access|Service/characteristic discovery and<br>notifications|Browser API limitations vary|
|Application Type|Native mobile application|Web application|
|Decision|Selected|Not selected|
|Criterion|Native macOS Simulator|Web Simulator|
|BLE Peripheral Role|Supported through CoreBluetooth|Browser support is not suitable for the<br>required peripheral role|
|GATT Service/Characteristic Control|Direct native control|Limited/unsuitable for this architecture|
|Scenario Engine|Runs locally with controlled timing|Would add browser/runtime constraints|
|Decision|Selected|Not selected|
|Criterion|SQLite|Simple Key-Value Storage|
|Time-Series Queries|Yes|Limited|
|Filtering/Aggregation|SQL queries|Application-side processing|
|Structured Relationships|Yes|No native relational model|
|Persistence|Local durable storage|Local durable storage|
|Decision|Selected|Not selected for core business data|



|Requirement|Value|
|---|---|
|Mobile Framework|React Native + Expo|
|Application Language|JavaScript|
|BLE Mobile Client|react-native-ble-plx|
|BLE Simulator|Native macOS application using Swift/SwiftUI +<br>CoreBluetooth|
|Database|SQLite via expo-sqlite|
|Audio|expo-av|
|Mobile Target|Android phone for the primary OJT demonstration|
|Development Machine|M5 MacBook|
|BLE Roles|MacBook = BLE Peripheral/GATT Server; Android app =<br>BLE Central/GATT Client|
|Backend|None required for MVP|
|Duration|9 weeks|



|ID|Requirement|Description|Maps To|
|---|---|---|---|
|TR-001|BLE Device Scan|Scan for the AquaSmart<br>simulator and identify<br>compatible BLE devices.|BR-001|
|TR-002|BLE Connection|Connect to the selected<br>simulator and report<br>connection state.|BR-001|
|TR-003|GATT Discovery|Discover the simulator's<br>defined service and<br>flow-data characteristic.|BR-001 / BR-002|



AquaSmart — Combined Project Documentation | Page 4 

|ID|Requirement|Description|Maps To|
|---|---|---|---|
|TR-004|Telemetry Subscription|Subscribe to flow<br>notifications from the<br>simulator characteristic.|BR-001|
|TR-005|BLE Packet Parsing|Decode the simulator's<br>defined byte packet into<br>application-level flow data.|BR-002|
|TR-006|Telemetry Validation|Validate flow values, packet<br>structure, sequence<br>information, and other<br>defined fields before<br>processing.|BR-003|
|TR-007|Timestamping|Associate each accepted<br>reading with an application<br>timestamp; use sensor<br>timestamp only if the defined<br>protocol provides one.|BR-004 / BR-005|
|TR-008|Flow Storage|Insert validated flow readings<br>into SQLite.|BR-004|
|TR-009|Water-Usage Calculation|Calculate volume from flow<br>rate and elapsed time and<br>aggregate it for required<br>periods.|BR-005|
|TR-010|Dashboard Updates|Update current flow, today's<br>usage, BLE status, and leak<br>state as valid telemetry is<br>processed.|BR-006|
|TR-011|Usage Aggregation|Provide hourly, daily, and<br>weekly datasets for chart<br>rendering.|BR-007|
|TR-012|Leak Detection Engine|Analyze validated flow<br>patterns, persistence,<br>interruptions, and data<br>quality to classify predefined<br>scenarios.|BR-008|
|TR-013|Leak Alarm|Start a loud alarm and visual<br>warning when configured<br>leak conditions are satisfied.|BR-009|
|TR-014|Leak Event Persistence|Store possible-leak event<br>start/end times, duration, and<br>relevant flow information.|BR-010|
|TR-015|BLE Error Handling|Handle scan, connection,<br>discovery, subscription, and<br>disconnect errors.|BR-011|
|TR-016|Data Error Handling|Handle invalid, missing,<br>duplicate, out-of-order, or<br>impossible telemetry<br>according to the defined<br>protocol.|BR-011|



AquaSmart — Combined Project Documentation | Page 5 

|ID|Requirement|Description|Maps To|
|---|---|---|---|
|TR-017|Alarm Recovery|Stop or acknowledge the<br>alarm and move the<br>application back to a<br>monitoring/recovery state<br>according to the defined<br>logic.|BR-009|
|TR-018|Simulator Scenarios|Support controlled normal,<br>continuous, intermittent,<br>high-flow, zero-flow, and<br>error scenarios.|BR-012|
|TR-019|Simulator Ground Truth|Keep the intended scenario<br>value available to compare<br>simulator output with<br>AquaSmart's decoded value<br>during testing.|BR-012|
|TR-020|Future Shutoff Command|Keep a command boundary<br>for a future compatible BLE<br>shutoff valve without making<br>valve control part of the<br>MVP.|BR-013|
|Category|Metric|Target||
|Performance|BLE telemetry proc|essing<br>Process<br>without b|normal simulator readings<br>locking the UI.|
|Performance|Dashboard update|Current f<br>promptly<br>received|low and status update<br>after valid telemetry is<br>.|
|Performance|SQLite write|Persist n<br>causing<br>OJT sam|ormal readings without<br>visible UI lag under the defined<br>pling rate.|
|Performance|Chart rendering|Render r<br>datasets<br>OJT dat|equired hourly/daily/weekly<br>responsively for the expected<br>a volume.|
|Reliability|Valid telemetry|All prede<br>are pars|fined valid simulator packets<br>ed correctly.|
|Reliability|Invalid telemetry|Invalid p<br>or safely|redefined packets are rejected<br>handled.|
|Reliability|Alarm|No alarm<br>scenario<br>scenario|for predefined normal<br>s; alarm for predefined leak<br>s.|
|Data Integrity|Persistence|Stored fl<br>retrievab|ow and leak records remain<br>le after app restart.|
|BLE|Reconnect|Applicati<br>controlle|on can recover from a<br>d disconnect scenario.|
|Usability|Monitoring clarity|Connect<br>leak stat<br>glance.|ion, current flow, usage, and<br>us are understandable at a|
|Testability|Core logic|Parser, v<br>detection|alidation, calculation, and leak<br>can be tested independently.|



AquaSmart — Combined Project Documentation | Page 6 

|Integration|Purpose|Technology|
|---|---|---|
|BLE Sensor Simulator|Generate and expose water-flow<br>telemetry over BLE.|Swift / SwiftUI / CoreBluetooth|
|BLE Mobile Client|Scan, connect, discover GATT<br>services, and receive telemetry.|react-native-ble-plx|
|SQLite|Persist flow readings, usage data,<br>settings, and leak events.|expo-sqlite|
|Audio|Play the leak siren.|expo-av|
|Charts|Visualize hourly, daily, and weekly<br>water usage.|React Native-compatible chart library|
|Navigation|Move between Dashboard, Usage,<br>Leak History, Settings, and connection<br>screens.|React Navigation / Expo-compatible<br>navigation|



|Requirement|Implementation|
|---|---|
|Local Data|Core flow and leak data remains on the device; no backend<br>is required for the MVP.|
|BLE Validation|Only telemetry matching the application's defined simulator<br>protocol should be accepted for processing.|
|Input Validation|Reject impossible or malformed flow values and malformed<br>packets.|
|No Embedded Secrets|The MVP should not require cloud API keys or server<br>credentials.|
|Permissions|Request only the Bluetooth permissions required by the<br>target mobile platform and BLE functionality.|
|Privacy|The application should clearly communicate that the OJT<br>MVP stores operational data locally.|
|Future BLE Control|Any future shutoff-valve command must require explicit<br>device identification and protocol validation before<br>execution.|



|Signal|Tool / Method|Purpose|
|---|---|---|
|BLE Connection Logs|Development logging|Track scan, connection, discovery,<br>disconnect, and reconnect behavior.|
|Packet Parsing Logs|Parser diagnostics|Compare raw test packets with<br>decoded values during development.|
|Data Validation Logs|Validation diagnostics|Identify rejected or malformed<br>telemetry.|
|Leak Detection Logs|Development diagnostics|Record state transitions and detection<br>reasons during controlled testing.|
|SQLite Diagnostics|Repository logging|Identify failed writes, queries, and<br>unexpected database states.|
|Alarm Diagnostics|Alarm service logging|Confirm alarm start, stop, and recovery<br>behavior.|
|Simulator Logs|macOS simulator console|Track generated scenarios, sequence<br>numbers, and transmitted packets.|



AquaSmart — Combined Project Documentation | Page 7 

|Requirement|Detail|
|---|---|
|Mobile Development|Develop the React Native application on the M5 MacBook<br>and run it on the Android test device.|
|BLE Development|Run the native macOS BLE simulator on the M5 MacBook.|
|Development Build|Use an Expo development build because the application<br>requires native BLE functionality.|
|Demo Architecture|MacBook BLE Simulator→BLE→Android AquaSmart<br>App.|
|Testing|Use controlled simulator scenarios to test normal flow,<br>continuous flow, intermittent flow, high flow, zero flow, and<br>error conditions.|
|Presentation|The Android AquaSmart application can be mirrored to the<br>MacBook/projector for demonstration while the MacBook<br>simultaneously runs the BLE simulator.|
|Future Hardware|A compatible physical BLE flow sensor can replace the<br>simulator only after its actual BLE protocol is documented<br>and tested.|



AquaSmart — Combined Project Documentation | Page 8 

#### **Document 6: High-Level Design (HLD)** 

AquaSmart — Bluetooth Water Flow Meter & Leak Alarm App 

#### **1. System Architecture** 

AquaSmart is a mobile IoT monitoring system consisting of a native macOS BLE sensor simulator and a React Native mobile application. The OJT architecture does not require a backend server. The MacBook simulator acts as the BLE Peripheral/GATT Server, while the Android AquaSmart application acts as the BLE Central/GATT Client. 

[ BLE Sensor Simulator — M5 MacBook ] I I BLE / GATT notifications M [ BLE Communication Layer ] I M [ Telemetry Parser & Validation ] I IIIIIIIIIIIIIIII [ Live Monitoring State ] I I I M I [ Dashboard ] I M [ Water Usage / Leak Analysis ] I IIIIIIIIIIIIIIII [ Alarm Service ] I IIIIIIIIIIIIIIII [ Leak History ] I M [ Repository Layer ] I M [ SQLite — Local Device Storage ] 

#### **2. Architecture Diagram** 

IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII I M5 MacBook — BLE Sensor Simulator I I I I Scenario Engine → Measurement Model → Packet Encoder I I ↓ I I CoreBluetooth Peripheral / GATT Server I 

IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII I Bluetooth LE I IIIIIIIIIIIIIIIIIIIIIIIIIIIMIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII I 

Android — AquaSmart App I I I I 

IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII I I I UI Layer I I I I Dashboard | Usage | Leak History | Settings I I I 

IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII I I I I I 

IIIIIIIIIIIIIIIIIIIIIIIIIMIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII I I I Application / State Layer I I I I Live telemetry | BLE state | alarm state | UI state I I I 

IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII I I I I I IIIIIIIIIIIIIIIIIIIIIIIIIMIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII I I I BLE Service I I I I Scan → Connect → Discover → Subscribe → Receive I I I 

IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII I I I I I IIIIIIIIIIIIIIIIIIIIIIIIIMIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII I I I Telemetry Processing I I I I Parse → Validate → Timestamp → Normalize I I I IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII I I I I I I M M I I IIIIIIIIIIIIIIIIIIIIII IIIIIIIIIIIIIIIIIIIIIIIIIII I I I Usage Calculator I I Leak Detection Engine I I I IIIIIIIIIIIIIIIIIIIIII IIIIIIIIIIIIIIIIIIIIIIIIIII I I I I I I IIIIIIIIIIIIIIIIIIIIIIIIIIII I I M I I IIIIIIIIIIIIIIIIIIII I I I Repository Layer I I I IIIIIIIIIIIIIIIIIIII I I M I I IIIIIIIIIIIIIIIIIIII I I I SQLite Database I I I IIIIIIIIIIIIIIIIIIII I I I I I M I I IIIIIIIIIIIIIIIIIIII I I I Alarm / History I I I IIIIIIIIIIIIIIIIIIII I 

IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII 

#### **3. Component Responsibilities** 

##### **3.1 BLE Sensor Simulator** 

##### **3.2 Mobile UI Layer** 

##### **3.3 Application / State Layer** 

The state layer manages short-lived application state such as the current BLE connection, latest valid flow reading, live dashboard values, current leak state, and alarm state. Persistent historical data remains in SQLite and is accessed through repositories. 

##### **3.4 BLE Communication Layer** 

The BLE communication layer isolates react-native-ble-plx from the rest of the application. It is responsible for discovering the AquaSmart simulator, connecting to it, discovering the defined GATT service and characteristic, subscribing to notifications, and forwarding raw telemetry to the parser. 

AquaSmart — Combined Project Documentation | Page 1 

##### **3.5 Telemetry Processing Layer** 

##### **3.6 Analysis Layer** 

##### **3.7 Repository Layer** 

Repositories provide a controlled boundary between application logic and SQLite. UI components and analysis services should not contain scattered raw SQL statements. 

##### **3.8 Persistence Layer — SQLite** 

- A local SQLite database stores validated flow readings, usage-related data, possible-leak events, and supported settings. 

- Database initialization and schema migrations are isolated from application screens. 

- Indexes should be created for frequently queried timestamps and event fields. 

- Multi-step writes should use transactions where atomicity is required. 

- Historical data remains available after application restart. 

#### **4. Data Flow** 

##### **BLE Telemetry Flow** 

Simulator generates scenario → Measurement model produces intended flow value → Packet encoder creates BLE payload → CoreBluetooth sends notification → AquaSmart BLE layer receives raw bytes → Packet parser decodes fields → Validator checks packet/data → Valid reading is normalized and timestamped → Reading is stored in SQLite → Live dashboard state is updated → Usage calculator updates consumption → Leak detection engine evaluates flow pattern → If alarm conditions are satisfied, Alarm Service activates → Possible-leak event is stored in Leak History 

##### **Water Usage Calculation Flow** 

Validated reading N received → Compare timestamp with previous valid reading → Determine elapsed time → Use flow rate × elapsed time to estimate volume → Add interval volume to the relevant aggregation period → Persist/query aggregated data as required → Update Dashboard and Usage charts 

##### **Leak Detection Flow** 

Validated flow readings → Check data quality → Evaluate flow magnitude → Evaluate persistence and continuity → Consider interruptions / recovery → Determine current flow state → Maintain suspicious-flow duration/state → Apply configured detection conditions → If conditions are satisfied: → Create possible-leak event → Update Dashboard leak state → Activate alarm → Continue monitoring for recovery → Close/resolve event when recovery conditions are satisfied 

#### **5. Navigation Architecture** 

IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII I Bottom Tab 

Navigator I IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII I Dashboard I Usage I Leak History I Settings I 

IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII I I M M BLE 

Connection Leak Detail I M Scan / Connect I M Monitoring I IIIIIIIIIIIIIIII Active Alarm I M Usage / History 

#### **6. Scalability** 

#### **7. Reliability** 

#### **8. Security Architecture** 

#### **9. Observability** 

AquaSmart — Combined Project Documentation | Page 2 

AquaSmart — High-Level Design | Polaris School of Technology 

|Document ID|HLD-OJT-AQ-01|
|---|---|
|Status|Draft|
|Date|2026-09-07|
|Track|Application Development / Mobile IoT|



|Component|Purpose|Key Responsibilities|
|---|---|---|
|Scenario Engine|Select and execute controlled flow<br>scenarios.|Normal flow, continuous flow,<br>intermittent flow, high flow, zero flow,<br>and error scenarios.|
|Measurement Model|Generate intended sensor<br>measurements.|Produce flow values and maintain<br>simulator ground truth.|
|Packet Encoder|Convert measurements into the defined<br>BLE packet format.|Apply field encoding, scaling, byte<br>order, status, and sequence<br>information defined by the simulator<br>specification.|
|CoreBluetooth Peripheral|Expose the simulated sensor over BLE.|Advertise device, expose GATT<br>service/characteristic, and send<br>telemetry notifications.|
|Simulator UI|Control scenarios during<br>development/testing.|Start/stop scenarios, inspect current<br>simulated values, and trigger error<br>conditions.|



|Component|Purpose|Key Interactions|
|---|---|---|
|Dashboard|Real-time monitoring.|Reads current flow, today's usage, BLE<br>status, leak status, and continuous-flow<br>duration.|
|Usage Screen|Water-consumption visualization.|Reads aggregated usage data and<br>displays hourly, daily, and weekly<br>charts.|
|Leak History|Review previous possible-leak events.|Reads stored leak events and opens<br>event details.|
|Settings|Monitoring preferences.|Reads and updates supported<br>leak/alarm settings.|
|BLE Connection Screen|Sensor connection management.|Scans, connects, disconnects, and<br>reports BLE state.|
|Alarm UI|High-priority user notification.|Shows possible-leak warning and<br>provides acknowledgement/stop<br>interaction.|
|Testing Screen|Controlled application testing.|Displays or controls supported<br>simulator scenarios where included in<br>the development build.|
|State|Purpose||
|BLE Connection State|Disconnected, sca<br>discovering, subscr|nning, connecting, connected,<br>ibed, or error.|
|Live Telemetry State|Latest validated flo<br>and data quality sta|w rate, timestamp, sequence information,<br>te.|



AquaSmart — Combined Project Documentation | Page 3 

|State|Purpose|
|---|---|
|Usage State|Today's calculated usage and current aggregation values<br>needed by the UI.|
|Leak State|Normal, suspicious/monitoring, possible leak, alarm active,<br>and recovery/resolved state as defined by the leak engine.|
|Alarm State|Whether the alarm is active, acknowledged, or stopped.|
|UI State|Navigation, loading, error, and display preferences.|
|Responsibility|Description|
|Scan|Search for compatible AquaSmart BLE devices.|
|Connect|Establish a BLE connection with the selected simulator.|
|Discover|Discover the required service and flow-data characteristic.|
|Subscribe|Subscribe to characteristic notifications.|
|Receive|Receive raw encoded telemetry packets.|
|Disconnect|Report and handle BLE disconnection.|
|Reconnect|Allow the application to recover from a controlled<br>disconnect.|



|Component|Purpose|
|---|---|
|Packet Parser|Convert raw BLE bytes into structured telemetry fields.|
|Validator|Reject malformed, impossible, duplicate, or otherwise<br>invalid readings according to the protocol.|
|Normalizer|Convert valid telemetry into the application's standard<br>flow-rate representation.|
|Timestamp Handler|Associate readings with application receipt time, or a<br>protocol-provided timestamp when available.|
|Data Quality Handler|Track missing, delayed, duplicate, or out-of-order data<br>conditions.|



|Component|Purpose|Output|
|---|---|---|
|Water Usage Calculator|Convert flow rate and elapsed time into<br>estimated volume.|Instant/interval volume and aggregated<br>usage.|
|Usage Aggregator|Group stored usage into required time<br>periods.|Hourly, daily, and weekly usage<br>datasets.|
|Leak Detection Engine|Analyze flow magnitude, persistence,<br>interruptions, and data quality.|Leak status/risk and detection event.|
|Alarm Service|Respond to a leak event.|Loud siren and visual alarm state.|
|Repository|Entities Managed|Key Operations|
|FlowRepository|Flow readings|Insert validated readings, query<br>readings by time range, retrieve latest<br>readings.|
|UsageRepository|Usage summaries|Calculate/query hourly, daily, and<br>weekly usage datasets.|
|LeakRepository|Possible-leak events|Create event, update event, list events,<br>get event details.|



AquaSmart — Combined Project Documentation | Page 4 

|Repository|Entities Managed|Key Operations|
|---|---|---|
|SettingsRepository|Application settings|Read/write supported leak and alarm<br>preferences.|



|Concern|Strategy|
|---|---|
|Large Flow History|Use SQLite indexes and time-range queries; avoid loading<br>the entire history into memory.|
|High Telemetry Rate|Process readings through a dedicated telemetry pipeline<br>and batch non-critical persistence where appropriate.|
|Long-Term History|Aggregate usage by hour/day/week for chart views instead<br>of rendering raw readings directly.|
|Many Leak Events|Paginate Leak History and query by indexed timestamps.|
|Multiple Sensors — Future|Keep the sensor identity and BLE communication boundary<br>separate so additional compatible sensors can be supported<br>later.|
|Future Shutoff Valve|Keep outbound BLE command handling separate from<br>inbound telemetry processing.|



|Mechanism|Implementation|
|---|---|
|Telemetry Validation|Malformed or impossible readings are rejected before<br>usage/leak analysis.|
|BLE Recovery|Connection state is explicitly tracked and reconnect can be<br>attempted after controlled disconnects.|
|Database Transactions|Use transactions for operations that must be atomic, such<br>as creating a leak event and related records.|
|Duplicate Protection|Use sequence information and/or timestamps from the<br>defined protocol to identify duplicate readings.|
|Out-of-Order Handling|Detect readings that arrive out of order and prevent them<br>from corrupting interval calculations.|
|Missing Data Handling|Missing telemetry is treated as a data-quality condition<br>rather than automatically as zero flow.|
|Alarm Recovery|Alarm activation and stop/acknowledgement are managed<br>separately from leak classification.|
|Simulator Ground Truth|Expected simulator values provide a reference for parser<br>and end-to-end verification.|



|Concern|Implementation|
|---|---|
|Local Data Privacy|Core operational data is stored locally in the application's<br>private storage.|
|BLE Data Validation|Only packets matching the defined application protocol are<br>processed.|
|Input Validation|Flow and protocol fields are validated before database<br>insertion or analysis.|
|No Backend Credentials|MVP does not require cloud API keys, user passwords, or<br>server credentials.|
|Permissions|Request only the Bluetooth/device permissions necessary<br>for the mobile BLE workflow.|



AquaSmart — Combined Project Documentation | Page 5 

|Concern|Implementation|
|---|---|
|Future Valve Commands|Any future shutoff command must identify the intended<br>compatible device and validate command state before<br>transmission.|



|Signal|Tool / Method|When Used|
|---|---|---|
|BLE Connection State|Development logging|During scan, connect, discovery,<br>subscription, disconnect, and<br>reconnect testing.|
|Raw Packet Diagnostics|Parser debug logs|During simulator and parser<br>development.|
|Validation Failures|Validation logs|When malformed, duplicate,<br>out-of-order, or impossible data is<br>encountered.|
|Leak Detection State|Detection diagnostics|During controlled normal/leak/error<br>scenario testing.|
|SQLite Operations|Repository timing/error logs|When diagnosing failed or slow<br>database operations.|
|Alarm Events|Alarm service logs|When alarm starts, stops, or recovers.|
|Simulator Scenario|Simulator console/logging|To confirm the intended scenario and<br>ground-truth readings.|



AquaSmart — Combined Project Documentation | Page 6 

#### **Document 7: Database / Data Design** 

AquaSmart — Bluetooth Water Flow Meter & Leak Alarm App 

#### **1. Data Requirements** 

AquaSmart stores operational data locally in a SQLite database on the Android device. The database is designed to support BLE telemetry processing, water-usage calculation, leak detection, leak history, and application settings. 

#### **2. Entities** 

- Sensor — identifies the BLE flow sensor/simulator used as the telemetry source. 

- FlowReading — one validated flow measurement received through BLE, with timestamp and protocol information. 

- UsageRecord — estimated water volume derived from flow rate and elapsed time. 

- LeakEvent — a recorded possible-leak condition with start/end time, duration, and supporting flow information. 

- Setting — key-value application preference stored locally. 

#### **3. Entity Relationships** 

Sensor II(1:many)II> FlowReading II(1:many/time-derived)II> UsageRecord FlowReading II(many:0..1)II> LeakEvent (readings may contribute evidence to a detected event) Settings II (key-value, no FK) 

#### **4. ER Diagram** 

IIIIIIIIIIIIIIIIIIIIII I SENSOR I IIIIIIIIIIIIIIIIIIIIII I id PK I I device_name I I device_identifier I I created_at I I last_seen_at I IIIIIIIIIIIIIIIIIIIIII I 1 I I many IIIIIIIIIIMIIIIIIIIIII I FLOW_READINGS I IIIIIIIIIIIIIIIIIIIIII I id PK I I sensor_id FK I I flow_rate_lpm I I recorded_at I I sequence_number I I status I I data_quality I IIIIIIIIIIIIIIIIIIIIII I IIIIIIIIIIIIIIIII I I M M IIIIIIIIIIIIIIIIIII IIIIIIIIIIIIIIIIIIIIII I USAGE_RECORDS I I LEAK_EVENTS I IIIIIIIIIIIIIIIIIII IIIIIIIIIIIIIIIIIIIIII I id PK I I id PK I I sensor_id FK I I sensor_id FK I I start_at I I start_at I I end_at I I end_at I I elapsed_seconds I I duration_seconds I I volume_liters I I peak_flow_lpm I IIIIIIIIIIIIIIIIIII I avg_flow_lpm I I status I IIIIIIIIIIIIIIIIIIIIII IIIIIIIIIIIIIIIIIIIIII I SETTINGS I IIIIIIIIIIIIIIIIIIIIII I key PK I I value I I updated_at I IIIIIIIIIIIIIIIIIIIIII 

#### **5. Schema** 

**Table: `sensors`** 

**Table: `flow_readings`** 

**Table: `usage_records`** 

**Table: `leak_events`** 

##### **Table: `settings`** 

Example settings keys: 

- leak_duration_seconds 

- alarm_enabled 

- alarm_volume 

- flow_threshold_lpm 

- theme 

AquaSmart — Combined Project Documentation | Page 1 

#### **6. Relationships** 

#### **7. Indexing Strategy** 

#### **8. Query Patterns** 

#### **9. Data Integrity** 

#### **10. Data Lifecycle** 

##### **Sensor** 

BLE simulator/sensor discovered → identified → connected → telemetry received → last_seen_at updated → remains available as a source record for historical readings. 

##### **Flow Reading** 

BLE packet received → parsed → validated → timestamped → stored → used by live dashboard / usage / leak analysis → retained as historical telemetry. 

##### **Usage Record** 

Two valid readings define an interval → elapsed time calculated → volume estimated from flow rate × elapsed time → usage record stored → included in hourly/daily/weekly aggregation. 

##### **Leak Event** 

Suspicious persistent flow begins → detection state maintained → configured conditions satisfied → event created/activated → alarm triggered → event continues until recovery → event closed/resolved → appears in Leak History. 

##### **Settings** 

Default setting created → user changes supported preference → setting updated locally → application reads current value when required. 

#### **11. Migration System** 

The database uses a version-based migration approach. Each schema change is represented by a numbered migration. " "Existing user data should be preserved whenever possible, and migrations should be executed atomically. 

Example structure: MIGRATIONS = [ version 1 → create sensors, flow_readings, usage_records, leak_events, settings version 2 → future additive schema change ] Migration runner: 1. Read current database schema version. 2. Find migrations with a higher version. 3. Execute each migration in order. 4. Commit the migration atomically. 5. Update the stored schema version. 

- Migrations should be additive where practical. 

- Destructive schema changes require an explicit migration and data-preservation strategy. 

- Each migration should be tested before being included in a release. 

- Migration failure must not leave the database in a partially applied state. 

#### **12. Backup and Recovery** 

AquaSmart — Database / Data Design | Polaris School of Technology 

|Document ID|DB-OJT-AQ-01|
|---|---|
|Status|Draft|
|Date|2026-09-07|



AquaSmart — Combined Project Documentation | Page 2 

|Document ID|||DB-OJT-AQ-01|||
|---|---|---|---|---|---|
|Track|||Application Deve|lopment / Mobile IoT||
|Entity|||What It Stores|||
|sensors|||Registered/conn<br>information used|ected sensor identity an<br>by the application.|d basic BLE device|
|flow_readings|||Validated water-f<br>simulator or a fut|low telemetry received f<br>ure compatible sensor.|rom the BLE|
|usage_records|||Calculated water<br>usage values.|-consumption intervals|and/or aggregated|
|leak_events|||Possible-leak ev|ents detected by the lea|k-detection engine.|
|settings|||Application prefe<br>and alarm settin|rences such as leak-det<br>gs.|ection configuration|
|Field|Type|PK|Nullable|Default|Description|
|id|INTEGER||No|AUTOINCREMENT|Primary key.|
|device_name|TEXT|—|No|—|BLE<br>advertised/display<br>name.|
|device_identifier|TEXT|—|No|—|Application-level<br>identifier for the<br>simulator/sensor;<br>unique where<br>applicable.|
|created_at|INTEGER|—|No|Current timestamp|Unix timestamp<br>when the sensor<br>record is created.|
|last_seen_at|INTEGER|—|Yes|NULL|Timestamp of the<br>most recent valid<br>telemetry<br>received.|
|Field|Type|PK|Nullable|Default|Description|
|id|INTEGER||No|AUTOINCREMENT|Primary key.|
|sensor_id|INTEGER|—|No|—|FK→sensors.id.|
|flow_rate_lpm|REAL|—|No|—|Validated flow rate<br>in litres per<br>minute.|
|recorded_at|INTEGER|—|No|—|Application receipt<br>timestamp, or<br>protocol<br>timestamp if<br>defined.|
|sequence_number|INTEGER|—|Yes|NULL|Simulator/protocol<br>sequence number<br>when provided.|
|status|TEXT|—|No|'valid'|Telemetry status<br>according to the<br>defined simulator<br>protocol.|



AquaSmart — Combined Project Documentation | Page 3 

|Field|Type|PK|Nullable|Default|Description|
|---|---|---|---|---|---|
|data_quality|TEXT|—|No|'good'|Quality state such<br>as good,<br>duplicate,<br>out_of_order,<br>invalid, or missing.|
|Field|Type|PK|Nullable|Default|Description|
|id|INTEGER||No|AUTOINCREMENT|Primary key.|
|sensor_id|INTEGER|—|No|—|FK→sensors.id.|
|start_at|INTEGER|—|No|—|Beginning of the<br>flow interval.|
|end_at|INTEGER|—|No|—|End of the flow<br>interval.|
|elapsed_seconds|REAL|—|No|—|Elapsed time used<br>for the volume<br>calculation.|
|flow_rate_lpm|REAL|—|No|—|Flow rate used for<br>the interval<br>calculation.|
|volume_liters|REAL|—|No|0.0|Estimated volume<br>for the interval.|
|Field|Type|PK|Nullable|Default|Description|
|id|INTEGER||No|AUTOINCREMENT|Primary key.|
|sensor_id|INTEGER|—|No|—|FK→sensors.id.|
|start_at|INTEGER|—|No|—|Time suspicious<br>persistent flow<br>began for the<br>event.|
|end_at|INTEGER|—|Yes|NULL|Time the event<br>ended/resolved;<br>NULL while<br>active.|
|duration_seconds|REAL|—|Yes|NULL|Computed event<br>duration.|
|peak_flow_lpm|REAL|—|Yes|NULL|Highest valid flow<br>observed during<br>the event.|
|avg_flow_lpm|REAL|—|Yes|NULL|Average flow<br>observed during<br>the event.|
|status|TEXT|—|No|'active'|Event state such<br>as active,<br>acknowledged, or<br>resolved.|
|reason|TEXT|—|Yes|NULL|Detection reason<br>or classification<br>summary.|



AquaSmart — Combined Project Documentation | Page 4 

|Field|Type|PK|Nullable|Default|Description|
|---|---|---|---|---|---|
|key|TEXT||No|—|Setting key.|
|value|TEXT|—|No|—|Stored setting<br>value; JSON/text<br>representation<br>may be used.|
|updated_at|INTEGER|—|No|Current timestamp|Last update<br>timestamp.|



|Relationship|Type|Description|
|---|---|---|
|Sensor→FlowReading|One-to-many|A sensor/simulator can provide many<br>validated flow readings.|
|Sensor→UsageRecord|One-to-many|A sensor can produce many calculated<br>consumption intervals.|
|Sensor→LeakEvent|One-to-many|A sensor can produce multiple<br>possible-leak events over time.|
|FlowReading→UsageRecord|Many-to-zero/one|A validated reading can contribute to<br>an interval calculation; exact linkage is<br>implementation-dependent.|
|Settings→Application|Key-value|Settings are application preferences<br>and do not require foreign keys.|



|Table|Index|Type|Reason|
|---|---|---|---|
|sensors|device_identifier|UNIQUE B-tree|Identify a simulator/sensor<br>efficiently and avoid<br>duplicate registered<br>identities.|
|flow_readings|sensor_id, recorded_at|B-tree|Efficient time-range queries<br>for telemetry and usage<br>analysis.|
|flow_readings|recorded_at|B-tree|Retrieve recent readings and<br>process time-ordered data.|
|flow_readings|sequence_number|B-tree|Assist duplicate/out-of-order<br>detection when sequence<br>numbers are present.|
|usage_records|sensor_id, start_at|B-tree|Efficient usage history and<br>time-range aggregation.|
|leak_events|sensor_id, start_at|B-tree|Display leak history in<br>chronological order.|
|leak_events|status|B-tree|Find active/unresolved<br>events quickly.|
|settings|key|PRIMARY KEY|Fast lookup of application<br>preferences.|



|Query|SQL Pattern|Used By|
|---|---|---|
|Latest flow|SELECT * FROM flow_readings|Dashboard|
||WHERE sensor_id = ? ORDER BY<br>recorded_at DESC LIMIT 1||



AquaSmart — Combined Project Documentation | Page 5 

|Query|SQL Pattern|Used By|
|---|---|---|
|Flow history|SELECT * FROM flow_readings<br>WHERE sensor_id = ? AND<br>recorded_at BETWEEN ? AND ?<br>ORDER BY recorded_at ASC|Usage / analysis|
|Daily usage|SELECT<br>date(datetime(start_at,'unixepoch')),<br>SUM(volume_liters) FROM<br>usage_records WHERE start_at<br>BETWEEN ? AND ? GROUP BY<br>date(datetime(start_at,'unixepoch'))|Usage charts|
|Weekly usage|SELECT strftime('%Y-%W',<br>datetime(start_at,'unixepoch')),<br>SUM(volume_liters) FROM<br>usage_records WHERE start_at<br>BETWEEN ? AND ? GROUP BY<br>strftime('%Y-%W',<br>datetime(start_at,'unixepoch'))|Weekly chart|
|Leak history|SELECT * FROM leak_events WHERE<br>sensor_id = ? ORDER BY start_at<br>DESC LIMIT ? OFFSET ?|Leak History|
|Active leak|SELECT * FROM leak_events WHERE<br>sensor_id = ? AND status = 'active'<br>ORDER BY start_at DESC LIMIT 1|Dashboard / Alarm|
|Sensor lookup|SELECT * FROM sensors WHERE<br>device_identifier = ?|BLE service|
|Setting lookup|SELECT value FROM settings WHERE<br>key = ?|Settings service|



|Rule|Implementation|
|---|---|
|Valid flow rate|Application/protocol validation must reject malformed or<br>impossible flow values before insertion.|
|Sensor reference|FOREIGN KEY on flow_readings.sensor_id,<br>usage_records.sensor_id, and leak_events.sensor_id.|
|Non-negative volume|CHECK (volume_liters >= 0).|
|Non-negative duration|CHECK (elapsed_seconds >= 0) and CHECK<br>(duration_seconds >= 0).|
|Valid event status|CHECK status is one of the defined application states.|
|Timestamp ordering|Application logic ensures end_at is not earlier than start_at.|
|Sequence handling|Duplicate or out-of-order telemetry is identified before it can<br>corrupt usage calculations.|
|Settings uniqueness|PRIMARY KEY on settings.key ensures one current value<br>per setting.|



|Scenario|Behavior|
|---|---|
|App crash during telemetry processing|Previously committed SQLite records remain available; the<br>next valid reading can resume normal processing.|
|App crash during leak event|An active event can be identified from its stored status and<br>recovered/reconciled on next launch.|



AquaSmart — Combined Project Documentation | Page 6 

|Scenario|Behavior|
|---|---|
|SQLite write failure|Repository layer catches the error, logs diagnostics, and<br>reports the failure to the application layer.|
|BLE disconnect|No fabricated zero-flow reading is inserted;<br>connection/data-quality state is updated and reconnection<br>can be attempted.|
|Invalid packet|Packet is rejected or recorded diagnostically according to<br>the defined protocol; it is not used as valid flow.|
|Accidental event deletion|If deletion is supported, it is treated as a permanent local<br>operation unless a future backup/export feature is<br>implemented.|
|App uninstall|Local SQLite data is removed by the platform; future<br>export/backup can be considered as an enhancement.|



AquaSmart — Combined Project Documentation | Page 7 

#### **Document 8: Repository API Specification** 

API Specification (Local Data API) 

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App 

AquaSmart has no dependency on a cloud REST API for its core OJT workflow. This document specifies the internal local data API: JavaScript repository/service interfaces that form the contract between the React Native UI, BLE telemetry processing, SQLite persistence, and analysis services. Screens should consume application data through these interfaces rather than directly querying SQLite tables. 

#### **1. Sensor Repository API** 

SensorRepository { listSensors(filter?: { status?: SensorStatus; nameQuery?: string; }): Promise<Sensor[]>; getSensorById(id: number): Promise<Sensor | null>; registerSensor(input: RegisterSensorInput): Promise<Sensor>; updateSensor(id: number, input: UpdateSensorInput): Promise<Sensor>; removeSensor(id: number): Promise<void>; } 

##### **Types** 

Sensor { id: number; name: string; deviceIdentifier: string | null; connectionType: 'BLE'; status: 'simulated' | 'connected' | 'disconnected' | 'error'; lastSeenAt: number | null; createdAt: number; } RegisterSensorInput { name: string; deviceIdentifier?: string; } UpdateSensorInput { name?: string; status?: Sensor['status']; } SensorStatus = 'simulated' | 'connected' | 'disconnected' | 'error'; 

##### **Error Codes** 

#### **2. Flow Reading Repository API** 

FlowReadingRepository { addReading(input: CreateFlowReadingInput): Promise<FlowReading>; addReadingsBatch(inputs: CreateFlowReadingInput[]): Promise<number>; getLatestReading(sensorId: number): Promise<FlowReading | null>; getReadings( sensorId: number, from: number, to: number, limit?: number ): Promise<FlowReading[]>; getLatestReadings(sensorId: number, limit: number): Promise<FlowReading[]>; deleteReadingsBefore(timestamp: number): Promise<number>; } 

##### **Types** 

FlowReading { id: number; sensorId: number; timestamp: number; // Unix timestamp, milliseconds flowRateLpm: number; // Litres per minute sequenceNumber: number | null; dataQuality: 'valid' | 'invalid' | 'duplicate' | 'out_of_order'; status: 'ok' | 'sensor_error' | 'invalid_packet'; receivedAt: number; } CreateFlowReadingInput { sensorId: number; timestamp: number; flowRateLpm: number; sequenceNumber?: number; dataQuality?: FlowReading['dataQuality']; status?: FlowReading['status']; } 

##### **Validation Rules** 

- Flow rate must not be negative. 

- Impossible or deliberately malformed values must be rejected or stored only when explicitly marked as invalid test data. 

- Duplicate packets should be identified using available sequence/timestamp information. 

- Out-of-order packets must not silently overwrite newer readings. 

- Missing packets are represented by gaps in telemetry rather than fabricated readings. 

- The exact BLE packet format, byte order, scaling, and sequence semantics remain a design/TBD item until the simulator protocol is finalized. 

#### **3. Usage Repository API** 

UsageRepository { calculateUsage(from: number, to: number, sensorId?: number): Promise<UsageSummary>; getUsageHistory( granularity: 'hour' | 'day' | 'week', from: number, to: number, sensorId?: number ): Promise<UsageRecord[]>; getUsageForDate( date: string, sensorId?: number ): Promise<UsageRecord | null>; saveUsageRecord(input: SaveUsageRecordInput): Promise<UsageRecord>; deleteUsageBefore(timestamp: number): Promise<number>; } 

AquaSmart — Combined Project Documentation | Page 1 

##### **Types** 

UsageRecord { id: number; sensorId: number | null; periodStart: number; periodEnd: number; granularity: 'hour' | 'day' | 'week'; volumeLitres: number; calculatedAt: number; } UsageSummary { from: number; to: number; volumeLitres: number; averageFlowRateLpm: number; peakFlowRateLpm: number; readingCount: number; } SaveUsageRecordInput { sensorId?: number; periodStart: number; periodEnd: number; granularity: UsageRecord['granularity']; volumeLitres: number; } 

##### **Usage Calculation Contract** 

- Water volume is derived from flow rate and elapsed time; for a sampled reading, the implementation integrates flow over the relevant interval rather than treating a single flow-rate value as a volume. 

- Flow rate is stored in litres per minute, while elapsed time is converted to minutes before volume is accumulated. 

- Usage history supports hourly, daily, and weekly chart rendering. 

- The implementation should document how gaps in telemetry are handled so missing data is not incorrectly counted as zero usage. 

#### **4. Leak Event Repository API** 

LeakEventRepository { createEvent(input: CreateLeakEventInput): Promise<LeakEvent>; updateEvent(id: number, input: UpdateLeakEventInput): Promise<LeakEvent>; getActiveEvent(sensorId?: number): Promise<LeakEvent | null>; getEventById(id: number): Promise<LeakEvent | null>; listEvents( from?: number, to?: number, limit?: number, offset?: number ): Promise<LeakEvent[]>; resolveEvent(id: number, resolvedAt?: number): Promise<LeakEvent>; } 

##### **Types** 

LeakEvent { id: number; sensorId: number; startedAt: number; suspectedAt: number | null; alarmedAt: number | null; resolvedAt: number | null; durationSeconds: number | null; peakFlowRateLpm: number; status: 'suspected' | 'alarmed' | 'resolved' | 'dismissed'; reasonCode: string; notes: string | null; } CreateLeakEventInput { sensorId: number; startedAt: number; suspectedAt?: number; peakFlowRateLpm: number; status: LeakEvent['status']; reasonCode: string; notes?: string; } UpdateLeakEventInput { suspectedAt?: number; alarmedAt?: number; resolvedAt?: number; durationSeconds?: number; peakFlowRateLpm?: number; status?: LeakEvent['status']; notes?: string; } 

##### **Leak Detection Contract** 

- The repository stores the result of leak analysis; it does not itself decide whether a leak exists. 

- Leak analysis is pattern/state-based and can consider continuous flow, duration, sudden changes, intermittent behaviour, and sensor/data quality. 

- A controlled OJT test scenario may use 30 minutes of continuous suspicious flow to demonstrate an alarm condition, but this is not treated as a universal real-world definition of a leak. 

- A leak event should preserve enough timing information to support alarm history and later review. 

#### **5. Settings Repository API** 

SettingsRepository { get<T>(key: SettingsKey): Promise<T | null>; set<T>(key: SettingsKey, value: T): Promise<void>; getAll(): Promise<AppSettings>; } 

##### **Types** 

SettingsKey = 'theme' | 'flow_unit' | 'volume_unit' | 'leak_alert_enabled' | 'alarm_sound_enabled' | 'default_sensor_id'; AppSettings { theme: 'dark' | 'light' | 'system'; flowUnit: 'L/min'; volumeUnit: 'L' | 'm³'; leakAlertEnabled: boolean; alarmSoundEnabled: boolean; defaultSensorId: number | null; } 

#### **6. BLE Service API** 

BleService { startScan(): Promise<void>; stopScan(): Promise<void>; connect(deviceId: string): Promise<BleConnection>; disconnect(deviceId: string): Promise<void>; subscribeToFlowData( deviceId: string, callback: (packet: BlePacket) => void ): Promise<Subscription>; readDeviceInfo(deviceId: string): Promise<DeviceInfo | null>; getConnectionState(deviceId: string): Promise<BleConnectionState>; } 

AquaSmart — Combined Project Documentation | Page 2 

##### **Types** 

BleConnection { deviceId: string; connectedAt: number; state: 'connected' | 'disconnected'; } BlePacket { deviceId: string; receivedAt: number; payload: Uint8Array; } DeviceInfo { deviceId: string; name: string; firmwareVersion: string | null; } BleConnectionState = 'scanning' | 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'error'; 

##### **BLE Responsibility Boundary** 

- The Android application acts as the BLE Central / GATT Client. 

- The M5 MacBook simulator acts as the BLE Peripheral / GATT Server using native macOS CoreBluetooth APIs. 

- The mobile BLE service is responsible for scanning, connecting, subscribing to telemetry, and reporting connection failures. 

- Packet decoding and validation should be separated from transport logic so simulator packets and future physical-sensor packets can use the same application contract. 

- Exact service and characteristic UUIDs are implementation details to be finalized when the simulator GATT design is frozen. 

#### **7. Telemetry Parser / Validation API** 

TelemetryParser { parse(packet: BlePacket): ParseResult; validate(reading: ParsedFlowReading): ValidationResult; } 

ParsedFlowReading { timestamp: number; flowRateLpm: number; sequenceNumber: number | null; status: 'ok' | 'sensor_error' | 'invalid_packet'; } ParseResult = | { ok: true; reading: ParsedFlowReading } | { ok: false; errorCode: TelemetryErrorCode }; ValidationResult = | { valid: true; reading: ParsedFlowReading } | { valid: false; errorCode: TelemetryErrorCode }; TelemetryErrorCode = 'PACKET_TOO_SHORT' | 'INVALID_HEADER' | 'INVALID_LENGTH' | 'INVALID_FLOW_VALUE' | 'INVALID_TIMESTAMP' | 'UNSUPPORTED_VERSION' | 'SENSOR_ERROR' | 'DUPLICATE_PACKET' | 'OUT_OF_ORDER_PACKET'; 

##### **Processing Contract** 

- Malformed packets must not reach usage or leak analysis as valid telemetry. 

- Sensor-error packets should be preserved as diagnostic information when appropriate, but excluded from normal usage integration. 

- The parser must not assume a final protocol until the simulator packet specification is finalized. 

#### **8. Leak Analysis Service API** 

LeakAnalysisService { processReading(reading: FlowReading): Promise<LeakAnalysisResult>; evaluateWindow( sensorId: number, from: number, to: number ): Promise<LeakAnalysisResult>; resetSensorState(sensorId: number): Promise<void>; } 

LeakAnalysisResult { state: 'idle' | 'flowing' | 'suspected_leak' | 'alarmed' | 'resolved'; shouldCreateEvent: boolean; shouldAlarm: boolean; reasonCode: string | null; confidence: 'low' | 'medium' | 'high'; } 

##### **Analysis Notes** 

- The service is intentionally rule/state-based for the OJT scope; machine learning is not required. 

- It should distinguish ordinary short-duration usage from sustained or unusual patterns. 

- Intermittent and sudden-high-flow scenarios should be testable through the simulator. 

- Data-quality and BLE-disconnection conditions should prevent false conclusions when telemetry is unreliable. 

- Thresholds and timing values are configurable design parameters and should be validated through testing rather than presented as guaranteed real-world leak detection accuracy. 

#### **9. Dashboard Query API** 

DashboardRepository { getCurrentStatus(sensorId?: number): Promise<DashboardStatus>; getCurrentFlow(sensorId?: number): Promise<number | null>; getTodayUsage(sensorId?: number): Promise<number>; getRecentUsage(days: number, sensorId?: number): Promise<UsageRecord[]>; getActiveLeak(sensorId?: number): Promise<LeakEvent | null>; } 

AquaSmart — Combined Project Documentation | Page 3 

DashboardStatus { sensorStatus: 'connected' | 'disconnected' | 'error' | 'simulated'; currentFlowRateLpm: number | null; todayUsageLitres: number; activeLeak: LeakEvent | null; lastReadingAt: number | null; } 

#### **10. Leak History Query API** 

LeakHistoryRepository { listLeakEvents( limit: number, offset: number, status?: LeakEvent['status'] ): Promise<LeakEvent[]>; getLeakEventDetail(id: number): Promise<LeakEvent | null>; getLeakStatistics(): Promise<LeakStatistics>; } 

LeakStatistics { totalEvents: number; activeEvents: number; resolvedEvents: number; totalSuspectedLeakDurationSeconds: number; } 

#### **11. Testing / Simulation Repository API** 

SimulationRepository { startScenario( scenario: SimulationScenario, sensorId?: number ): Promise<SimulationRun>; stopScenario(runId: number): Promise<void>; injectPacket( sensorId: number, packet: BlePacket ): Promise<void>; getActiveRun(): Promise<SimulationRun | null>; } 

SimulationScenario = 'normal_flow' | 'continuous_flow' | 'intermittent_flow' | 'sudden_high_flow' | 'no_flow' | 'sensor_error' | 'invalid_packet' | 'missing_packet' | 'duplicate_packet' | 'out_of_order_packet' | 'impossible_flow' | 'ble_disconnect'; SimulationRun { id: number; sensorId: number; scenario: SimulationScenario; startedAt: number; stoppedAt: number | null; groundTruth: 'normal' | 'leak' | 'fault' | 'transport_error'; } 

##### **Ground-Truth Principle** 

- The simulator maintains scenario ground truth so test results can compare detector behaviour with the intended scenario. 

- Simulation controls are development/testing tools and are not part of the normal homeowner workflow. 

- The simulator is a native macOS application on the M5 MacBook, while AquaSmart runs on Android. 

#### **12. React Query Hook API (UI Contract)** 

The UI should consume repositories through React Query hooks. This keeps SQLite, BLE, parsing, and analysis implementation details out of screen components and gives the application predictable loading, caching, invalidation, and error states. 

// hooks/useSensors.js useSensors(filter) useSensor(id) useRegisterSensor() useUpdateSensor() useRemoveSensor() // hooks/useTelemetry.js useLatestReading(sensorId) useFlowReadings(sensorId, from, to) useCurrentFlow(sensorId) // hooks/useUsage.js useTodayUsage(sensorId) useUsageHistory(granularity, from, to, sensorId) // hooks/useLeakEvents.js useActiveLeak(sensorId) useLeakEvents(limit, offset, status) useLeakEventDetail(id) // hooks/useSettings.js useAppSettings() useSetting(key) useUpdateSetting() // hooks/useBle.js useBleDevices() useBleConnection(deviceId) useConnectBle() useDisconnectBle() // hooks/useSimulation.js useSimulationRun() useStartScenario() useStopScenario() 

#### **13. Error Handling Convention** 

class AquaSmartError extends Error { constructor( code, message, originalError = undefined ) { super(message); this.code = code; this.originalError = originalError; } } AquaSmartErrorCode = 'SENSOR_NOT_FOUND' | 'SENSOR_NAME_DUPLICATE' | 'BLE_SCAN_FAILED' | 'BLE_CONNECTION_FAILED' | 'BLE_DISCONNECTED' | 'PERMISSION_DENIED' | 'PACKET_PARSE_FAILED' | 'INVALID_TELEMETRY' | 'DUPLICATE_PACKET' | 'OUT_OF_ORDER_PACKET' | 'DB_WRITE_FAILED' | 'DB_READ_FAILED' | 'LEAK_ANALYSIS_FAILED' | 'SIMULATION_FAILED'; 

##### **UI Error Behaviour** 

- BLE failures should show connection state and a retry action. 

- Invalid telemetry should be logged/recorded for diagnostics without being presented as valid water usage. 

- Database failures should surface a clear persistence error and avoid silently losing user-visible data. 

- Leak-analysis failures must fail safely: no false 'leak resolved' state should be shown solely because analysis failed. 

- React Query mutation/query error handlers should map repository errors to user-friendly messages, while retaining technical error codes for diagnostics. 

AquaSmart — Combined Project Documentation | Page 4 

#### **14. Repository Layer Responsibilities** 

- Repository modules own SQLite reads/writes and map database rows to application domain objects. 

- BLE services own transport and connection lifecycle, not business-level leak decisions. 

- Telemetry parsing owns packet decoding and validation. 

- Usage services own water-volume calculations and aggregation. 

- Leak analysis owns pattern/state evaluation and event creation decisions. 

- React Query hooks provide the UI-facing data contract. 

- Screen components should not contain direct SQLite queries or raw BLE packet parsing. 

#### **15. API Design Principles** 

- Offline-first: core monitoring, history, charts, and leak records remain locally available without internet connectivity. 

- Separation of concerns: transport, parsing, persistence, calculation, analysis, and presentation are separate responsibilities. 

- Testability: simulator scenarios and injectable packets make BLE-dependent behaviour testable without physical hardware. 

- Deterministic contracts: repository/service methods return predictable domain objects and typed error codes. 

- Future hardware compatibility: replacing the simulator with a physical BLE flow meter should not require rewriting the UI or database contract. 

- Protocol flexibility: BLE UUIDs and packet fields remain replaceable until the final simulator protocol is approved. 

#### **16. API-to-Database Mapping** 

#### **17. Scope and Deferred Items** 

- No cloud REST API is required for the OJT MVP. 

- No authentication API is required for the local-only MVP. 

- Remote BLE shutoff-valve commands are future scope and should be added as a separate actuator service if implemented. 

- Multi-sensor synchronization and cross-sensor analytics are stretch scope. 

- Exact BLE GATT UUIDs, packet schema, sampling frequency, and firmware metadata are deferred until simulator protocol design is finalized. 

- Cloud backup, remote notifications, and account synchronization are outside the current offline-first contract. 

#### **18. Summary** 

The AquaSmart local data API defines a clean contract between the React Native application and its local IoT data pipeline. The central flow is BLE telemetry → parsing/validation → SQLite repositories → usage/leak analysis → React Query hooks → UI. The contract is intentionally simulator-compatible so the M5 MacBook BLE peripheral can validate the mobile app before any physical flow sensor is available. The interfaces also keep future hardware integration, additional sensors, and actuator support isolated from the core dashboard and history screens. 

|Field|Details|
|---|---|
|Document ID|API-FE-01|
|Status|Draft|
|Track|Frontend / Mobile IoT Development|



AquaSmart — Combined Project Documentation | Page 5 

|Code|When|Description|
|---|---|---|
|SENSOR_NAME_DUPLICATE|registerSensor|Another configured sensor already<br>uses the name.|
|SENSOR_NOT_FOUND|get/update/remove|No sensor exists with the supplied ID.|
|SENSOR_NOT_REMOVABLE|removeSensor|Sensor cannot be removed while<br>protected application data depends on<br>it.|
|API Area|Primary SQLite Tables|Purpose|
|SensorRepository|sensors|Configured sensor metadata and<br>status.|
|FlowReadingRepository|flow_readings|Raw/validated telemetry history.|
|UsageRepository|usage_records + flow_readings|Aggregated and calculated water<br>usage.|
|LeakEventRepository|leak_events|Leak lifecycle and alarm history.|
|SettingsRepository|settings|User preferences and application<br>configuration.|
|DashboardRepository|flow_readings + usage_records +<br>leak_events|Current status and summary data.|
|LeakHistoryRepository|leak_events|Historical leak list, details, and<br>statistics.|
|SimulationRepository|sensors + flow_readings|Controlled telemetry generation and<br>test execution.|



AquaSmart — Combined Project Documentation | Page 6 

#### **Document 9: Low-Level Design (LLD)** 

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App 

This LLD translates the AquaSmart architecture into concrete modules, JavaScript files, components, services, state management, validation rules, and runtime interactions. It is tailored to the offline-first mobile app and the native macOS BLE simulator. It does not assume a physical flow sensor is available. 

#### **1. Module Architecture** 

src/ III app/ # Expo Router routes I III (tabs)/ I I III index.js # Dashboard I I III usage.js # Usage charts/history I I III leaks.js # Leak history I I III settings.js # Settings I III (modals)/ I I III ble-connect.js # BLE device connection I I III leak-detail.js # Leak event detail I I III active-alarm.js # Active leak alarm I I III simulation.js # Testing/simulation controls I III _layout.js # Root layout + providers I III components/ I III ui/ I I III Button.js I I III Card.js I I III Badge.js I I III Toast.js I I III ConfirmDialog.js I I III EmptyState.js I I III SkeletonLoader.js I III dashboard/ I I III FlowGauge.js I I III SensorStatusCard.js I I III TodayUsageCard.js I I III LeakAlertCard.js I I III RecentFlowChart.js I III usage/ I I III UsageSummaryCard.js I I III UsageChart.js I I III UsageRangeSelector.js I III leaks/ I I III LeakListItem.js I I III LeakDetailCard.js I I III LeakStatusBadge.js I III ble/ I I III BleDeviceListItem.js I I III ConnectionStatus.js I I III SensorSelector.js I III alarm/ I III AlarmBanner.js I III AlarmSoundController.js I III stores/ I III connectionStore.js I III settingsStore.js I III alarmStore.js I III hooks/ I III useSensors.js I III useTelemetry.js I III useUsage.js I III useLeakEvents.js I III useBle.js I III useSettings.js I III useSimulation.js I III repositories/ I III SensorRepository.js I III FlowReadingRepository.js I III UsageRepository.js I III LeakEventRepository.js I III SettingsRepository.js I III services/ I III BleService.js I III TelemetryParser.js I III UsageCalculationService.js I III LeakAnalysisService.js I III AlarmService.js I III SimulationService.js I III database/ I III client.js I III migrations/ I I III index.js I I III v1_initial_schema.js I III seeds/ I III development.js I III types/ I III models.js I III errors.js I III theme/ I III colors.js I III typography.js I III spacing.js I III useTheme.js I III utils/ III date.js III flow.js III validation.js III numbers.js 

#### **2. Key Modules and Interfaces** 

##### **2.1 Connection Store** 

ConnectionState { activeSensorId: number | null; deviceId: string | null; state: 'idle' | 'scanning' | 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'error'; lastSeenAt: number | null; errorCode: string | null; } startScan() connect(deviceId) disconnect(deviceId) setConnectionState(state) clearConnectionError() 

The store contains short-lived UI connection state. Persistent sensor metadata belongs in SQLite through SensorRepository. 

##### **2.2 Telemetry Processing Pipeline** 

async function handleBlePacket(packet) { const parsed = TelemetryParser.parse(packet); if (!parsed.ok) { return recordTelemetryError(parsed.errorCode); } const validated = TelemetryParser.validate(parsed.reading); if (!validated.valid) { return recordTelemetryError(validated.errorCode); } const reading = await flowReadingRepository.addReading({ sensorId: getSensorId(packet.deviceId), timestamp: validated.reading.timestamp, flowRateLpm: validated.reading.flowRateLpm, sequenceNumber: validated.reading.sequenceNumber, status: validated.reading.status, }); await usageCalculationService.processReading(reading); const result = await leakAnalysisService.processReading(reading); await applyLeakResult(result); } 

This boundary keeps raw BLE packets away from the UI and prevents invalid telemetry from being treated as legitimate water usage. 

##### **2.3 Telemetry Parser** 

TelemetryParser.parse(packet) → { ok: true, reading } | { ok: false, errorCode } TelemetryParser.validate(reading) → { valid: true, reading } | { valid: false, errorCode } 

- Packet length, header/version, field encoding, and flow-value validity are checked. 

- Duplicate and out-of-order information is handled using the finalized simulator protocol. 

- The exact byte layout and UUID values remain TBD until the GATT protocol is finalized. 

AquaSmart — Combined Project Documentation | Page 1 

##### **2.4 Usage Calculation Service** 

UsageCalculationService.processReading(reading) UsageCalculationService.calculateUsage(from, to, sensorId) UsageCalculationService.aggregate(granularity, from, to, sensorId) 

- Integrates flow rate over elapsed time to estimate volume. 

- Converts elapsed milliseconds to minutes because flow rate is stored in L/min. 

- Handles telemetry gaps according to an explicit data-quality policy rather than automatically treating missing packets as real zero flow. 

- Produces hourly, daily, and weekly aggregates for charts. 

##### **2.5 Leak Analysis Service** 

LeakAnalysisService.processReading(reading) LeakAnalysisService.evaluateWindow(sensorId, from, to) LeakAnalysisService.resetSensorState(sensorId) 

LeakState = 'idle' | 'flowing' | 'suspected_leak' | 'alarmed' | 'resolved' 

- Evaluates patterns such as sustained flow, duration, sudden high flow, and intermittent behaviour. 

- Uses sensor/data-quality state to avoid conclusions based on unreliable telemetry. 

- The 30-minute continuous suspicious-flow scenario is a controlled OJT demonstration condition, not a universal leak definition. 

- No machine-learning model is required for the MVP. 

##### **2.6 Alarm Service** 

AlarmService.trigger(input) AlarmService.stop() AlarmService.isActive() AlarmService.setSoundEnabled(enabled) 

- Starts a loud alarm when the leak-analysis result requires an alarm. 

- Keeps alarm presentation separate from leak-detection logic. 

- Supports user-visible alarm state and a safe stop/dismiss action according to the final UX rules. 

- Uses expo-compatible audio functionality for the mobile implementation. 

#### **3. BLE Simulator Integration** 

The OJT test environment contains two applications: 

- M5 MacBook: native macOS Swift/SwiftUI application acting as BLE Peripheral / GATT Server. 

- Android phone: React Native AquaSmart application acting as BLE Central / GATT Client. 

- The simulator generates scenario-driven telemetry and maintains ground truth for test comparison. 

MacBook Simulator → CoreBluetooth / CBPeripheralManager → BLE GATT telemetry → react-native-ble-plx → BleService → TelemetryParser → SQLite + Analysis → AquaSmart UI 

##### **Supported Simulation Scenarios** 

#### **4. Key UI Components** 

##### **4.1 FlowGauge** 

FlowGaugeProps { flowRateLpm: number | null; maxDisplayLpm?: number; status: 'normal' | 'suspicious' | 'error'; } 

- Displays current flow in L/min. 

- Clearly indicates when data is unavailable or invalid. 

- Does not itself decide whether a leak exists. 

##### **4.2 LeakAlertCard** 

LeakAlertCardProps { event: LeakEvent | null; onViewDetails: () => void; onDismiss?: () => void; } 

AquaSmart — Combined Project Documentation | Page 2 

- Shows active leak information from the analysis/repository layer. 

- Provides navigation to leak details and the active alarm experience. 

##### **4.3 UsageChart** 

UsageChartProps { records: UsageRecord[]; granularity: 'hour' | 'day' | 'week'; unit: 'L' | 'm³'; } 

- Renders aggregated local usage data. 

- Shows an empty state when insufficient data exists. 

##### **4.4 AlarmBanner** 

AlarmBannerProps { active: boolean; reason: string | null; startedAt: number | null; onStop: () => void; } 

- Provides persistent visual feedback while the alarm is active. 

- Works together with AlarmService for sound playback. 

#### **5. Sequence Diagrams** 

##### **Sequence 1: BLE Reading to Dashboard** 

BLE Simulator | | GATT telemetry packet v BleService | v TelemetryParser | | valid reading v FlowReadingRepository ----> SQLite | +----> UsageCalculationService | | | +----> UsageRepository | +----> LeakAnalysisService | +----> LeakEventRepository | +----> AlarmService React Query hooks <---- repositories/services | v Dashboard / Charts / Leak UI 

##### **Sequence 2: Leak Alarm** 

FlowReading | v LeakAnalysisService | | suspicious pattern v LeakEventRepository | | alarm required v AlarmService | +----> AlarmStore | | | v | AlarmBanner | +----> Audio playback 

##### **Sequence 3: BLE Disconnect Recovery** 

Android App | v BleService detects disconnect | v ConnectionStore = 'disconnected' | +----> Dashboard shows disconnected state | +----> Stop/mark telemetry stream unavailable | v User taps Retry | v BleService.connect(deviceId) | +---- success --> connected + resume subscription | +---- failure --> error state + retry message 

#### **6. State Management** 

**React Query Cache Keys** 

#### **7. Error Handling** 

#### **8. Validation** 

export const flowValidation = { flowRateLpm: (value) => { const n = Number(value); if (!Number.isFinite(n) || n < 0) return 'Invalid flow rate'; if (n > MAX_REASONABLE_FLOW_LPM) return 'Flow rate exceeds configured range'; return true; } }; export const settingsValidation = { volumeUnit: (value) => ['L', 'm³'].includes(value) || 'Invalid volume unit', leakAlertEnabled: (value) => typeof value === 'boolean' || 'Invalid alert setting' }; 

- Validation limits should be configurable/testable and should not be presented as proof of physical-sensor accuracy. 

- User-facing forms should validate values before repository writes. 

- Protocol-level validation should occur before usage and leak analysis. 

#### **9. Design Patterns** 

#### **10. Testing Hooks and Testability** 

- Repositories should accept a database dependency or test database so SQLite behaviour can be tested independently. 

AquaSmart — Combined Project Documentation | Page 3 

- BleService should expose mockable connection/notification behaviour. 

- TelemetryParser should be pure where possible so packet fixtures can be tested deterministically. 

- LeakAnalysisService should accept controlled timestamps/readings to test duration-based rules quickly. 

- SimulationService should expose scenario controls and ground truth for integration testing. 

- The OJT test suite should compare expected scenario outcomes with observed detector outcomes. 

#### **11. Crash Recovery and Data Safety** 

- On app launch, recover the last persisted sensor configuration and settings. 

- Incomplete database writes should use SQLite transactions where multiple records must remain consistent. 

- A BLE disconnect must not delete historical readings or leak events. 

- If the app is closed during an active alarm, the next launch should re-evaluate persisted active-event state and present the appropriate alarm/history state. 

- The app should never fabricate telemetry to fill missing BLE packets. 

#### **12. Future Extension Points** 

- Physical BLE flow meter can replace the MacBook simulator while preserving the mobile repository and UI contracts. 

- Multiple sensors can be supported by retaining sensorId throughout telemetry, usage, and leak APIs. 

- A future BLE shutoff valve can be implemented as a separate actuator service rather than mixing commands into FlowReadingRepository. 

- Cloud synchronization can be added later without forcing screens to access a remote API directly. 

- Water-bill calculation and reporting can consume UsageRepository outputs without changing the telemetry pipeline. 

#### **13. Summary** 

The AquaSmart LLD defines the concrete implementation structure behind the HLD and Repository API. The design separates React Native screens, reusable components, Zustand state, React Query hooks, SQLite repositories, BLE transport, telemetry parsing, usage calculation, leak analysis, and alarm control. The native MacBook BLE simulator provides controlled telemetry and fault scenarios, allowing the Android app to be tested without physical sensor hardware. JavaScript is used throughout the mobile application, while the simulator remains a separate native macOS Swift/SwiftUI application. 

|Field|Details|
|---|---|
|Document ID|LLD-FE-01|
|Status|Draft|
|Track|Frontend / Mobile IoT Development|



|Scenario|Ground Truth|Purpose|
|---|---|---|
|normal_flow|normal|Verify ordinary household usage does<br>not alarm.|
|continuous_flow|leak|Verify sustained suspicious flow<br>detection.|
|intermittent_flow|normal/leak test|Verify repeated short flows and<br>configurable pattern rules.|
|sudden_high_flow|test condition|Verify sudden-rate-change handling.|
|no_flow|normal|Verify zero-flow state and dashboard<br>behaviour.|
|sensor_error|fault|Verify sensor error handling.|



AquaSmart — Combined Project Documentation | Page 4 

|Scenario|Ground Truth|Purpose|
|---|---|---|
|invalid_packet|fault|Verify parser rejection.|
|missing_packet|transport_error|Verify telemetry gaps.|
|duplicate_packet|transport_error|Verify duplicate protection.|
|out_of_order_packet|transport_error|Verify sequence/timestamp ordering.|
|impossible_flow|fault|Verify value validation.|
|ble_disconnect|transport_error|Verify connection recovery UI.|



|Store / Layer|Persistence|Data|
|---|---|---|
|connectionStore|In-memory|BLE connection state, active sensor,<br>last seen, connection error.|
|alarmStore|In-memory|Active alarm state, reason, start time.|
|settingsStore|SQLite-backed|User settings and alert preferences.|
|React Query cache|In-memory|Repository query results and<br>invalidation state.|
|SQLite repositories|Persistent local|Sensors, readings, usage records, leak<br>events, settings.|



|Query Key|Data|Suggested Stale Time|
|---|---|---|
|['sensors', filter]|Sensor list|5 minutes|
|['sensor', id]|Sensor detail|5 minutes|
|['latestReading', sensorId]|Latest flow reading|Very short / refetch as needed|
|['flowReadings', sensorId, from, to]|Telemetry history|1 minute|
|['usage', granularity, from, to, sensorId]|Usage chart data|1 minute|
|['activeLeak', sensorId]|Active leak event|Very short / invalidate on analysis<br>result|
|['leakEvents', limit, offset, status]|Leak history|1 minute|
|['settings']|Application settings|5 minutes|
|['bleConnection', deviceId]|Connection state|Managed by store/service|



|Error Scenario|Layer|Handling|
|---|---|---|
|BLE scan failure|BleService|Set connection error state and show<br>retry.|
|BLE disconnect|BleService / Store|Mark sensor disconnected and stop<br>treating missing telemetry as zero<br>usage.|
|Invalid packet|Parser|Reject packet; record diagnostic<br>information.|
|Impossible flow value|Validation|Reject as invalid telemetry.|
|Duplicate packet|Parser/Repository|Do not double-count it in usage.|
|Out-of-order packet|Parser/Repository|Prevent stale data from corrupting<br>current calculations.|
|SQLite write failure|Repository|Throw<br>AquaSmartError('DB_WRITE_FAILED')<br>and surface a recoverable UI error.|



AquaSmart — Combined Project Documentation | Page 5 

|Error Scenario|Layer|Handling|
|---|---|---|
|Leak analysis failure|Analysis Service|Fail safely; do not falsely mark a leak<br>as resolved.|
|Alarm playback failure|AlarmService|Keep visual alarm state active and<br>show an audio-error message.|
|Permission denied|BLE/UI|Explain required permission and<br>provide retry/settings guidance.|
|Pattern|Where Used|Why|
|Repository|SQLite repositories|Separates persistence queries from<br>business/UI logic.|
|Observer / Store|Zustand stores|Keeps connection and alarm state<br>reactive.|
|Adapter|BleService|Isolates react-native-ble-plx from the<br>rest of the application.|
|Pipeline|BLE→parser→validation→<br>persistence→analysis|Prevents malformed transport data<br>from reaching business logic.|
|Strategy / Rule evaluation|LeakAnalysisService|Allows leak rules to evolve without<br>changing UI code.|
|Service Layer|UsageCalculationService,<br>AlarmService, LeakAnalysisService|Encapsulates domain operations that<br>involve multiple steps.|
|Singleton|database/client.js|Provides one SQLite database client<br>for the app lifecycle.|



AquaSmart — Combined Project Documentation | Page 6 

#### **Document 10: Frontend Architecture** 

Frontend Development — Track-Specific Architecture 

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App 

AquaSmart is an offline-first React Native mobile application whose frontend coordinates BLE telemetry, local SQLite persistence, usage calculations, leak analysis, alarm presentation, and history/chart screens. The Android application is the BLE Central / GATT Client and connects to the physical BLE water-flow sensor during real-world use. A simulator may be used only as a development/testing substitute when physical sensor hardware is unavailable. 

#### **1. Frontend Architecture Overview** 

The frontend is responsible for the complete mobile application experience because the MVP does not require a cloud backend. The architecture separates UI components, client state, asynchronous data access, BLE transport, telemetry parsing, domain services, and SQLite persistence. 

##### **Technology Stack** 

The mobile stack deliberately uses JavaScript rather than TypeScript, matching the project requirement. 

#### **2. Component Architecture** 

App (_layout.js) I III Providers I III SQLite database provider / client I III QueryClientProvider I III Theme provider I III Gesture handler root I III (tabs) I III DashboardScreen I I III SensorStatusCard I I III CurrentFlowCard / FlowGauge I I III TodayUsageCard I I III LeakAlertCard I I III RecentFlowChart I III UsageScreen I I III UsageSummaryCard I I III UsageRangeSelector I I III UsageChart I III LeakHistoryScreen I I III LeakListItem I I III EmptyState I III SettingsScreen I III SensorConnectionEntry I III AlertSettings I III AlarmSoundToggle I III UnitSettings I III (modals) I III BleConnectionScreen I III LeakDetailScreen I III ActiveAlarmScreen I III SimulationControlsScreen I III Supporting components III ui/ III ble/ III dashboard/ III usage/ III leaks/ III alarm/ 

#### **3. Design System** 

##### **Theme System** 

export const colors = { dark: { background: '#0D0D0F', surface: '#1C1C1E', surfaceElevated: '#2C2C2E', border: '#3A3A3C', primary: '#38BDF8', secondary: '#22D3EE', danger: '#F87171', warning: '#FBBF24', success: '#34D399', text: '#F9FAFB', textMuted: '#9CA3AF', textDisabled: '#4B5563' }, light: { background: '#F9FAFB', surface: '#FFFFFF', surfaceElevated: '#F3F4F6', border: '#E5E7EB', primary: '#0284C7', secondary: '#0891B2', danger: '#DC2626', warning: '#D97706', success: '#16A34A', text: '#111827', textMuted: '#6B7280', textDisabled: '#9CA3AF' } }; 

These values are proposed design tokens, not measurements from a physical device or externally mandated branding. They can be adjusted during UX implementation. 

##### **Typography** 

export const typography = { display: { fontSize: 40, lineHeight: 48 }, h1: { fontSize: 28, lineHeight: 36 }, h2: { fontSize: 22, lineHeight: 30 }, h3: { fontSize: 18, lineHeight: 26 }, body: { fontSize: 16, lineHeight: 24 }, bodySmall: { fontSize: 14, lineHeight: 20 }, caption: { fontSize: 12, lineHeight: 16 }, mono: { fontSize: 16, lineHeight: 24 } }; 

#### **4. State Management** 

Short-lived connection and alarm state belongs in Zustand. Persistent domain data belongs in SQLite. React Query manages asynchronous repository data and cache state. 

##### **React Query Strategy** 

- Use stale-while-revalidate behaviour for SQLite-backed queries where appropriate. 

- Invalidate usage, dashboard, and leak-history queries after relevant mutations. 

- Keep rapidly changing current-flow data fresh without forcing unrelated screens to re-render. 

AquaSmart — Combined Project Documentation | Page 1 

- Prefetch lightweight sensor/configuration data when useful. 

- Do not use the React Query cache as the system of record; SQLite remains the persistent source. 

#### **5. Routing** 

Exact Expo Router grouping can be adjusted during implementation without changing the domain architecture. 

##### **Navigation Guards** 

- If the application requires first-run setup, route the user through onboarding before normal monitoring screens. 

- BLE-dependent screens should handle disconnected state rather than assuming a sensor is always available. 

- Simulation controls should be hidden or protected in the normal homeowner-facing navigation. 

#### **6. API Integration** 

AquaSmart has no required external REST API for the MVP. UI data is obtained through repository methods exposed by React Query hooks. 

useLatestReading(sensorId) useFlowReadings(sensorId, from, to) useTodayUsage(sensorId) useUsageHistory(granularity, from, to, sensorId) useActiveLeak(sensorId) useLeakEvents(limit, offset, status) useSensors(filter) useAppSettings() useBleConnection(deviceId) useStartScenario() useStopScenario() 

The BLE service is a device integration layer, not a cloud API. The repository API and frontend hook contract are defined in the separate Repository API document. 

#### **7. BLE and Telemetry Integration** 

`Physical BLE Water Flow Sensor` I I `BLE GATT notifications` M `react-native-ble-plx` I M `BleService` I M `TelemetryParser` I M `Validation` I III `invalid` → `diagnostics / ignore for normal calculations` I M `FlowReadingRepository` I M `SQLite` IIIIIIIIIIIIIIIIIIIIII M M `UsageCalculation LeakAnalysis` I I M M `UsageRepository LeakEventRepository` I M `AlarmService` I M `UI` 

- The Android app acts as BLE Central / GATT Client. 

- The native BLE simulator acts as BLE Peripheral / GATT Server. 

- The exact GATT UUIDs, packet layout, byte order, scaling, and sampling details remain TBD until the selected sensor protocol or development BLE test protocol is finalized. 

- The UI never consumes raw BLE packets directly. 

#### **8. Form Architecture** 

React Hook Form can be used for settings and structured forms where it reduces unnecessary re-renders. Simple controls may use ordinary React state to avoid unnecessary abstraction. 

function SensorSettingsForm({ onSuccess }) { const { control, handleSubmit, formState: { errors } } = useForm({ defaultValues: { name: '', alertEnabled: true, alarmSoundEnabled: true } }); const { mutate: saveSettings } = useUpdateSetting(); const onSubmit = data => { // validate, persist through repository, then refresh UI }; } 

- Validate flow-related and configuration values before persistence. 

- Do not allow invalid unit or sensor identifiers to reach repository writes. 

#### **9. Error States** 

#### **10. Loading States** 

- Loading indicators should not imply zero water flow or zero usage. 

- A disconnected or unavailable sensor must be visually different from a loading state. 

#### **11. Accessibility** 

AquaSmart — Combined Project Documentation | Page 2 

- Critical leak information must remain understandable without relying on colour, animation, or sound alone. 

#### **12. Responsive Design** 

#### **13. Performance Optimization** 

- Do not over-optimize before profiling; the expected OJT dataset is modest. 

#### **14. Code Splitting / Lazy Loading** 

#### **15. Caching** 

SQLite remains the durable local source. Cache policies are implementation parameters and can be tuned after performance testing. 

#### **16. Security and Privacy in the Frontend** 

- Keep sensor identifiers and telemetry local unless a future cloud feature explicitly requires transmission. 

- Do not log raw telemetry unnecessarily in production builds. 

- Avoid exposing internal database errors directly to end users. 

- Restrict simulation/development controls from normal user-facing navigation. 

- Validate BLE-originated data before storing or analysing it. 

- Future remote-control functionality, such as a BLE shutoff valve, should require a separate security review. 

#### **17. Testing** 

- Test cases must include normal flow, continuous suspicious flow, intermittent flow, sudden high flow, no flow, invalid packets, duplicates, out-of-order data, impossible values, and BLE disconnect. 

#### **18. Development and CI/CD** 

The frontend should be checked automatically on pull requests using the project's configured GitHub Actions pipeline. 

- JavaScript linting and formatting checks. 

- Unit and component tests. 

- Build validation for the Expo application. 

- Optional E2E checks when the Android test environment is available. 

- No TypeScript compiler step is required because AquaSmart uses JavaScript. 

#### **19. SEO / ASO** 

SEO is not applicable to the mobile application itself. If the project is published later, App Store / Play Store optimization can use messaging around household water monitoring, leak alerts, BLE connectivity, offline-first operation, and water usage history. Exact store copy should be finalized during release preparation. 

#### **20. Frontend Design Principles** 

- Offline-first: core monitoring history and analysis should remain usable without internet access. 

- Data ownership: SQLite is the local source of truth for persistent application data. 

- Separation of concerns: screens do not directly parse BLE packets or execute SQLite queries. 

- Fail-safe behaviour: bad telemetry or analysis errors must not silently become valid usage or a false resolved-leak state. 

AquaSmart — Combined Project Documentation | Page 3 

- Hardware independence: the BLE transport and telemetry-processing layers should isolate sensor-specific details so the selected physical BLE flow meter can be integrated without rewriting the dashboard, history, or analysis UI. 

- Testability: simulator scenarios provide repeatable telemetry and known ground truth. 

- Progressive enhancement: advanced features such as bill calculation, multiple sensors, notifications, and a BLE shutoff valve can be added without redesigning the basic frontend contract. 

#### **21. Summary** 

The AquaSmart frontend architecture is a JavaScript-based React Native/Expo client organized around reusable UI components, Zustand client state, React Query data state, BLE services, telemetry validation, SQLite repositories, usage calculation, leak analysis, and alarm presentation. In normal operation, a physical BLE water-flow sensor supplies telemetry to the Android app. A development BLE simulator is used only when controlled testing is required or physical hardware is unavailable. The architecture deliberately keeps transport, persistence, business analysis, and presentation separate so the OJT MVP remains understandable, testable, and extensible. 

|Field|Details|
|---|---|
|Document ID|FEA-FE-01|
|Status|Draft|
|Track|Frontend / Mobile IoT Development|
|Area|AquaSmart Choice|
|Framework|React Native with Expo|
|Language|JavaScript|
|Routing|Expo Router, file-based routing|
|Client state|Zustand|
|Async/data state|TanStack React Query|
|Local database|expo-sqlite|
|BLE Central|react-native-ble-plx|
|Animations|React Native Reanimated|
|Charts|React Native-compatible charting library|
|Audio|expo-av|
|Forms|React Hook Form where form complexity benefits from it|
|Testing|Jest + React Native Testing Library; E2E framework may be<br>added based on final project setup|



|Store / Layer|State|Actions / Role|
|---|---|---|
|connectionStore|active sensor, BLE device ID,<br>connection state, last seen, error|scan, connect, disconnect, update<br>state|
|alarmStore|alarm active, reason, startedAt|activate, stop, reset|
|settingsStore|theme, units, alert preferences, default<br>sensor|update settings|
|React Query|repository query/mutation results|fetch, cache, invalidate, refetch|
|SQLite|persistent domain data|repositories own reads/writes|
|File|Route|Type|
|app/(tabs)/index.js|/|Dashboard tab|
|app/(tabs)/usage.js|/usage|Usage tab|



AquaSmart — Combined Project Documentation | Page 4 

|File|Route|Type|
|---|---|---|
|app/(tabs)/leaks.js|/leaks|Leak History tab|
|app/(tabs)/settings.js|/settings|Settings tab|
|app/(modals)/ble-connect.js|/ble-connect|Modal|
|app/(modals)/leak-detail.js|/leak-detail|Modal|
|app/(modals)/active-alarm.js|/active-alarm|Modal / alarm presentation|
|app/(modals)/simulation.js|/simulation|Development/testing modal|



|Component|Error|Display / Behaviour|
|---|---|---|
|Dashboard|No sensor connected|Clear disconnected card +<br>Connect/Retry action|
|BLE Connection|Permission denied|Explain permission requirement +<br>retry/settings guidance|
|BLE Connection|Connection failed|Retry action and technical state<br>indicator|
|Dashboard / Charts|No telemetry|Empty state explaining that data will<br>appear after readings arrive|
|UsageScreen|Database read failure|Inline error + retry|
|Leak History|Database read failure|Error state + retry|
|Active Alarm|Audio failure|Keep visual alarm active and show<br>audio error|
|Telemetry pipeline|Invalid packet|Do not count as valid usage; retain<br>diagnostic information|
|Settings|Invalid value|Inline validation|



|Screen / Component|Loading State|
|---|---|
|Dashboard|Placeholder/skeleton for current flow and usage cards|
|Usage chart|Chart skeleton while query loads|
|Leak history|Skeleton list|
|BLE device list|Scanning indicator and skeleton/empty state|
|Settings|Placeholder while persisted settings load|



|Feature|Implementation|
|---|---|
|Screen reader labels|accessibilityLabel on buttons, sensor controls, alarm<br>actions, and charts where practical|
|Current flow|Announce value with unit, e.g. L/min|
|Leak alert|Use clear alert semantics and text, not colour alone|
|Alarm stop|Explicit accessible button label|
|Reduced motion|Respect reduced-motion preference for nonessential<br>animations|
|Font scaling|Allow system font scaling; avoid clipping at large text sizes|
|Tap targets|Use sufficiently large interactive areas|



AquaSmart — Combined Project Documentation | Page 5 

|Pattern|Implementation|
|---|---|
|Horizontal padding|Consistent spacing token rather than hard-coded screen<br>widths|
|Cards|Flexbox-based layouts that adapt to different Android screen<br>sizes|
|Charts|Calculate available width from layout measurement|
|Flow gauge|Scale within available container; avoid assuming a fixed<br>device size|
|Safe areas|Use safe-area insets for system bars and notches|
|Large text|Allow content to reflow rather than truncating critical values|



|Optimization|Implementation|
|---|---|
|Telemetry updates|Update only components that need current flow/connection<br>state|
|Lists|FlatList for leak history and BLE device lists|
|Memoization|React.memo for repeated list items where profiling shows<br>benefit|
|Handlers|useCallback/useMemo selectively for expensive list props|
|Animations|Reanimated for UI-thread animations|
|SQLite|Use indexed time/sensor queries defined in the database<br>design|
|React Query|Cache stable history/settings data; keep high-frequency<br>telemetry appropriately fresh|
|Charts|Aggregate data before rendering long time ranges|



|Target|Method|
|---|---|
|Secondary screens|Load through normal Expo Router navigation; keep startup<br>path lightweight|
|Simulation controls|Keep outside the normal startup UI|
|Chart-heavy screens|Initialize chart rendering when the usage screen is opened|
|Development-only tools|Exclude from normal user navigation where practical|



|Cache|Mechanism|Suggested Policy|
|---|---|---|
|Sensor metadata|React Query|Several minutes; invalidate after<br>configuration change|
|Latest reading|React Query / state|Short freshness window because<br>telemetry changes frequently|
|Usage history|React Query|Short-to-moderate freshness; invalidate<br>after new aggregate data|
|Leak history|React Query|Invalidate after event<br>creation/resolution|
|Settings|Zustand + SQLite|Persist locally; refresh on startup|
|Connection state|Zustand|In-memory; reflects live BLE state|



AquaSmart — Combined Project Documentation | Page 6 

|Level|Tools / Focus|
|---|---|
|Unit|Jest — validation, usage calculations, parser, leak-analysis<br>rules|
|Component|React Native Testing Library — dashboard cards, charts<br>states, alarm UI, forms|
|Repository integration|Test SQLite repository operations with a controlled test<br>database/mock|
|BLE integration|Mock react-native-ble-plx and feed deterministic simulator<br>packets|
|Scenario testing|Run simulator scenarios and compare detector output<br>against ground truth|
|E2E|Use the selected mobile E2E framework if configured for the<br>OJT project|



AquaSmart — Combined Project Documentation | Page 7 

#### **Document 11: Security Design** 

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App 

AquaSmart's security model is primarily based on local-first data handling, mobile app sandboxing, controlled BLE communication, input validation, and minimal permissions. The production application connects to a physical BLE water-flow sensor. A BLE simulator may be used only during development/testing when physical hardware is unavailable. 

#### **1. Security Philosophy** 

The AquaSmart MVP does not require a cloud server, user account, or external REST API. Water-flow telemetry, usage history, leak events, and settings are intended to remain on the user's device. This substantially reduces risks associated with server-side breaches, account attacks, and unnecessary data transfer. 

#### **2. Threat Model** 

#### **3. Data Privacy** 

##### **Privacy Statement** 

Suggested Settings text: "AquaSmart stores your water-flow, usage, leak history, and application settings locally on this device. The MVP does not require an account or cloud server. Data is not intentionally uploaded to a remote service." 

This statement should be updated if cloud synchronization, remote notifications, analytics, or other network features are added in future. 

#### **4. Input Validation and SQL Injection Prevention** 

##### **Parameterized Queries** 

// CORRECT await db.runAsync( 'INSERT INTO sensors (name, device_identifier) VALUES (?, ?)', [name, deviceIdentifier] ); // NEVER // await db.runAsync( // `INSERT INTO sensors (name) VALUES ('${name}')` // ); 

- All SQLite queries must use parameterized placeholders rather than string concatenation. 

- Repository methods should validate inputs before executing writes. 

- BLE-originated values must be treated as untrusted input even though they come from a known sensor. 

##### **Input Validation** 

#### **5. BLE Security** 

BLE is part of AquaSmart's real production data path, so it requires explicit security consideration. The application should not assume that receiving a BLE packet automatically makes the data trustworthy. 

- Scan and connect only to the expected sensor/device where practical. 

- Verify expected GATT service and characteristic information before subscribing to telemetry. 

- Validate every telemetry packet before persistence or analysis. 

- Handle unexpected disconnects and reconnect attempts without corrupting usage calculations. 

- Avoid exposing raw BLE payloads in production logs. 

- Use the security capabilities supported by the selected physical sensor and BLE platform configuration. 

- Exact pairing/bonding requirements depend on the selected physical sensor hardware and are therefore a design/TBD item until hardware is finalized. 

#### **6. Permissions** 

##### **Permission Denied Handling** 

AquaSmart — Combined Project Documentation | Page 1 

const permission = await requestBluetoothPermission(); if (permission.granted) { // Continue to BLE discovery/connection } else { // Show clear explanation and retry/settings guidance // App remains usable for local history/settings where possible } 

The exact permission API and platform-specific permission set should follow the final React Native/Expo BLE implementation and target Android version. 

#### **7. Third-Party Dependency Security** 

- Dependencies should be actively maintained and appropriate for React Native/Expo. 

- Avoid adding analytics, advertising, or cloud SDKs that conflict with the MVP's local-first privacy model. 

- New native BLE libraries should receive additional review because they interact with device permissions and transport layers. 

#### **8. Data Storage Security** 

AquaSmart stores its persistent data in the application's private SQLite database. Other ordinary applications should not be able to access that database through normal mobile sandbox mechanisms. 

- Do not place telemetry or leak history in general-purpose shared storage. 

- Do not put sensitive telemetry data in logs, URLs, or clipboard content. 

- AsyncStorage/local preference storage should be limited to non-sensitive configuration unless a future security review approves otherwise. 

- If platform backup is enabled, the project must explicitly decide whether household telemetry should be included; this decision should be documented rather than assumed. 

#### **9. Code Security Practices** 

Because AquaSmart uses JavaScript, TypeScript-specific security controls from the FitTrack sample are intentionally not copied. 

#### **10. Device-Level Security** 

AquaSmart relies primarily on Android/iOS device security and application sandboxing for protection of local data at rest. 

- An in-app PIN/biometric lock is not required for the MVP unless later requirements justify it. 

- Custom database encryption is not assumed for the MVP; if threat analysis later requires it, the storage design should be revisited. 

#### **11. BLE Data Integrity and Safety** 

The most important AquaSmart-specific security boundary is the telemetry pipeline. 

BLE packet ↓ Packet parsing ↓ Schema / protocol validation ↓ Flow + timestamp validation ↓ Duplicate / ordering checks ↓ SQLite persistence ↓ Usage + leak analysis 

- Malformed packets must not be processed as valid water usage. 

- Duplicate packets must not be double-counted. 

- Out-of-order packets must not overwrite or corrupt newer state. 

- Impossible flow values must be rejected or explicitly stored as invalid diagnostic test data. 

- Sensor-error status must not automatically become normal zero-flow data. 

- Missing packets should be represented as missing/unavailable telemetry rather than fabricated readings. 

- Leak analysis should fail safely when telemetry quality is insufficient. 

#### **12. Security of Leak Alarms** 

- A leak alarm is a safety-oriented application feature, but it should not be described as guaranteed physical protection. 

AquaSmart — Combined Project Documentation | Page 2 

- The alarm UI should clearly show when the app has detected a suspicious/leak condition. 

- If audio playback fails, the visual alarm state should remain active. 

- A BLE disconnect should not silently clear an existing leak event. 

- Future automatic shutoff-valve control requires a separate authorization and command-security design before implementation. 

#### **13. Development and Simulation Security** 

A BLE simulator is a testing tool only. It should not weaken the production architecture or be presented as the normal sensor connection. 

- Simulation controls should be clearly separated from homeowner-facing screens. 

- Test packets should be clearly identifiable as test data. 

- Simulator scenarios should cover invalid packets, duplicates, out-of-order packets, impossible values, and disconnects. 

- Production builds should not expose unrestricted packet injection controls unless explicitly required. 

- Ground-truth labels used by tests should not be treated as production sensor data. 

#### **14. Privacy / Compliance Considerations** 

Legal compliance cannot be guaranteed solely by architecture. If AquaSmart is distributed commercially, privacy notices, consent wording, retention, backup behaviour, and applicable regulations should be reviewed for the target markets. 

#### **15. Security Testing** 

#### **16. Security Assumptions and Deferred Decisions** 

- The selected physical sensor's BLE pairing/bonding and authentication capabilities are not yet finalized. 

- Exact GATT UUIDs and packet encoding are not finalized. 

- Whether database-level encryption is required beyond OS/device protection should be reviewed after the threat model is validated. 

- Cloud synchronization and remote notifications are outside the MVP security boundary. 

- Remote BLE shutoff-valve control requires a dedicated command-authentication and authorization design. 

- If user accounts or cloud services are added later, the security architecture must be expanded substantially. 

#### **17. Summary** 

AquaSmart's security design is based on local-first storage, mobile sandboxing, minimum permissions, parameterized SQLite access, dependency hygiene, and strict validation of BLE telemetry. The physical BLE water-flow sensor is the normal source of production telemetry. A development BLE simulator is used only for controlled testing when physical hardware is unavailable. The design intentionally avoids unsupported claims about sensor authentication, packet security, encryption, or regulatory compliance until the selected hardware and final deployment requirements are known. 

|Field|Details|
|---|---|
|Document ID|SEC-FE-01|
|Status|Draft|
|Track|Frontend / Mobile IoT Development|
|Risk Category|AquaSmart Exposure|
|Server-side data breach|Low for MVP — no required cloud server|
|API authentication bypass|Not applicable to the local MVP|



AquaSmart — Combined Project Documentation | Page 3 

|Risk Category||AquaSmart Exposure||
|---|---|---|---|
|Internet man-in-the-middle||Not applicable to core local da<br>applies|ta flow; BLE security still|
|Cross-site scripting||Not applicable to the native m|obile UI|
|Network-based SQL injection||Not applicable; SQLite is local||
|Credential stuffing||Not applicable; no user accou|nts in MVP|
|Unauthorized BLE device inter|action|Relevant — controlled through<br>and application validation|BLE discovery/connection|
|Threat|Likelihood|Impact|Mitigation|
|Phone theft→access to<br>water usage/leak history|Medium|Medium|Rely on OS device security<br>and app sandbox; minimize<br>exposed sensitive data.|
|Malicious app attempts to<br>access SQLite|Low|High|Android/iOS application<br>sandboxing and OS security.|
|SQL injection through<br>settings/sensor names|Low|Medium|Parameterized SQLite<br>queries and input validation.|
|Malicious or unexpected BLE<br>telemetry|Medium|High|Validate packet structure,<br>flow values, timestamps,<br>status, duplicates, and<br>ordering.|
|BLE spoofing / unexpected<br>device|Low–Medium|High|Use configured/recognized<br>device identity and validate<br>expected GATT<br>service/characteristic<br>information.|
|BLE disconnect during<br>monitoring|Medium|Medium|Explicit connection state,<br>stale-data handling,<br>retry/reconnect UI.|
|Third-party dependency<br>vulnerability|Low–Medium|High|Dependency review, lockfile,<br>npm audit, and controlled<br>upgrades.|
|Excessive mobile<br>permissions|Low|Medium|Request only permissions<br>required by implemented<br>features.|
|Local backup exposure|Medium|Medium|Review platform backup<br>behaviour and document the<br>chosen backup policy.|
|Debug/simulation controls<br>exposed to normal users|Low|Medium|Keep development testing<br>controls out of normal<br>homeowner<br>navigation/builds where<br>practical.|
|Data Type|Stored In|Sensitivity|Leaves Device?|
|BLE flow readings|SQLite|Potentially sensitive<br>household usage data|No in MVP|
|Water usage records|SQLite|Potentially sensitive<br>household usage data|No in MVP|



AquaSmart — Combined Project Documentation | Page 4 

|Data Type|Stored In|Sensitivity|Leaves Device?|
|---|---|---|---|
|Leak events/history|SQLite|Potentially sensitive<br>household information|No in MVP|
|Sensor metadata|SQLite|Low–Medium|No in MVP|
|Theme/unit/alert preferences|SQLite / local settings|Low|No in MVP|
|Temporary BLE connection<br>state|In-memory Zustand state|Low|No|



|Input|Validation|Suggested Limit|
|---|---|---|
|Sensor name|Required where applicable, trim, reject<br>blank|50 chars|
|Device identifier|Validate expected identifier format|Defined by BLE integration|
|Flow rate|Finite numeric value, non-negative,<br>within configured engineering range|Sensor/protocol dependent|
|Timestamp|Valid numeric timestamp and sane<br>range|Protocol dependent|
|Sequence number|Integer if supplied|Protocol dependent|
|Volume|Finite, non-negative|Application-defined|
|Settings values|Allow only supported<br>enumerations/ranges|Application-defined|
|Simulation scenario|Allow only predefined scenario values|Fixed enum|



|Permission / Capability|Required?|When Requested|Why|
|---|---|---|---|
|Bluetooth / Nearby devices|Yes|When BLE functionality is<br>first needed, according to<br>Android requirements|Discover and communicate<br>with the water-flow sensor.|
|Notifications|Future / optional|Only if notification feature is<br>implemented|Leak or usage notifications<br>when the app is not<br>foregrounded.|
|Location|Avoid unless platform/sensor<br>requirements force it|Only if technically required<br>by the chosen BLE setup|Not a business requirement<br>for AquaSmart.|
|Camera|No|Never for MVP|Not needed.|
|Contacts|No|Never|Not needed.|
|Motion / Activity|No for core AquaSmart flow<br>monitoring|Never unless a future feature<br>requires it|Water-flow monitoring does<br>not require a phone<br>pedometer.|
|Storage permission|No for normal SQLite use|Never|Application-private storage is<br>sufficient.|



|Tool / Practice|Use|
|---|---|
|npm audit|Check known dependency vulnerabilities.|
|package-lock.json|Pin reproducible dependency resolution.|
|Dependabot|Optional automated dependency update review.|
|Code review|Review BLE, database, storage, and permission changes<br>carefully.|
|License review|Confirm production dependencies have acceptable licenses.|



AquaSmart — Combined Project Documentation | Page 5 

|Platform|Storage Model|Other Apps Access?|
|---|---|---|
|Android|Application-private SQLite database|Normally no|
|iOS|Application sandbox SQLite database|Normally no|



|Practice|Implementation|
|---|---|
|JavaScript linting|Use ESLint rules appropriate to the project.|
|No eval|Do not use eval() or equivalent dynamic code execution.|
|No dynamic SQL|Use repository parameter binding.|
|Dependency pinning|Commit lockfile and use reproducible CI installs.|
|No secrets in source|Do not store credentials, private keys, or future API secrets<br>in the repository.|
|Production logging|Remove/debug-gate raw packet and sensitive telemetry<br>logging.|
|Error abstraction|Show user-safe errors while retaining technical codes for<br>diagnostics.|
|Input validation|Validate UI and BLE data before persistence/analysis.|



|Protection|Platform / Approach|
|---|---|
|App sandboxing|Android/iOS application sandbox|
|Device encryption|Use OS-provided encryption when the device is configured<br>for it|
|Screen lock|OS-level PIN/password/biometric protection|
|Database access|Private application storage|
|Debug builds|Do not treat development builds as production-secure|



|Principle|AquaSmart MVP Approach|
|---|---|
|Data minimization|Store only data required for monitoring, usage, leak history,<br>and settings.|
|Purpose limitation|Use telemetry for water monitoring, usage calculation, and<br>leak analysis.|
|Local processing|Keep core processing on-device.|
|User control|Provide settings for alerts, alarm sound, units, and sensor<br>configuration.|
|Deletion|Provide a documented local-data deletion/reset path;<br>uninstall behaviour depends on OS.|
|Third-party sharing|No intentional third-party sharing in the local-only MVP.|
|Transparency|Explain local storage and BLE permissions in<br>Settings/onboarding.|



|Test Area|Example Tests|
|---|---|
|SQL safety|Names/settings containing quotes, special characters, and<br>long inputs.|
|BLE validation|Malformed, truncated, invalid, duplicate, out-of-order, and<br>impossible packets.|
|Connection security|Unexpected device, disconnect/reconnect, repeated<br>connection attempts.|



AquaSmart — Combined Project Documentation | Page 6 

|Test Area|Example Tests|
|---|---|
|Permission handling|Bluetooth permission denied/revoked and retry.|
|Storage isolation|Verify data is stored only in app-private locations.|
|Logging|Confirm raw telemetry and sensitive local data are not<br>exposed in production logs.|
|Dependency security|Run npm audit and review dependency updates.|
|Alarm safety|Audio failure, app backgrounding, disconnect during alarm,<br>persisted active event.|
|Simulation isolation|Ensure development controls are not accidentally exposed<br>in normal production navigation.|



AquaSmart — Combined Project Documentation | Page 7 

#### **Document 12: Testing Strategy** 

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App 

Document ID: TEST-AS-01 

Status: Draft 

Date: 2026-09-07 

Track: Application Development / Mobile IoT 

#### **1. Testing Goals** 

#### **2. Testing Stack** 

#### **3. Unit Tests** 

##### **3.1 Repository Logic Tests** 

File: __tests__/repositories/FlowReadingRepository.test.js 

File: __tests__/repositories/UsageRepository.test.js 

File: __tests__/repositories/LeakEventRepository.test.js 

##### **3.2 Telemetry Parsing and Validation Tests** 

File: __tests__/services/TelemetryParser.test.js 

Note: The final BLE packet structure, UUIDs, byte order, scaling, and status values remain hardware-dependent and must be finalized when the physical sensor is selected. Tests should use a documented test fixture rather than assuming an unconfirmed production protocol. 

##### **3.3 Water Usage Calculation Tests** 

File: __tests__/services/UsageCalculationService.test.js 

##### **3.4 Leak Detection Tests** 

File: __tests__/services/LeakDetectionService.test.js 

The continuous suspicious-flow duration is a controlled OJT test condition, not a universal definition of every real-world leak. The detector should be implemented as configurable pattern/state-based logic so that thresholds and durations can be tuned after real sensor validation. 

##### **3.5 Validation Tests** 

File: __tests__/utils/validation.test.js 

##### **3.6 Store Tests** 

File: __tests__/stores/aquaSmartStore.test.js 

#### **4. Component Tests (React Native Testing Library)** 

File: __tests__/components/FlowDashboard.test.js 

File: __tests__/components/UsageChart.test.js 

File: __tests__/components/LeakAlarm.test.js 

File: __tests__/components/BLEConnection.test.js 

#### **5. Integration Tests** 

AquaSmart — Combined Project Documentation | Page 1 

File: __tests__/integration/TelemetryFlow.test.js 

Tests the integration of BLE data handling, telemetry parsing/validation, usage calculation, repositories, leak analysis, and state updates using mocked BLE data and a test SQLite database. 

#### **6. End-to-End Tests (Detox)** 

Target: Android Emulator and, when available, a representative physical Android device. The production application connects to the physical BLE water-flow sensor. For OJT automation, BLE input may be supplied through a controlled simulator/mock because physical sensor hardware is not available. 

File: e2e/aquasmart.test.js 

#### **7. Accessibility Testing** 

#### **8. Performance Testing** 

#### **9. Test Coverage Targets** 

#### **10. Test Commands** 

The exact scripts may be adjusted to the final repository configuration. Recommended commands: 

- npm test 

- npm run test:coverage 

- npm run test:watch 

- npx detox build --configuration android.emu 

- npx detox test --configuration android.emu 

#### **11. Testing Conventions** 

#### **12. Test Data and Scenario Matrix** 

#### **13. Defect Severity and Release Gates** 

- All Critical and High defects must be resolved or formally accepted before an MVP demonstration/release. 

- Core E2E tests must pass before a release candidate is produced. 

- Database migrations must pass against a clean database and representative prior versions. 

- Leak detection tests must pass for normal, intermittent, continuous suspicious, invalid-data, and recovery scenarios. 

- A failed physical-sensor test must not be reported as passed using simulator results; simulator results are clearly labeled as development/testing evidence. 

#### **14. Testing Limitations and Deferred Validation** 

- A physical BLE water-flow sensor is not available for the OJT, so hardware behavior, radio reliability, sensor calibration, and final packet protocol cannot be fully validated during the OJT. 

- The BLE simulator is a development/testing substitute only. It must not be represented as the production sensing architecture. 

- Exact BLE UUIDs, payload fields, scaling factors, byte order, sequence behavior, and sensor error codes remain TBD until the physical sensor is selected. 

- Real-world leak detection accuracy requires field testing with controlled and naturally occurring usage patterns. OJT tests can demonstrate the algorithm and alert pipeline but cannot prove universal leak-detection accuracy. 

AquaSmart — Combined Project Documentation | Page 2 

- Performance targets are engineering targets and should be re-measured on representative Android hardware before final release. 

#### **15. Summary** 

AquaSmart testing is organized across unit, component, integration, accessibility, performance, and end-to-end layers. The highest-risk areas—BLE telemetry integrity, water-usage calculation, leak detection, alarm behavior, SQLite persistence, and reconnect/recovery—receive explicit scenario-based coverage. The physical BLE water-flow sensor remains the production input boundary, while simulator/mock telemetry is used only where controlled test data is needed during OJT development. 

|Goal|Target|
|---|---|
|Repository and data-access coverage|> 90% line coverage|
|Leak detection logic coverage|100% branch coverage for critical decision paths|
|Telemetry parser and validation coverage|> 90% line coverage; malformed-input cases included|
|Component render coverage|> 70%|
|Zero regressions on core flows|Automated tests for all MVP Must Have features|
|SQLite migration safety|All migrations tested from clean and representative prior<br>schemas|
|BLE integration|Integration tests with mocked BLE peripheral data and<br>disconnect/error cases|
|Alarm reliability|Critical leak-alarm scenarios covered by unit, integration,<br>and E2E tests|



|Layer|Framework / Tool|What It Tests|
|---|---|---|
|Unit|Jest|Repository logic, telemetry parsing,<br>validation, usage calculation, leak<br>detection, Zustand/store actions|
|Component|React Native Testing Library (RNTL)|Component rendering, user<br>interactions, accessibility|
|Integration|Jest + mocked BLE + Expo SQLite test<br>database|BLE-to-parser-to-repository integration<br>and database behavior|
|E2E|Detox|Full Android application flows on<br>emulator/device|
|Performance|React Native performance tooling +<br>timing logs|Startup, navigation, list rendering,<br>database operations, dashboard<br>updates|
|BLE|Mock BLE peripheral / simulator test<br>data|Telemetry scenarios, malformed<br>packets, missing/duplicate/out-of-order<br>data, disconnects|



|Test ID|Description|Input|Expected Output|
|---|---|---|---|
|UT-FR-001|Insert valid flow reading|Valid sensor ID, timestamp,<br>flow rate|Reading stored with correct<br>fields|
|UT-FR-002|Reject invalid flow reading|Impossible/invalid flow value|Validation error; reading not<br>stored|
|UT-FR-003|List readings by time range|Start/end timestamps|Only readings inside<br>requested range returned|
|UT-FR-004|Preserve sequence<br>metadata|Reading with sequence<br>number|Sequence value stored and<br>returned correctly|



AquaSmart — Combined Project Documentation | Page 3 

|Test ID|Description|Input|Expected Output|
|---|---|---|---|
|UT-FR-005|Filter by sensor|Multiple sensors|Only selected sensor<br>readings returned|
|Test ID|Description|Input|Expected Output|
|UT-UR-001|Save calculated usage<br>record|Valid usage interval|Usage record persisted|
|UT-UR-002|Daily usage aggregation|Multiple readings in one day|Correct daily total|
|UT-UR-003|Hourly usage aggregation|Readings spanning hours|Correct hourly buckets|
|UT-UR-004|Weekly usage aggregation|Seven-day dataset|Correct weekly totals|
|Test ID|Description|Input|Expected Output|
|UT-LR-001|Create leak event|Valid suspected-leak event|Event saved with active<br>status|
|UT-LR-002|Resolve leak event|Active event ID|Event marked resolved with<br>end time|
|UT-LR-003|List leak history|Multiple events|Events returned in<br>newest-first order|
|UT-LR-004|Retrieve event details|Known event ID|Correct event and<br>associated details returned|
|Test ID|Description|Input|Expected|
|UT-TEL-001|Parse valid telemetry|Valid protocol payload|Normalized flow reading<br>returned|
|UT-TEL-002|Reject malformed packet|Truncated/invalid payload|Parse error returned|
|UT-TEL-003|Reject impossible flow|Out-of-range flow value|Validation failure|
|UT-TEL-004|Handle missing packet fields|Incomplete payload|Invalid reading rejected|
|UT-TEL-005|Detect duplicate sequence|Repeated sequence number|Duplicate identified and not<br>double-counted|
|UT-TEL-006|Detect out-of-order data|Older sequence/timestamp|Reading marked or handled<br>as out-of-order|
|UT-TEL-007|Preserve data quality|Valid/invalid quality<br>metadata|Quality status propagated|
|Test ID|Description|Input|Expected|
|UT-USE-001|Calculate interval usage|Flow rate + elapsed time|Correct liters calculated|
|UT-USE-002|Zero-flow interval|0 L/min over interval|0 liters|
|UT-USE-003|Multiple readings|Sequential flow samples|Correct accumulated usage|
|UT-USE-004|Ignore invalid reading|Invalid sample in sequence|Invalid sample excluded<br>according to policy|
|UT-USE-005|Handle time gap|Large sample interval|Gap handled according to<br>defined<br>interpolation/aggregation<br>rule|
|Test ID|Description|Input|Expected|
|UT-LD-001|Normal short flow|Normal flow followed by stop|No leak event|



AquaSmart — Combined Project Documentation | Page 4 

|Test ID|Description|Input|Expected|
|---|---|---|---|
|UT-LD-002|Continuous suspicious flow|Continuous suspicious flow<br>for configured OJT test<br>duration|Leak suspicion raised|
|UT-LD-003|Intermittent flow|Repeated short flow bursts|No false leak when pattern<br>remains within configured<br>normal behavior|
|UT-LD-004|Sudden high flow|Abrupt high-flow sample|High-flow condition<br>evaluated without<br>immediately assuming a leak|
|UT-LD-005|Leak persists|Suspicious flow remains<br>active|Active leak event<br>maintained; repeated alerts<br>suppressed according to<br>policy|
|UT-LD-006|Flow stops|Leak flow returns to<br>normal/zero|Leak event can transition to<br>resolved|
|UT-LD-007|Sensor error during<br>suspicion|Invalid/error telemetry|Detection pauses or<br>degrades safely; sensor<br>error is recorded|
|UT-LD-008|Restart recovery|Active event stored before<br>app restart|Event state restored<br>consistently|
|Test ID|Description|Input|Expected|
|UT-VAL-001|Invalid sensor identifier<br>rejected|Empty/invalid ID|Validation error|
|UT-VAL-002|Negative flow rejected|-5 L/min|Validation error|
|UT-VAL-003|Valid zero flow accepted|0 L/min|true|
|UT-VAL-004|Timestamp validation|Malformed/future-invalid<br>timestamp|Validation error|
|UT-VAL-005|Settings validation|Invalid threshold/duration|Validation error|



|Test ID|Description|Expected|
|---|---|---|
|UT-ST-001|BLE connection state updates|Connected/disconnected state is<br>correct|
|UT-ST-002|Latest telemetry updates|Dashboard receives latest valid reading|
|UT-ST-003|Leak alarm state updates|Active alarm state reflected in UI store|
|UT-ST-004|Stop alarm clears active playback state|Alarm playback state reset|
|UT-ST-005|Sensor unavailable handled|UI exposes disconnected/unavailable<br>state without crash|
|Test ID|Description||
|CT-FD-001|Renders current flo|w rate correctly|
|CT-FD-002|Renders current us|age summary|
|CT-FD-003|Shows connected s|ensor state|
|CT-FD-004|Shows disconnecte|d state clearly|
|CT-FD-005|Updates when new|telemetry arrives|
|CT-FD-006|Does not crash whe|n no reading is available|



AquaSmart — Combined Project Documentation | Page 5 

|Test ID|Description|
|---|---|
|CT-UC-001|Renders hourly/daily/weekly usage data|
|CT-UC-002|Switching time range requests correct dataset|
|CT-UC-003|Empty dataset shows an informative empty state|
|CT-UC-004|Large values remain readable without layout failure|



|Test ID|Description|
|---|---|
|CT-LA-001|Active leak state is visually prominent|
|CT-LA-002|Stop/mute control calls the correct action|
|CT-LA-003|Leak details are accessible to screen readers|
|CT-LA-004|Alarm state does not depend only on color|
|Test ID|Description|
|CT-BLE-001|Connect action starts connection process|
|CT-BLE-002|Connected state shows sensor information|
|CT-BLE-003|Disconnect/error state is presented clearly|
|CT-BLE-004|Retry action can restart connection|



|Test ID|Description|Steps|
|---|---|---|
|IT-001|Normal telemetry flow|Connect→receive valid readings→<br>parse→validate→store→update<br>dashboard|
|IT-002|Usage accumulation|Receive sequential readings→<br>calculate interval usage→save usage<br>→verify totals|
|IT-003|Leak detection flow|Receive configured suspicious-flow<br>pattern→detector evaluates pattern→<br>leak event created→alarm state<br>activated|
|IT-004|Leak resolution|Active leak→valid flow stops/returns<br>normal→event resolved→history<br>updated|
|IT-005|BLE disconnect recovery|Connected→disconnect→error state<br>→reconnect→telemetry resumes|
|IT-006|Invalid packet handling|Malformed payload→parser rejects→<br>error logged→app continues<br>processing later valid packets|
|IT-007|Duplicate packet handling|Duplicate reading→duplicate detected<br>→usage is not double-counted|
|IT-008|Out-of-order packet handling|Older packet arrives→ordering policy<br>applied→aggregates remain<br>consistent|
|IT-009|SQLite migration|Run migration on empty/representative<br>DB→required tables/indexes exist|
|IT-010|Crash recovery|Persist active leak/event state→<br>restart app→recover state without<br>corrupting history|



AquaSmart — Combined Project Documentation | Page 6 

|Test ID|Flow|Steps|
|---|---|---|
|E2E-001|First launch|Launch→permissions/settings→<br>continue→Dashboard|
|E2E-002|Connect sensor|Open BLE screen→scan/connect to<br>available test sensor→connected<br>state shown|
|E2E-003|Live flow monitoring|Connect→receive flow data→<br>dashboard shows current rate and<br>usage|
|E2E-004|Usage history|Generate/store readings→open<br>Usage→hourly/daily/weekly chart<br>displays data|
|E2E-005|Leak alarm|Inject controlled suspicious-flow<br>scenario→leak alert appears→alarm<br>activates→acknowledge/stop→event<br>stored|
|E2E-006|Leak history|Open Leak History→active/resolved<br>events listed→open detail|
|E2E-007|Settings|Change leak detection settings→save<br>→new settings persist after restart|
|E2E-008|Offline/local operation|Disable network→monitor stored<br>data/history→core local features<br>continue working|
|E2E-009|BLE disconnect|Connected sensor→disconnect→<br>warning shown→reconnect→<br>monitoring resumes|
|E2E-010|Invalid telemetry|Inject invalid/malformed test data→<br>error handled without app crash|



|Tool / Test|Pass Criteria|
|---|---|
|Android TalkBack|All interactive elements have meaningful labels and logical<br>navigation order|
|Android font scale|At large supported font sizes, no critical text or controls are<br>clipped|
|Color/grayscale test|Leak and connection states remain understandable without<br>relying only on color|
|Tap target audit|Interactive controls meet the project's minimum touch-target<br>guideline|
|Alarm accessibility|Leak alarm message and state are exposed through<br>accessible text/status announcements|



|Test|Target|Tool|
|---|---|---|
|App cold start|< 2 seconds target on representative<br>Android hardware|Timing measurement|
|Dashboard update responsiveness|No visible jank during normal telemetry<br>updates|React Native performance tooling|
|Usage chart rendering|Smooth interaction with representative<br>history dataset|Performance profiler|
|Leak alarm activation|Alert UI responds promptly after<br>detection decision|Custom timing log|



AquaSmart — Combined Project Documentation | Page 7 

|Test|Target|Tool|
|---|---|---|
|SQLite: insert reading|< 10 ms target for representative local<br>insert|Repository timing log|
|SQLite: history query|< 50 ms target for representative<br>history dataset|Repository timing log|
|BLE reconnect|Reconnect completes within an<br>acceptable configured timeout|BLE integration timing log|



|Layer|Coverage Target|
|---|---|
|repositories/|> 90% line coverage|
|services/ (leak detection + telemetry)|100% branch coverage for critical decision logic|
|utils/|> 90%|
|stores/|> 80%|
|components/|> 70%|
|E2E core flows|100% of MVP Must Have flows represented|



|Convention|Detail|
|---|---|
|Test file location|Use a consistent __tests__/ structure under the project test<br>directory|
|Mock BLE|Use deterministic mocked peripheral data for unit/integration<br>tests; do not treat the simulator as a production dependency|
|Mock SQLite|Use an isolated test database or controlled SQLite mock for<br>repository tests|
|Factory functions|Use factories such as createMockSensor(),<br>createMockFlowReading(), createMockLeakEvent()|
|Deterministic telemetry|Scenario fixtures should have known timestamps, flow<br>values, sequence numbers, and expected outcomes|
|No flaky tests|Avoid arbitrary sleeps; use deterministic waits/events and fix<br>timing issues rather than increasing retries|
|Hardware boundary|Keep hardware-specific UUIDs/protocol details isolated so<br>tests can use fixtures until the physical sensor specification<br>is finalized|
|Ground truth|Scenario-based simulator data should include expected<br>detection/usage outcomes so algorithm tests can compare<br>actual vs expected behavior|



|Scenario|Telemetry Pattern|Expected Result|
|---|---|---|
|Normal usage|Short flow followed by zero flow|Usage recorded; no leak|
|Continuous suspicious flow|Sustained configured suspicious flow|Leak suspicion/alarm according to<br>configured policy|
|Intermittent usage|Repeated short flow bursts|Usage recorded; avoid false leak|
|Sudden high flow|Abrupt high-rate reading|High-flow condition evaluated; no<br>automatic leak assumption|
|No flow|Repeated zero-flow readings|No leak; connection remains healthy|
|Sensor error|Explicit error/invalid quality status|Reading rejected/degraded; error<br>surfaced|



AquaSmart — Combined Project Documentation | Page 8 

|Scenario|Telemetry Pattern|Expected Result|
|---|---|---|
|Missing packet|Expected sequence gap|Gap detected/recorded; no duplicate<br>usage|
|Duplicate packet|Repeated sequence/timestamp|Duplicate ignored or marked; no double<br>counting|
|Out-of-order packet|Older reading arrives after newer one|Ordering policy applied; aggregates<br>remain safe|
|Impossible flow|Value outside configured sensor range|Rejected as invalid|
|BLE disconnect|Connection lost|Disconnected state shown; reconnect<br>path available|
|Severity|Example|Release Rule|
|Critical|False leak alarm that cannot be<br>stopped, data corruption, app crash<br>during core monitoring|Must fix before release|
|High|Leak event not recorded, major BLE<br>connection failure, incorrect usage<br>totals|Must fix before MVP release|
|Medium|Non-critical chart/UI issue, recoverable<br>settings issue|Fix or explicitly accept before release|
|Low|Minor visual or copy issue|Can be deferred if documented|



AquaSmart — Combined Project Documentation | Page 9 

#### **Document 13: CI/CD Pipeline** 

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App 

Document ID: CICD-AS-01 

Status: Draft 

Date: 2026-09-07 

Track: Application Development / Mobile IoT 

#### **1. Pipeline Overview** 

Developer ↓ git push feature branch GitHub ↓ Pull Request → main GitHub Actions CI Pipeline III ESLint III Unit + Component Tests (Jest + RNTL) III Integration Tests III Security Scan (npm audit / dependency scan) III Expo/EAS build validation ↓ All required checks green + PR approved → merge to main GitHub Actions CD Pipeline III EAS production build III Internal distribution / release channel 

- The pipeline is designed for the AquaSmart React Native + Expo JavaScript application. 

- The production data architecture remains the physical BLE water-flow sensor → Android AquaSmart app. CI/CD validates the software; it does not replace physical sensor validation. 

- BLE simulator/mock telemetry is used only for automated and development testing where deterministic BLE input is required. 

#### **2. Branching Strategy** 

#### **3. GitHub Actions Workflows** 

##### **Workflow 1: CI (Pull Request)** 

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

jobs: quality: runs-on: ubuntu-latest steps: - checkout - setup Node.js - npm ci - npm run lint - npm run test:coverage integration: runs-on: ubuntu-latest needs: quality steps: - checkout - setup Node.js - npm ci - npm run test:integration security: runs-on: ubuntu-latest needs: quality steps: - checkout - setup Node.js - npm ci - npm audit --audit-level=high build-check: runs-on: ubuntu-latest needs: [quality, integration, security] steps: - checkout - setup Node.js - npm ci - Expo/EAS build configuration validation 

##### **Workflow 2: CD (Build on merge to main)** 

File: .github/workflows/deploy.yml 

Trigger: push to main 

AquaSmart — Combined Project Documentation | Page 1 

- Install dependencies from the lockfile. 

- Authenticate to Expo/EAS using a GitHub encrypted secret. 

- Create the configured Android build. 

- Optionally create an iOS build if iOS distribution is included in the release plan and Apple credentials are available. 

- Publish the resulting build to the selected internal distribution channel. 

For the OJT, Android should be the primary release target because AquaSmart's real BLE sensor connection is intended for Android. 

#### **4. EAS Build Profiles** 

File: eas.json 

{ "build": { "development": { "developmentClient": true, "distribution": "internal", "android": { "buildType": "apk" } }, "internal": { "distribution": "internal", "android": { "buildType": "apk" } }, "production": { "autoIncrement": true, "android": { "buildType": "app-bundle" } } } } 

- development: used for developer testing and debugging. 

- internal: used for OJT/internal tester distribution. 

- production: used for a release build when the project is ready for production distribution. 

- Exact EAS settings should be finalized with the actual Expo project configuration. 

#### **5. Local Development Setup** 

- npm install 

- npx expo start 

- npx expo start --android 

- npm test 

- npm run lint 

- npm run test:coverage 

- npx expo start --clear 

A physical Android device should be used for real BLE testing when the selected water-flow sensor is available. Emulator/simulator testing can use controlled mock/simulated telemetry. 

#### **6. Pre-commit Hooks** 

Recommended tools: Husky + lint-staged 

Example package configuration: 

"lint-staged": { "*.{js,jsx}": ["eslint --fix", "prettier --write"], "*.json": ["prettier --write"] } 

Recommended pre-commit checks: 

- Run lint-staged formatting/lint fixes. 

- Run ESLint on changed JavaScript files. 

- Optionally run a fast unit-test subset. 

- Keep full integration/E2E tests in CI rather than slowing every commit. 

#### **7. Code Quality Tools** 

#### **8. Secrets Management** 

- Do not commit tokens, signing keys, service-account JSON files, BLE credentials, or private certificates to Git. 

AquaSmart — Combined Project Documentation | Page 2 

- A local .env file should not be committed. If environment configuration is introduced later, use .env.example for non-secret variable names only. 

- The MVP is local-first and does not require a backend URL or application API key. 

#### **9. Dependency Scanning** 

- Only use additional scanners such as Trivy if the project introduces artifacts or filesystems where that scan provides meaningful coverage. 

- Dependency findings should be triaged rather than blindly ignored. 

#### **10. Build Artifact Management** 

Exact retention periods should be configured after the project's GitHub/EAS plan and OJT submission requirements are known. 

#### **11. Release Process** 

1. Create release/vX.Y.Z from develop when a release candidate is ready. 

2. Update the application version/build number according to the Expo/EAS configuration. 

3. Open a pull request from release/vX.Y.Z to main. 

4. CI must pass: lint, tests, security checks, and build validation. 

5. Obtain review/approval and merge to main. 

6. CD automatically starts the configured EAS build. 

7. Distribute the Android build to internal testers. 

8. Perform release-candidate smoke tests, including BLE connection, live flow monitoring, usage calculation, leak alarm, history, and recovery. 

9. Record known limitations, especially any tests that could not be performed with the physical sensor. 

#### **12. CI/CD Quality Gates** 

- A simulator-only passing result must not be described as physical sensor validation. 

- A release may be blocked when a critical defect affects leak alarming, telemetry integrity, data persistence, or application stability. 

#### **13. OJT Development and Hardware Boundary** 

- During OJT development, deterministic BLE simulator/mock data may be injected into the application to test telemetry parsing, usage calculation, leak detection, alarms, and error handling. 

- In real use, AquaSmart connects to the physical BLE water-flow sensor; the simulator is not part of the production sensing path. 

- The final BLE service UUID, characteristic UUID, payload structure, scaling, and device-specific pairing behavior must be incorporated into the CI-tested code once the physical sensor specification is finalized. 

- Hardware-in-the-loop testing should be added later when the physical sensor is available. 

#### **14. Summary** 

The AquaSmart CI/CD pipeline provides automated quality checks for the JavaScript React Native application before code reaches the main branch, and controlled EAS builds for internal distribution after approved merges. The pipeline prioritizes automated testing of BLE telemetry handling, SQLite persistence, usage calculation, leak detection, alarms, and core UI behavior. Physical sensor validation remains a separate hardware-testing activity; simulated BLE data is used only to make software tests deterministic during OJT development. 

AquaSmart — Combined Project Documentation | Page 3 

|Branch|Purpose|Protected|
|---|---|---|
|main|Production-ready code|Yes — PR required + CI pass|
|develop|Integration branch for ongoing OJT<br>development|Yes|
|feature/*|Individual AquaSmart features|No|
|fix/*|Bug fixes|No|
|release/*|Release candidate stabilization|Yes|
|Tool|Purpose|Configuration|
|ESLint|Linting JavaScript + React Native code|eslint.config.js / project ESLint<br>configuration|
|Prettier|Consistent code formatting|.prettierrc|
|React Hooks lint rules|Detect incorrect hook dependencies<br>and common hook mistakes|ESLint configuration|
|Jest|Unit and integration testing|jest.config.js / package configuration|
|React Native Testing Library|Component and interaction testing|Test files under __tests__/|



|Secret|Stored In|
|---|---|
|EXPO_TOKEN|GitHub Actions encrypted secret|
|Android/Google Play credentials, if store submission is<br>enabled|GitHub Actions encrypted secret or approved secure<br>credential mechanism|
|Apple credentials, if iOS distribution is enabled|GitHub Actions encrypted secrets / EAS-managed<br>credentials|



|Tool|How Used|
|---|---|
|npm audit|Run in CI; review/fail on high-risk vulnerabilities according to<br>release policy|
|GitHub Dependabot|Automated dependency update/security PRs|
|Lockfile review|Keep package-lock.json synchronized and review<br>unexpected dependency changes|



|Artifact|Where Stored|Retention / Policy|
|---|---|---|
|Android internal APK|EAS/internal distribution|Keep according to OJT release policy|
|Android production AAB|EAS build storage / release system|Retain release artifacts according to<br>project policy|
|Coverage report|GitHub Actions artifact|Short-term CI retention|
|Test reports/logs|GitHub Actions artifact|Short-term CI retention|



|Gate|Required Result|
|---|---|
|Lint|No blocking lint errors|
|Unit tests|All required tests pass|
|Integration tests|All critical data/BLE/database integration tests pass|
|Security scan|No unaccepted high/critical vulnerability|
|Build validation|Expo/EAS configuration produces a valid build or validation<br>result|



AquaSmart — Combined Project Documentation | Page 4 

|Gate|Required Result|
|---|---|
|E2E smoke tests|Core MVP flows pass before release candidate|
|Database migrations|Migration tests pass|
|Leak detection regression suite|Normal, intermittent, suspicious continuous flow, invalid<br>telemetry, and recovery scenarios pass|



AquaSmart — Combined Project Documentation | Page 5 

#### **Document 14: Observability Design** 

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App 

Document ID: OBS-AS-01 

Status: Draft 

Date: 2026-09-07 

Track: Application Development / Mobile IoT 

#### **1. Observability Philosophy for a Mobile IoT App** 

AquaSmart is primarily a local-first mobile application. Observability therefore focuses on visibility into BLE connectivity, telemetry processing, leak detection, SQLite performance, application errors, and UI performance rather than traditional server-side monitoring. 

- Development-time visibility — understand BLE, telemetry, database, store, and UI behavior during development/testing. 

- Crash detection — identify application errors and recover gracefully where possible. 

- Performance monitoring — identify slow SQLite queries, excessive rendering, memory growth, and dashboard update bottlenecks. 

- BLE reliability monitoring — observe connection, disconnection, reconnect, packet validation, and sensor-error conditions. 

- Leak-detection visibility — record enough local diagnostic information to understand why a leak state was raised or resolved. 

- Privacy-first operation — MVP observability should avoid collecting unnecessary personal or household data. 

In MVP, no mandatory third-party analytics platform is required. Diagnostic logging is primarily development/local, with future opt-in crash reporting considered separately. 

#### **2. Development Observability** 

##### **2.1 React Native Development Tools** 

Network inspection should remain secondary because the MVP is designed around local SQLite data and direct BLE communication rather than a required backend. 

##### **2.2 Zustand Logger Middleware (Development Only)** 

Important AquaSmart state transitions can be logged during development, for example: 

// stores/aquaSmartStore.js import { create } from 'zustand'; import { devtools, subscribeWithSelector } from 'zustand/middleware'; export const useAquaSmartStore = create()( devtools( subscribeWithSelector((set, get) => ({ // ... store implementation })), { name: 'AquaSmartStore', enabled: __DEV__ } ) ); 

- Useful events include sensor connection changes, latest valid telemetry, alarm activation/deactivation, and settings updates. 

- Sensitive or unnecessary household information should not be placed into debug logs. 

- Verbose state logging should remain disabled in production builds. 

##### **2.3 SQLite Query Timing** 

Repository queries should have a development-only timing wrapper: 

export async function timedQuery(name, queryFn) { if (!__DEV__) return queryFn(); const start = performance.now(); const result = await queryFn(); const elapsed = performance.now() - start; if (elapsed > 10) { console.warn(`[SQLite] Slow query: ${name} took ${elapsed.toFixed(2)}ms`); } else { console.debug(`[SQLite] ${name}: ${elapsed.toFixed(2)}ms`); } return result; } 

- Track representative operations such as inserting flow readings, aggregating usage, listing leak history, and loading dashboard summaries. 

AquaSmart — Combined Project Documentation | Page 1 

- The 10 ms warning threshold is a development target and can be tuned after measuring on representative Android hardware. 

##### **2.4 BLE and Telemetry Diagnostics** 

The exact BLE UUIDs and packet fields are hardware-dependent and are not assumed here. Once the physical sensor is selected, the final protocol diagnostics should be added without exposing unnecessary raw payloads. 

##### **2.5 React Native Performance Monitoring** 

Targets are engineering goals, not claims of measured production performance. 

#### **2.6 Error Boundary** 

Application screens should be protected by an error boundary so an unexpected JavaScript rendering error produces a recoverable fallback instead of an unusable blank screen. 

class ErrorBoundary extends React.Component { componentDidCatch(error, info) { console.error('[ErrorBoundary]', error, info); } render() { if (this.state?.hasError) { return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />; } return this.props.children; } } 

- The fallback should provide a clear retry/reload action. 

- Errors should be logged without exposing internal stack traces to normal users. 

- Persistent BLE/sensor errors should use the sensor connection/error UI rather than the generic application error boundary. 

#### **3. Logging** 

##### **3.1 Log Levels** 

##### **3.2 Production Log Policy** 

- Do not emit continuous telemetry streams into production console logs. 

- Do not log personal information or unnecessary household usage history. 

- Avoid logging complete BLE payloads unless required for a controlled diagnostic build. 

- Production error reporting, if introduced later, should be opt-in and privacy-reviewed. 

#### **4. Error Reporting** 

##### **4.1 MVP** 

- No mandatory third-party analytics SDK. 

- Development builds expose runtime errors through Expo/React Native development tooling. 

- Critical local errors are represented in the app through recoverable error states where possible. 

##### **4.2 Post-MVP** 

- An opt-in crash/error reporting service may be evaluated if real users require remote diagnostics. 

- Only the minimum diagnostic information necessary should be collected. 

- The privacy notice and data handling policy should be updated before enabling remote reporting. 

#### **5. Performance Monitoring Checklist** 

##### **5.1 UI and Animation Performance** 

##### **5.2 SQLite Performance** 

AquaSmart — Combined Project Documentation | Page 2 

These are initial engineering targets and must be validated on representative physical Android hardware. 

#### **6. Device Testing Matrix** 

iOS may be used for general React Native UI development if the project configuration supports it, but Android is the primary hardware target for AquaSmart because the production use case requires BLE communication with the physical water-flow sensor. 

#### **7. Accessibility Audit** 

Accessibility checks should be performed before the final OJT milestone/release candidate. 

#### **8. Build Size Monitoring** 

Exact size thresholds should be set after the first stable build establishes a baseline. Large increases should trigger dependency and asset review. 

Recommended CI check: 

```
npx expo export # Inspect generated output size and compare with the project baseline
```

#### **9. BLE Reliability and Leak Detection Observability** 

For the OJT, scenario-based simulator data can provide ground truth for software validation. This does not replace field validation with a physical sensor. 

#### **10. Observability Data Retention and Privacy** 

- Operational application data remains in the local SQLite database according to the database/data lifecycle design. 

- Development logs should be ephemeral and should not become a second uncontrolled storage location for household usage data. 

- Diagnostic logs should avoid names, addresses, precise household identifiers, or other unnecessary personal information. 

- If remote crash reporting is introduced, retention, consent, access, and deletion requirements must be defined before enabling it. 

#### **11. Summary** 

AquaSmart observability focuses on the mobile application's most important runtime boundaries: physical BLE sensor connectivity, telemetry integrity, water-usage calculation, leak detection, alarm behavior, SQLite performance, UI responsiveness, and recoverability. Development-only diagnostics provide detailed visibility while the MVP remains privacy-focused and local-first. The BLE simulator is used only for controlled development/testing and is not treated as part of the production sensing architecture. 

|Tool / Area|What It Shows|
|---|---|
|React DevTools|Component tree, props, state, and unnecessary re-renders|
|React Native Dev Menu / performance tools|JS/UI frame rate and runtime performance|
|Expo development tooling|Runtime errors, development logs, and build/debug<br>information|
|SQLite inspection/debugging|Tables, records, indexes, and representative local queries|
|Zustand development tooling/logging|Important store transitions such as BLE state and alarm<br>state|
|Diagnostic Event|Information to Record|
|BLE connection|Connection attempt result, connection state, and timing|
|BLE disconnection|Reason/category if available and reconnect attempt|



AquaSmart — Combined Project Documentation | Page 3 

|Diagnostic Event|Information to Record|
|---|---|
|Telemetry received|Timestamp, validated flow value, sequence metadata, and<br>data-quality status|
|Invalid telemetry|Validation category/error code; avoid dumping raw sensitive<br>data|
|Duplicate/out-of-order data|Sequence/order condition and handling decision|
|Sensor error|Sensor error/status category and recovery state|
|Leak detection decision|Detection state/result, configured rule identifier, and event<br>ID where applicable|



|Metric|Target / Watch|
|---|---|
|JS Frame Rate|Aim for smooth 60 fps interaction; investigate sustained<br>drops|
|UI Frame Rate|Aim for smooth native rendering during navigation, charts,<br>and alarm UI|
|Memory / RAM|Watch for unexpected growth during long monitoring<br>sessions|
|JS Heap|Investigate sustained growth that may indicate retained<br>objects/listeners|
|BLE update processing|Avoid unnecessary UI/store updates for every redundant or<br>invalid packet|



|Level|When Used|Output|
|---|---|---|
|console.error|Repository failures, BLE failures,<br>database errors, unexpected<br>application errors|Development; future opt-in error<br>reporting|
|console.warn|Slow queries, permission issues,<br>recoverable sensor/data problems|Development|
|console.debug|Query timing, detailed<br>telemetry-processing diagnostics,<br>development store transitions|Development only|
|console.info|Major lifecycle events such as<br>database migration completion or<br>sensor connection|Development only|
|Check|Target|Pass?|
|Dashboard live-flow update|No visible jank during normal telemetry<br>updates||
|Usage chart rendering|Smooth range changes and chart<br>interaction||
|Leak alarm presentation|Prompt UI response when detection<br>event is raised||
|Tab/navigation transitions|Smooth transition without noticeable<br>frame drops||
|Leak history scrolling|Smooth with representative history size||
|Query / Operation|Target||
|Flow reading insert|< 10 ms target on r|epresentative device|



AquaSmart — Combined Project Documentation | Page 4 

|Query / Operation|Target||
|---|---|---|
|Dashboard summary query|< 50 ms target||
|Usage aggregation|< 50 ms target for r|epresentative dataset|
|Leak history list|< 50 ms target||
|Device|OS|Purpose|
|Android Emulator|Supported Android API level|Primary UI/E2E development and<br>deterministic simulator/mock telemetry|
|Representative physical Android device|Android version supported by final app|Real BLE connection, performance,<br>permissions, alarm, and persistence<br>testing|
|Lower/mid-range Android device|Supported Android version|Performance and memory validation|
|Audit Item|Tool / Method|Pass Criteria|
|TalkBack navigation|Android accessibility tools|Interactive elements announced<br>correctly and in logical order|
|Font scaling|Android accessibility settings|No critical clipping or unusable controls<br>at supported large text sizes|
|Color dependence|Manual review / grayscale|Leak, connection, and error states<br>understandable without color alone|
|Touch targets|Manual UI audit|Controls meet the project's minimum<br>touch-target guideline|
|Leak alarm accessibility|TalkBack + manual test|Alarm state and action controls are<br>clearly announced|
|Metric|Target|How to Check|
|Android APK/internal build size|Keep within practical OJT distribution<br>limits; investigate unexpected growth|EAS build artifact/report|
|Android production AAB size|Monitor release build growth|EAS build artifact/report|
|JavaScript bundle size|Monitor for unexpected increases|Expo export/build output|
|Area|Diagnostic Goal||
|Connection reliability|Measure connectio<br>reconnect outcome|n success, disconnect frequency, and<br>s during testing|
|Telemetry quality|Track valid, invalid,<br>samples in controlle|duplicate, missing, and out-of-order<br>d scenarios|
|Usage calculation|Compare calculate<br>during automated t|d totals with known simulator ground truth<br>ests|
|Leak detection|Compare detector d|ecisions against scenario ground truth|
|Alarm behavior|Confirm alarm activ<br>and persistence of t|ation, acknowledgement/stop behavior,<br>he leak event|
|Recovery|Confirm app restart<br>events or corrupt hi|/reconnect does not silently lose active<br>story|



AquaSmart — Combined Project Documentation | Page 5 

#### **Document 15: Deployment Architecture** 

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App 

Document ID: DEPLOY-AS-01 

Status: Draft 

Date: 2026-09-07 

Track: Application Development / Mobile IoT 

#### **1. Deployment Overview** 

AquaSmart is a mobile IoT application. The MVP has no required application server or cloud database. Deployment primarily means building the Android application and distributing it to development/internal testers. The real production data path is the physical BLE water-flow sensor → AquaSmart Android app. 

- The physical BLE water-flow sensor is a runtime device dependency for real-world use, but it is not a cloud deployment component. 

- The BLE simulator/mock is a development and testing substitute only and is not part of the production deployment architecture. 

#### **2. Development Environment** 

Recommended setup: 

- Install the supported Node.js LTS version defined by the project. 

- Install project dependencies with npm install. 

- Start the Expo development environment with npx expo start. 

- Use an Android emulator for UI development where BLE hardware is not required. 

- Use a physical Android device for real BLE testing when the selected physical water-flow sensor is available. 

BLE note: an emulator/development environment should not be reported as physical sensor validation. Controlled simulated telemetry can be used for software testing. 

#### **3. EAS Build (Expo Application Services)** 

##### **3.1 What EAS Does** 

- Builds the React Native/Expo project into installable Android artifacts. 

- Can manage cloud builds and signing configuration. 

- Provides build artifacts and distribution mechanisms for internal testing. 

- Separates development/internal/production build profiles. 

##### **3.2 Build Profiles** 

Recommended baseline: 

{ "build": { "development": { "developmentClient": true, "distribution": "internal", "android": { "buildType": "apk" } }, "internal": { "distribution": "internal", "android": { "buildType": "apk" } }, "production": { "autoIncrement": true, "android": { "buildType": "app-bundle" } } } } 

##### **3.3 Build Commands** 

- eas build --platform android --profile development 

- eas build --platform android --profile internal 

- eas build --platform android --profile production 

AquaSmart — Combined Project Documentation | Page 1 

##### **3.4 Build Output** 

#### **4. Distribution** 

##### **4.1 Internal Distribution (MVP / Testing)** 

- Share the internal APK only with intended testers. 

- Before installation, testers should verify that the APK came from the project/EAS build channel. 

- A physical Android device should be used to validate the actual BLE connection once the sensor is available. 

##### **4.2 Production Distribution (Post-MVP)** 

iOS deployment is not a primary AquaSmart target because the documented production use case is Android BLE sensor connectivity. If iOS support is added later, it should be treated as a separate platform deployment track. 

#### **5. App Configuration** 

The Expo configuration should define the AquaSmart application identity, Android package, icon/splash assets, BLE-related permissions/configuration required by the selected library, and SQLite/native plugin configuration as applicable. 

{ "expo": { "name": "AquaSmart", "slug": "aquasmart", "version": "1.0.0", "orientation": "portrait", "android": { "package": "com.aquasmart.app" } } } 

- The exact Android BLE permission configuration must match the final React Native BLE library version and Android API behavior. 

- Do not copy permissions from unrelated applications; only request permissions actually required by AquaSmart. 

- The final package identifier should be confirmed before the first production build because changing it later affects distribution identity. 

#### **6. Versioning Strategy** 

- Use semantic application versions for release milestones. 

- Use an increasing Android build number/versionCode for each distributable build. 

- EAS auto-increment can be enabled for production builds if desired. 

#### **7. Over-the-Air (OTA) Updates** 

OTA JavaScript updates may be considered after the MVP, but they are not required for the initial OJT deployment. 

- For a water-leak alarm application, OTA changes affecting detection/alarm behavior should be released only after the relevant regression tests pass. 

- MVP deployment can keep all releases on the EAS build path for simpler traceability. 

#### **8. Database Migration on Update** 

When the SQLite schema changes, AquaSmart should run controlled migrations during application startup before repositories depend on the new schema. 

async function runMigrations(db) { const currentVersion = await getDatabaseVersion(db); for (const migration of MIGRATIONS) { if (migration.version > currentVersion) { await runMigrationInTransaction(db, migration); } } } 

- Migrations must be tested from a clean database and from representative previous schemas. 

- Existing flow readings, usage records, leak events, sensor records, and settings must not be silently lost. 

- Destructive schema changes should require an explicit migration design and backup/recovery consideration rather than being assumed safe. 

- Migration failures should surface a recoverable application error and be logged for diagnosis. 

AquaSmart — Combined Project Documentation | Page 2 

#### **9. Infrastructure Cost** 

The earlier FitTrack sample's fixed EAS/free-tier and store-fee amounts are not treated as AquaSmart commitments; service pricing and quotas can change and should be checked at the time of deployment. 

#### **10. Deployment Checklist** 

- If physical sensor hardware is unavailable during the OJT, mark the physical-sensor checklist item as not testable rather than passing it using simulator data. 

- Before a production release, perform a final smoke test using the actual selected sensor and Android device. 

#### **11. Production Deployment Architecture** 

`Physical BLE Water-Flow Sensor` ↓ `BLE AquaSmart Android Application` ↓ `Telemetry Parser & Validation` ↓ `SQLite Local Storage` ↓ `Usage Analysis + Leak Detection` ↓ `Dashboard / Usage Charts / Leak History / Alarm` 

No cloud server is required for the core monitoring path. Future cloud synchronization, remote notifications, or remote valve control would introduce additional deployment infrastructure and should be documented as separate architecture changes. 

#### **12. Summary** 

AquaSmart deployment is centered on a signed Android mobile application distributed through Expo/EAS for development and internal testing, with Google Play as the future public distribution channel. The application is local-first and does not require a backend or cloud database for the MVP. The physical BLE water-flow sensor is the real runtime input, while simulated BLE data is limited to development and automated testing. Database migrations, Android permissions, leak-alarm behavior, and physical BLE validation are release-critical checks. 

|Environment|Distribution Method|Users|
|---|---|---|
|Development|Expo development server /<br>development build|Developer|
|Internal Testing|EAS Build→internal Android APK|OJT mentor, developer, testers|
|Production (future)|Google Play Store / approved<br>distribution channel|End users|



|Command|Result|
|---|---|
|npx expo start|Starts Expo development server|
|npx expo start --android|Runs the app on an Android emulator/device|
|npm test|Runs automated tests|
|npm run lint|Runs JavaScript linting|



|Profile|Android||Purpose|
|---|---|---|---|
|development|APK||Developer/debug testing|
|internal|APK||OJT/internal tester distribution|
|production|AAB||Google Play production submission|
|Platform||Internal Method||
|Android||EAS internal distri|bution APK / controlled sideloading|
|Target||Method||
|Google Play Store||EAS production bu|ild followed by Play Console submission|
|Other controlled distribution||Signed production|APK/AAB where appropriate|



AquaSmart — Combined Project Documentation | Page 3 

|Field|Example|When to Increment|
|---|---|---|
|version|1.0.0|Every public/release milestone|
|Android versionCode|1, 2, 3...|Every distributed Android build|
|Change|OTA Appropriate?|Reason|
|Pure JavaScript/UI change|Potentially yes|No native binary change|
|Leak detection JavaScript rule change|Potentially yes, after safety review|Changes application behavior without<br>necessarily changing native code|
|New native BLE module|No|Requires a new native build|
|BLE native configuration/permission<br>change|No|Requires a new native build|
|Expo/native dependency upgrade|Usually no|Rebuild and regression test|



|Component|Cost / MVP Treatment|
|---|---|
|Backend server|$0 — no required backend|
|Cloud database|$0 — SQLite stored locally on device|
|CDN/web hosting|$0 — not required for the mobile MVP|
|Expo/EAS|Use available plan/quota; verify current pricing before<br>long-term production use|
|Google Play Developer account|Required only if publishing publicly; current fee should be<br>verified before purchase|
|Physical BLE sensor|Hardware cost depends on selected sensor; not included in<br>software infrastructure|



|Checklist Item|Status|
|---|---|
|Automated unit/component/integration tests pass||
|Core E2E tests pass on Android||
|Android internal build installs successfully||
|BLE permissions are correct for the final Android target||
|Real physical sensor connection tested, when hardware is<br>available||
|Invalid/missing/duplicate/out-of-order telemetry tested||
|Leak alarm tested with controlled scenarios||
|SQLite migration tests pass||
|App works with network unavailable for local-first features||
|Large-font/accessibility checks completed||
|Production package/version/build number verified||
|Release notes/CHANGELOG updated||



AquaSmart — Combined Project Documentation | Page 4 

#### **Document 16: Cost Analysis** 

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App 

Document ID: COST-AS-01 

Status: Draft 

Date: 2026-09-07 

Track: Application Development / Mobile IoT 

#### **1. Total Development Cost** 

For the software portion of the OJT MVP, the expected infrastructure cost is approximately $0/month because AquaSmart uses local SQLite storage and does not require a backend server, cloud database, CDN, authentication service, or mandatory analytics platform. 

Important: this does not mean the complete project has no possible cost. The physical BLE water-flow sensor is a hardware dependency for real-world operation, and its price depends on the sensor selected. The OJT does not currently have physical sensor hardware. 

#### **2. Development Tooling Costs** 

Estimated software tooling cost for the OJT: $0 if available free tiers/quotas are sufficient. 

#### **3. Hardware Costs** 

- The sensor cost cannot be finalized until the specific compatible BLE flow sensor is selected. 

- The OJT software can continue using controlled BLE simulator/mock data for development and automated tests while physical hardware is unavailable. 

- Simulator availability should not be counted as eliminating the eventual hardware cost for a real deployment. 

#### **4. Distribution Costs** 

Current platform fees and EAS pricing can change. Verify the applicable fees and quotas at the time of purchase or publication rather than treating sample-document prices as fixed. 

#### **5. No Required Operational Backend Costs** 

The local-first architecture reduces recurring software infrastructure costs, but it does not eliminate costs associated with optional cloud features, app-store publication, EAS usage beyond included quotas, or physical IoT hardware. 

#### **6. Cost at Scale (Future / Hypothetical)** 

If a later AquaSmart release adds cloud synchronization, remote notifications, user accounts, multi-device access, or cloud backup, additional recurring costs will be introduced. 

- Future cloud architecture should preserve SQLite as a resilient local data layer where practical. 

- Cost estimates should be based on expected users, telemetry volume, synchronization frequency, retention, and notification volume rather than copied fixed numbers. 

#### **7. Student Project Budget Summary** 

The strongest cost advantage of AquaSmart is its local-first architecture: core monitoring, usage history, leak analysis, and alarm functionality can operate without a continuously running cloud backend. The main unresolved project cost is the physical BLE water-flow sensor required for real-world validation and eventual deployment. 

#### **8. Cost Assumptions and Limitations** 

AquaSmart — Combined Project Documentation | Page 1 

- Costs in this document are planning estimates, not vendor quotations. 

- Free-tier availability, build quotas, CI minutes, and app-store fees can change. 

- No cost is assigned to equipment already available to the student unless a purchase is required. 

- Physical sensor pricing is intentionally marked TBD because no final sensor model has been selected. 

- Future cloud costs are excluded from the MVP total. 

#### **9. Summary** 

AquaSmart can be developed as a low-cost OJT project because the MVP does not require a backend or cloud database. React Native, Expo, JavaScript, Jest, local SQLite, and development tooling can generally be used without recurring software infrastructure charges when free tiers are sufficient. However, real-world deployment still depends on compatible BLE water-flow sensor hardware, and optional future cloud features or public distribution may introduce additional costs. 

|Tool / Resource|Expected Cost|Notes|
|---|---|---|
|Node.js|Free|Open-source runtime|
|React Native|Free|Open-source mobile framework|
|Expo / Expo CLI|Free|Development tooling|
|EAS Build|Plan/quota dependent|Use available EAS quota; verify current<br>pricing before sustained production use|
|Expo Go|Free|Useful for compatible<br>development/testing scenarios|
|GitHub|Free / plan dependent|Repository and source control;<br>student/free plan may be sufficient|
|GitHub Actions|Plan/quota dependent|Automated CI; free allowance depends<br>on account/repository context|
|Android Studio|Free|Android SDK, emulator, and<br>development tools|
|Figma|Free / plan dependent|Wireframes and UI design|
|JavaScript tooling (ESLint, Prettier,<br>Jest)|Free|Open-source development/test tooling|



|Item|Cost|Purpose|
|---|---|---|
|Physical BLE water-flow sensor|TBD|Real production telemetry source and<br>hardware validation|
|Android test device|Existing device or TBD|Real BLE connectivity, performance,<br>permissions, and alarm testing|
|Developer computer|Existing device|Application development and build<br>preparation|
|Target|Potential Cost|MVP Treatment|
|Internal Android APK|$0 if existing EAS/internal distribution<br>quota is sufficient|Primary OJT distribution method|
|Google Play Store|One-time developer registration fee<br>may apply|Not required for the OJT unless public<br>publishing is planned|
|iOS App Store|Apple Developer Program fee may<br>apply|Not a primary deployment target for this<br>project|
|Service|AquaSmart MVP Cost|Reason|
|Backend server|$0|No required application backend|



AquaSmart — Combined Project Documentation | Page 2 

|Service|AquaSmart MVP Cost|Reason|
|---|---|---|
|Cloud database|$0|SQLite stores core data locally on the<br>Android device|
|CDN|$0|No required web delivery layer|
|SSL/server certificate|$0|No backend endpoint is required for<br>core MVP operation|
|Authentication service|$0|MVP does not require user accounts|
|Analytics platform|$0|No mandatory analytics SDK|
|Cloud object storage|$0|No required user file upload|
|Remote error monitoring|$0|Not mandatory in MVP|



|Future Component|Purpose|Cost Status|
|---|---|---|
|Backend/API|Sync and remote application services|TBD based on provider and usage|
|Cloud database|Optional synchronized data|TBD|
|Cloud backup/object storage|Remote backup of selected local data|TBD|
|Authentication|User accounts and secure multi-device<br>access|TBD|
|Push notification service|Remote leak/usage notifications|Provider-dependent; usage and<br>infrastructure must be evaluated|
|Monitoring/error reporting|Remote diagnostics|TBD; privacy implications must be<br>reviewed|



|Item|Expected OJT Cost|
|---|---|
|Software development tools|$0 if free tiers are sufficient|
|CI/CD|$0 if included quotas are sufficient|
|Local SQLite storage|$0|
|Internal Android distribution|$0 if existing distribution/build quota is sufficient|
|Backend hosting|$0 for MVP|
|Physical BLE sensor|TBD / hardware-dependent|
|Public app-store publication|Optional; platform fee dependent|
|TOTAL SOFTWARE INFRASTRUCTURE|Approximately $0/month|



AquaSmart — Combined Project Documentation | Page 3 

#### **Document 17: Project Roadmap** 

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App 

Document ID: ROAD-AS-01 

Status: Draft 

Date: 2026-09-07 

Track: Application Development / Mobile IoT 

Duration: 9 Weeks 

#### **Overview** 

Week 1 → Research + Setup + Architecture Week 2 → UX/UI Design + Navigation Skeleton Week 3 → BLE Foundation + SQLite Database + Repositories Week 4 → Telemetry Processing + Usage Calculation Week 5 → Leak Detection + Alarm + Dashboard Week 6 → Usage Charts + Leak History + Settings Week 7 → Polish + Accessibility + Error Recovery Week 8 → Testing + CI/CD + EAS Build Week 9 → Documentation + Demo Prep + Final Validation 

The roadmap is deliberately adjusted from the FitTrack sample to AquaSmart's 9-week OJT duration and mobile-IoT scope. The physical BLE water-flow sensor is the production input. Because physical hardware is not currently available, controlled BLE simulator/mock telemetry is used only for development and testing until hardware becomes available. 

#### **Phase 1 — Research + Setup + Architecture (Week 1)** 

##### **Deliverables** 

I Understand React Native + Expo project structure and the JavaScript development workflow 

I Understand react-native-ble-plx central/client architecture and Android BLE permissions 

I Study BLE GATT concepts: service, characteristic, notifications, connection/disconnection, and device discovery 

I Define the hardware-independent telemetry model while leaving final UUIDs/payload structure as TBD 

I Understand expo-sqlite database access, transactions, migrations, and local persistence 

I Set up Android Studio, Android emulator, Node.js, Expo, Git, and GitHub repository 

I Create AquaSmart Expo project using JavaScript 

I Configure ESLint + Prettier and basic testing setup 

I Create initial application architecture and module boundaries 

##### **Definition of Done** 

- AquaSmart development project starts without errors. 

- Application launches on Android emulator. 

- Git repository and branch strategy are initialized. 

- Architecture identifies physical BLE sensor as the production data source. 

- BLE simulator/mock boundary is defined strictly for testing. 

#### **Phase 2 — UX/UI Design + Navigation (Week 2)** 

##### **Deliverables** 

I Define AquaSmart visual design tokens for light and dark themes 

I Create navigation structure for Dashboard, Usage, Leak History, and Settings 

I Design BLE Connection screen/state 

I Design Dashboard with live flow rate, current usage, connection status, and leak status 

AquaSmart — Combined Project Documentation | Page 1 

I Design Usage screen with hourly/daily/weekly views 

I Design Leak History and Leak Detail screens 

I Design active Leak Alarm screen with prominent alert and safe acknowledgement/stop controls 

I Design onboarding/permissions guidance 

I Implement primitive UI components such as Button, Card, Badge, Chip, and TextInput 

##### **Definition of Done** 

- All major screens are navigable. 

- Light/dark theme works consistently. 

- BLE connection, disconnected, sensor-error, and active-alarm states have defined UI. 

- Core UI components render without errors. 

#### **Phase 3 — BLE Foundation + Database + Repositories (Week 3)** 

##### **Deliverables** 

I Implement BLE service abstraction around react-native-ble-plx 

I Implement device discovery, connection, disconnect, and reconnect handling 

I Create hardware-independent telemetry data model 

I Implement telemetry parser and validation layer 

I Set up expo-sqlite 

I Create initial SQLite schema for sensors, flow_readings, usage_records, leak_events, and settings 

I Implement migration runner 

I Implement SensorRepository 

I Implement FlowReadingRepository 

I Implement UsageRepository 

I Implement LeakEventRepository 

I Implement SettingsRepository 

I Write unit tests for repositories and telemetry validation 

##### **Definition of Done** 

- Mock/test BLE data can pass through the BLE abstraction into the parser. 

- Valid telemetry can be persisted to SQLite. 

- Invalid telemetry is rejected safely. 

- Database migrations execute successfully on a clean database. 

#### **Phase 4 — Telemetry Processing + Usage Calculation (Week 4) Deliverables** 

I Implement normalized telemetry state/store 

I Implement flow-rate and timestamp processing 

I Implement water usage calculation from flow rate and elapsed time 

I Handle zero flow, missing data, duplicate data, out-of-order data, and invalid readings 

AquaSmart — Combined Project Documentation | Page 2 

I Persist representative flow readings and usage records 

I Build real-time dashboard data hooks 

I Add deterministic BLE test scenarios: normal, continuous, intermittent, sudden high flow, no flow, sensor error 

I Test calculated usage against known simulator ground truth 

##### **Definition of Done** 

- Valid simulated telemetry updates the application state. 

- Water usage totals are calculated consistently. 

- Invalid/duplicate/out-of-order readings do not silently corrupt usage totals. 

- Dashboard can display a current flow value and connection state. 

#### **Phase 5 — Leak Detection + Alarm + Dashboard (Week 5)** 

##### **Deliverables** 

I Implement configurable pattern/state-based leak detection service 

I Define normal-flow, suspicious-flow, suspected-leak, active-alarm, and resolved conditions 

I Implement controlled OJT continuous-flow test condition 

I Avoid treating a single high-flow sample as automatically meaning a leak 

I Implement leak event persistence 

I Implement loud alarm behavior using supported mobile audio capabilities 

I Implement alarm acknowledgement/stop behavior 

I Show prominent active-leak state on Dashboard 

I Add leak detection tests for normal, intermittent, continuous suspicious, recovery, and sensor-error scenarios 

##### **Definition of Done** 

- Controlled suspicious-flow scenarios trigger the expected leak state. 

- Normal/intermittent patterns do not create avoidable false alarms under configured test rules. 

- Leak events are stored in SQLite. 

- Alarm can be stopped/acknowledged safely. 

- The OJT test duration is documented as a test condition, not a universal real-world leak definition. 

#### **Phase 6 — Usage Charts + Leak History + Settings (Week 6) Deliverables** 

I Implement hourly usage chart 

I Implement daily usage chart 

I Implement weekly usage chart 

I Implement usage history queries and aggregation 

I Implement Leak History list 

I Implement Leak Detail screen 

I Implement sensor/connection status history where useful 

I Implement Settings screen 

I Add configurable leak-detection parameters where appropriate 

I Add water bill calculator as an optional stretch feature if core features are stable 

AquaSmart — Combined Project Documentation | Page 3 

##### **Definition of Done** 

- Charts display stored usage data correctly. 

- Leak history shows active and resolved events. 

- Settings persist after app restart. 

- Optional features do not delay core BLE monitoring, usage, leak detection, and alarm functionality. 

#### **Phase 7 — Polish + Accessibility + Error Recovery (Week 7) Deliverables** 

I Add loading, empty, disconnected, sensor-error, and database-error states 

I Add application error boundary 

I Implement BLE reconnect/recovery behavior 

I Implement crash recovery for active leak events 

I Add accessibility labels to interactive controls 

I Test TalkBack navigation 

I Test large font scaling 

I Ensure leak state is not communicated through color alone 

I Support reduced-motion preferences where practical 

I Optimize dashboard and chart rendering 

I Review hardcoded values and move stable UI tokens/configuration into centralized modules 

##### **Definition of Done** 

- Core local features continue to work without internet connectivity. 

- BLE disconnects produce a clear state and recovery path. 

- Application does not crash on invalid telemetry. 

- Accessibility and error-state review is completed. 

#### **Phase 8 — Testing + CI/CD + EAS Build (Week 8) Deliverables** 

I Complete repository unit tests 

I Complete telemetry parser and validation tests 

I Complete usage calculation tests 

I Complete leak detection branch/edge-case tests 

I Complete component tests 

I Complete integration tests 

I Complete Android Detox E2E smoke tests 

I Set up GitHub Actions CI 

I Set up security/dependency checks 

I Set up EAS internal Android build 

I Generate installable Android APK 

I Run performance tests on representative Android hardware 

I Run physical BLE sensor tests if the selected sensor is available 

AquaSmart — Combined Project Documentation | Page 4 

##### **Definition of Done** 

- Automated unit/component/integration tests pass. 

- Core Android E2E flows pass. 

- GitHub Actions CI is green on pull requests. 

- Android internal APK builds and installs. 

- Physical sensor validation is recorded separately from simulator validation. 

#### **Phase 9 — Documentation + Demo Prep + Final Validation (Week 9)** 

##### **Deliverables** 

I Finalize all AquaSmart project documentation 

I Finalize README with setup, testing, and architecture information 

I Finalize Architecture Decision Records 

I Complete requirements-to-test traceability matrix 

I Review security and privacy documentation 

I Review cost analysis and deployment documentation 

I Prepare 5-minute project demonstration 

I Capture screenshots from the application 

I Organize GitHub repository professionally 

I Update CHANGELOG/release notes 

I Practice demo at least twice 

I Prepare final OJT submission package 

##### **Definition of Done** 

- Fresh setup can be completed using the README without major ambiguity. 

- Core demonstration works reliably. 

- Documentation is internally consistent. 

- Known hardware limitations are explicitly documented. 

- Final demo explains the difference between physical-sensor production architecture and simulator-based OJT testing. 

#### **Milestone Summary** 

#### **Priority and Scope Control** 

- If schedule pressure occurs, protect the Must Have features first. 

- Do not add cloud/backend infrastructure to the MVP unless a clear requirement is introduced. 

- Do not make the BLE simulator a production dependency. 

- Do not claim real-world leak-detection accuracy without physical-sensor and controlled field validation. 

#### **Summary** 

This 9-week roadmap gives AquaSmart a focused path from architecture and BLE/database foundations through telemetry processing, leak detection, alarm behavior, dashboard/history features, quality hardening, testing, deployment, and final OJT documentation. The schedule deliberately separates the software-testing phase, where simulator/mock telemetry is useful, 

AquaSmart — Combined Project Documentation | Page 5 

from the real production architecture, where the Android application communicates with the physical BLE water-flow sensor. 

|Milestone|Week|Description|
|---|---|---|
|M1 — Architecture & Setup|End of Week 1|AquaSmart project running with defined<br>mobile-IoT architecture|
|M2 — UI Shell|End of Week 2|Core screens, navigation, themes, and<br>connection states defined|
|M3 — BLE + Database Foundation|End of Week 3|BLE abstraction, telemetry validation,<br>SQLite schema, and repositories ready|
|M4 — Telemetry + Usage|End of Week 4|Validated flow data processed and<br>water usage calculated|
|M5 — Leak Detection MVP|End of Week 5|Leak detection, event persistence,<br>dashboard status, and alarm working|
|M6 — Full MVP UI|End of Week 6|Charts, leak history, settings, and core<br>user experience complete|
|M7 — Quality Ready|End of Week 7|Accessibility, recovery, error handling,<br>and performance polish complete|
|M8 — Tested Build|End of Week 8|Automated tests, CI/CD, and Android<br>internal APK complete|
|M9 — OJT Ready|End of Week 9|Documentation, demo, final validation,<br>and submission package complete|



|Priority|Features|
|---|---|
|Must Have|BLE connection, telemetry parsing/validation, SQLite<br>storage, flow/usage calculation, real-time dashboard, leak<br>detection, loud alarm, leak history, error handling|
|Should Have|Hourly/daily/weekly charts, configurable detection settings,<br>reconnect handling, accessibility improvements, usage<br>reports|
|Could Have|Water bill calculator, unusual-usage detection, smart<br>notifications, multiple sensors|
|Future / Stretch|Remote BLE shutoff valve, cloud sync, multi-device access,<br>remote monitoring|



AquaSmart — Combined Project Documentation | Page 6 

#### **Document 18: Team Responsibilities** 

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App 

Document ID: TEAM-AS-01 

Status: Draft 

Date: 2026-09-07 

Track: Application Development / Mobile IoT 

Team Size: 1 Student 

#### **Team Structure** 

AquaSmart is a solo OJT project. Therefore, the responsibilities that the FitTrack sample divides between two students are consolidated under one student. Work is organized by engineering responsibility rather than by separate people: Product/Documentation, Mobile UI, BLE/IoT Integration, Data Layer, Core Logic, Testing, and Delivery. 

- Student: Chinthaginjala Madhav Sai Kiran 

- Mentor: Kshitiz Dhooria 

- The student owns the complete codebase and is responsible for integration across all modules. 

- The mentor provides guidance, review, and feedback but is not treated as a project developer. 

#### **Student — Full-Stack Mobile IoT Project Owner** 

##### **Primary Ownership** 

- Project architecture and technical decisions 

- React Native + Expo JavaScript application development 

- Physical BLE water-flow sensor integration as the production input 

- BLE connection, discovery, notification handling, disconnect, and reconnect behavior 

- Telemetry parsing and validation 

- SQLite schema, migrations, repositories, and local data lifecycle 

- Water usage calculation and aggregation 

- Pattern/state-based leak detection logic 

- Leak event persistence and loud alarm behavior 

- Dashboard, usage charts, leak history, settings, and connection screens 

- Application state management 

- Accessibility and error-state implementation 

- Unit, component, integration, and E2E testing 

- GitHub repository management and CI/CD 

- EAS Android build and internal distribution 

- Project documentation, README, ADRs, demo preparation, and final OJT submission 

#### **Core Deliverables** 

#### **Data and IoT Responsibilities** 

- Define a hardware-independent telemetry model so the application is not tightly coupled to one sensor implementation. 

- Integrate react-native-ble-plx as the Android BLE Central/client layer. 

AquaSmart — Combined Project Documentation | Page 1 

- Keep the final service UUID, characteristic UUID, payload structure, byte order, scaling, and status values as hardware-specific configuration/TBD until the physical sensor is selected. 

- Validate telemetry before it affects usage totals or leak detection. 

- Handle duplicate, missing, out-of-order, malformed, and impossible readings safely. 

- Persist validated flow readings and derived usage/leak records in SQLite. 

- Use BLE simulator/mock telemetry only for controlled development and automated testing when physical hardware is unavailable. 

#### **UI and Frontend Responsibilities** 

- Implement Dashboard with live flow rate, usage, sensor connection state, and leak state. 

- Implement BLE Connection screen and connection/reconnection feedback. 

- Implement Usage screen with hourly, daily, and weekly charts. 

- Implement Leak History and Leak Detail screens. 

- Implement active Leak Alarm screen and acknowledgement/stop controls. 

- Implement Settings for configurable application behavior. 

- Build reusable Button, Card, Badge, Chip, TextInput, loading, empty, and error components. 

- Implement light/dark theme consistently. 

- Ensure accessibility labels, logical navigation, readable text scaling, and non-color-only status communication. 

#### **Testing Responsibilities** 

- Simulator-based test results must be labeled as software/development validation. 

- Physical sensor validation must be performed separately and must not be claimed when hardware is unavailable. 

#### **GitHub and Delivery Responsibilities** 

- Maintain main, develop, feature/*, fix/*, and release/* branches as appropriate for the project's size. 

- Create pull requests for meaningful changes even though the project is solo, so the history remains reviewable. 

- Run linting and automated tests before merging important changes. 

- Maintain GitHub Actions CI for lint, tests, security/dependency checks, and build validation. 

- Maintain EAS configuration for Android development/internal/production builds. 

- Keep secrets such as EAS tokens and signing credentials out of source control. 

- Maintain release notes and document important architecture changes. 

#### **Documentation Responsibilities** 

#### **Mentor Responsibilities** 

- Review project direction and major technical decisions. 

- Provide feedback on architecture, implementation approach, and OJT milestones. 

- Review demonstration readiness and documentation completeness. 

- Help identify risks, unrealistic scope, or missing validation. 

- Guide the student when hardware-specific BLE decisions cannot be finalized independently. 

Mentor involvement is advisory/review-oriented; implementation ownership remains with the student. 

#### **Communication and Review** 

AquaSmart — Combined Project Documentation | Page 2 

- Because this is a solo project, communication should focus on milestone reviews rather than two-person daily standups. 

- Important technical decisions should be recorded in the project documentation/ADRs instead of relying only on verbal discussions. 

#### **Definition of Done** 

##### **Student** 

- Core BLE, telemetry, SQLite, usage, leak detection, alarm, dashboard, and history features are implemented and integrated. 

- Repository and service tests cover critical logic. 

- Core Android E2E flows pass. 

- The application handles BLE disconnects, invalid telemetry, and recoverable errors without crashing. 

- The physical sensor is tested when available; otherwise the hardware limitation is explicitly documented. 

- CI/CD produces a valid Android internal build. 

- Documentation accurately reflects the implemented application. 

- The student can explain the architecture, code organization, data flow, leak-detection approach, testing strategy, and deployment process during the viva. 

#### **Scope Control for a Solo Project** 

- The student should not sacrifice core leak-monitoring reliability to complete stretch features. 

- A new feature should be added only if it does not destabilize BLE communication, data persistence, leak detection, or alarm behavior. 

- The simulator should remain a testing aid rather than becoming a production architecture dependency. 

#### **Summary** 

Unlike the two-person FitTrack sample, AquaSmart is a solo project, so all engineering responsibilities are owned by one student. The work is divided conceptually into mobile UI, BLE/IoT integration, data, core logic, testing, delivery, and documentation, but these are not separate team roles. This structure keeps ownership clear while allowing the project to remain achievable within the 9-week OJT roadmap. 

|Deliverable|Document Reference|
|---|---|
|System architecture and component boundaries|HLD / LLD|
|UX flows and screen requirements|UX Requirements|
|SQLite schema and migrations|Database / Data Design|
|SensorRepository / FlowReadingRepository|Repository API Specification|
|UsageRepository / LeakEventRepository /<br>SettingsRepository|Repository API Specification|
|BLE service and telemetry parser/validator|TRD / LLD / Repository API|
|Water usage calculation service|LLD / Testing Strategy|
|Leak detection service|LLD / Testing Strategy|
|Alarm service and leak-state UI|LLD / UX Requirements|
|Dashboard and live monitoring UI|UX Requirements / Frontend Architecture|
|Usage charts and leak history|UX Requirements / Frontend Architecture|
|Settings and configuration|UX Requirements|
|Automated test suite|Testing Strategy|



AquaSmart — Combined Project Documentation | Page 3 

|Deliverable|Document Reference|
|---|---|
|GitHub Actions CI/CD|CI/CD Pipeline|
|EAS Android build|Deployment Architecture|
|README, ADRs, and final documentation|README / ADRs / Project Roadmap|



|Testing Area|Responsibility|
|---|---|
|Unit tests|Repositories, validators, telemetry parser, usage calculation,<br>leak detection, stores|
|Component tests|Dashboard, charts, BLE connection, alarm, history, settings|
|Integration tests|BLE/mock telemetry→validation→SQLite→usage/leak<br>logic→UI state|
|E2E tests|Core Android flows such as connection, monitoring, leak<br>alarm, history, settings, and recovery|
|Performance tests|Startup, dashboard updates, charts, SQLite queries, and<br>long-running monitoring|
|Accessibility tests|TalkBack, large font, touch targets, status communication|
|Hardware validation|Physical sensor connection and telemetry behavior when<br>hardware is available|



|Documentation|Owner / Timing|
|---|---|
|Project Overview, BRD, PRD, UX, TRD|Student — maintained throughout development|
|HLD, Database Design, API Specification, LLD|Student — update when architecture changes|
|Frontend, Security, Testing, CI/CD, Observability|Student — align with implementation|
|Deployment, Cost, Roadmap|Student — update before final release|
|README|Student — keep synchronized with actual setup|
|ADRs|Student — record significant technical decisions|
|Demo script and screenshots|Student — final phase|



|Practice|Tool|Frequency|
|---|---|---|
|Progress update|Mentor discussion / agreed<br>communication channel|Weekly or milestone-based|
|Code review|GitHub Pull Request / commit review|For major changes|
|Architecture review|Documentation + mentor discussion|At major milestones|
|Testing review|Test reports / CI results|Each milestone|
|Demo review|Working application|Before final OJT demonstration|



|Priority|Responsibility / Feature|
|---|---|
|Must Have|Physical BLE sensor integration, telemetry validation,<br>SQLite storage, usage calculation, dashboard, leak<br>detection, loud alarm, leak history, error handling|
|Should Have|Hourly/daily/weekly charts, configurable detection settings,<br>reconnect recovery, accessibility hardening|
|Could Have|Water bill calculator, usage reports, unusual-usage<br>detection, smart notifications|
|Future / Stretch|Multiple sensors, remote BLE shutoff valve, cloud sync,<br>remote monitoring|



AquaSmart — Combined Project Documentation | Page 4 

AquaSmart — Combined Project Documentation | Page 5 

#### **Document 19: GitHub Repository Structure** 

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App 

#### **Repository Structure** 

aquasmart/ 

I III `app/ # Expo Router — file-based routes` I III `_layout.js # Root layout, providers and app initialization` I III `(tabs)/` I I III `_layout.js # Bottom tab navigator configuration` I I III `index.js # Dashboard / home tab` I I III `usage/` I I I III `_layout.js` I I I III `index.js # Usage charts and summaries` I I III `leaks/` I I I III `_layout.js` I I I III `index.js # Leak history` I I III `settings/` I I III `_layout.js` I I III `index.js # Settings` I III `(modals)/` I I III `ble-connection.js # BLE sensor connection / status modal` I I III `leak-detail.js # Leak event detail` I I III `active-alarm.js # Full-screen active leak alarm` I I III `testing.js # Development/testing controls` I III `onboarding/` I III `welcome.js` I III `permissions.js` I III `sensor-setup.js` I III `components/` I III `ui/ # Primitive design-system components` I I III `Button.js` I I III `TextInput.js` I I III `Card.js` I I III `Badge.js` I I III `Chip.js` I I III `Toast.js` I I III `ConfirmDialog.js` I I III `SkeletonLoader.js` I I III `EmptyState.js` I I III `ThemedView.js` I I III `ThemedText.js` I III `dashboard/` I I III `CurrentFlowCard.js # Current flow rate and connection status` I I III `UsageSummaryCard.js` I I III `LeakStatusCard.js` I III `ble/` I I III `SensorConnectionCard.js` I I III `ConnectionStatusBadge.js` I I III `SensorSelector.js` I III `usage/` I I III `UsageSummary.js` I I III `UsageChart.js` I I III `UsagePeriodSelector.js` I III `leaks/` I I III `LeakHistoryItem.js` I I III `LeakStatusBadge.js` I I III `LeakDetailCard.js` I III `alarm/` I I III `LeakAlarmBanner.js` 

AquaSmart — Combined Project Documentation | Page 1 

I I III `AlarmOverlay.js` I III `settings/` I III `SettingsSection.js` I III `SettingRow.js` I III `stores/ # Zustand client/UI state` I III `connectionStore.js` I III `settingsStore.js` I III `alarmStore.js` I III `testingStore.js` I III `hooks/ # Reusable React hooks` I III `useBleConnection.js` I III `useFlowReadings.js` I III `useUsage.js` I III `useLeakEvents.js` I III `useSettings.js` I III `repositories/ # SQLite data-access layer` I III `SensorRepository.js` I III `FlowReadingRepository.js` I III `UsageRepository.js` I III `LeakEventRepository.js` I III `SettingsRepository.js` I III `database/` I III `client.js # expo-sqlite initialization / provider` I III `migrations/` I I III `index.js # Migration runner` I I III `v1_initial_schema.js # Initial tables and indexes` I III `seeds/` I III `settings.js # Optional default settings` I III `services/` I III `BleService.js # Physical BLE sensor connection/client` I III `TelemetryParserService.js # BLE payload parsing` I III `TelemetryValidationService.js # Data quality and validity checks` I III `UsageCalculationService.js # Converts flow rate/time into usage` I III `LeakDetectionService.js # Pattern/state-based leak analysis` I III `AlarmService.js # Loud leak alarm control` I III `BleSimulatorService.js # Development/testing only` I III `theme/` I III `colors.js` I III `typography.js` I III `spacing.js` I III `useTheme.js` I III `types/` I III `models.js # Sensor, FlowReading, UsageRecord, LeakEvent` I III `errors.js # AquaSmart error codes / error objects` I III `utils/` I III `date.js` I III `units.js` I III `flow.js` I III `validation.js` I III `__tests__/` I III `repositories/` I I III `SensorRepository.test.js` I I III `FlowReadingRepository.test.js` I I III `UsageRepository.test.js` I I III `LeakEventRepository.test.js` 

AquaSmart — Combined Project Documentation | Page 2 

I III `services/` I I III `TelemetryParserService.test.js` I I III `TelemetryValidationService.test.js` I I III `UsageCalculationService.test.js` I I III `LeakDetectionService.test.js` I III `stores/` I I III `connectionStore.test.js` I I III `alarmStore.test.js` I III `utils/` I I III `validation.test.js` I III `components/` I I III `CurrentFlowCard.test.js` I I III `UsageChart.test.js` I I III `LeakAlarmBanner.test.js` I III `integration/` I III `TelemetryToLeakDetection.test.js` I III `e2e/ # Android E2E tests` I III `onboarding.test.js` I III `ble-connection.test.js` I III `dashboard.test.js` I III `leak-alarm.test.js` I III `settings.test.js` I III `assets/` I III `icon.png` I III `splash.png` I III `adaptive-icon.png` I III `docs/` I III `01-project-overview.docx` I III `02-business-requirements.docx` I III `03-product-requirements.docx` I III `04-ux-requirements.docx` I III `05-technical-requirements.docx` I III `06-high-level-design.docx` I III `07-database-data-design.docx` I III `08-repository-api-specification.docx` I III `09-low-level-design.docx` I III `10-frontend-architecture.docx` I III `11-security-design.docx` I III `12-testing-strategy.docx` I III `13-ci-cd-pipeline.docx` I III `14-observability-design.docx` I III `15-deployment-architecture.docx` I III `16-cost-analysis.docx` I III `17-project-roadmap.docx` I III `18-team-responsibilities.docx` I III `19-github-repository-structure.docx` I III `20-readme.docx` I III `21-architecture-decision-records.docx` I III `.github/` I III `workflows/` I I III `ci.yml # Lint + unit/integration tests` I I III `deploy.yml # EAS build on approved release flow` I III `ISSUE_TEMPLATE/` I I III `feature.md` I I III `bug.md` I III `PULL_REQUEST_TEMPLATE.md` I III `app.json` III `eas.json` III `babel.config.js` 

AquaSmart — Combined Project Documentation | Page 3 

III `jest.config.js` III `.eslintrc.json` III `.prettierrc` III `package.json` III `package-lock.json` III `README.md` III `CONTRIBUTING.md` III `CHANGELOG.md` III `LICENSE` 

#### **Key Conventions** 

##### **Branch Naming** 

- feature/ble-connection 

- feature/sqlite-migrations 

- feature/leak-detection 

- feature/usage-charts 

- fix/telemetry-validation 

- fix/ble-reconnect 

- test/leak-detection-scenarios 

- docs/update-readme 

##### **Commit Message Format (Conventional Commits)** 

- feat(ble): add physical sensor connection service 

- feat(db): implement flow reading repository 

- feat(leak): add pattern-based leak detection logic 

- fix(telemetry): reject invalid flow readings 

- test(leak): add continuous-flow detection scenarios 

- docs(readme): add Android setup instructions 

- chore(ci): add lint and unit test workflow 

##### **PR Naming** 

- [S1] feat: implement BLE connection and telemetry parsing 

- [S2] feat: add leak detection and alarm handling 

- [S3] feat: add usage charts and leak history 

- refactor: simplify telemetry validation 

- docs: update repository architecture 

##### **File Naming** 

- React components: PascalCase.js 

- Hooks: camelCase.js with a use... prefix 

- Repositories: PascalCaseRepository.js 

- Services: PascalCaseService.js 

- Stores: camelCaseStore.js 

- Utility modules: camelCase.js 

- Tests: matching module name with .test.js or .test.jsx where required 

AquaSmart — Combined Project Documentation | Page 4 

#### **Architecture and Repository Conventions** 

- Production data flow is centered on the physical BLE water-flow sensor communicating with the Android AquaSmart application. 

- The Android application acts as the BLE Central / GATT Client and owns connection, telemetry parsing, validation, persistence, analysis, and presentation. 

- BleSimulatorService.js is restricted to development and controlled testing. It is not a production dependency and does not replace the physical sensor in the product architecture. 

- SQLite repositories isolate database access from UI components and business services. 

- Telemetry parsing and validation are separated so malformed, missing, duplicate, out-of-order, or otherwise invalid readings can be handled explicitly. 

- LeakDetectionService.js contains pattern/state-based detection logic. Specific hardware protocol details and final sensor calibration remain configurable/TBD until the physical sensor is selected. 

- JavaScript is used throughout the application; TypeScript files and a tsconfig.json are intentionally not part of this repository structure. 

- Sensitive configuration and credentials must be supplied through environment/secrets management rather than committed to Git. 

- Documentation files are kept separately so each OJT deliverable can be reviewed and updated independently. 

#### **Repository Ownership** 

- Student — Chinthaginjala Madhav Sai Kiran: owns application code, BLE integration, data layer, leak detection, testing, CI/CD, documentation, and release preparation. 

- Mentor — Kshitiz Dhooria: provides technical guidance, review, and milestone feedback. 

- Project mode: solo OJT application development. 

#### **Important Scope Boundary** 

Physical sensor: The intended real-world architecture is Physical BLE Water Flow Sensor → Android AquaSmart App. 

Simulator: A BLE simulator is included only to generate controlled telemetry for development and testing because physical sensor hardware is not available during the OJT. Exact service UUIDs, characteristic UUIDs, packet structure, byte order, scaling, and other hardware-specific protocol details remain TBD until the sensor is selected. 

#### **Summary** 

This repository structure separates routing, reusable UI components, state, hooks, SQLite repositories, BLE and telemetry services, business logic, testing, documentation, and CI/CD configuration. It keeps the physical BLE sensor as the primary production integration while providing a contained simulator for OJT testing. The structure is intentionally modular so additional sensors, richer reporting, smart notifications, or a future BLE shutoff-valve capability can be added without coupling hardware logic directly to the UI. 

AquaSmart — Combined Project Documentation | Page 5 

#### **Document 20: README** 

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App 

A mobile IoT application for monitoring household water flow through a Bluetooth Low Energy (BLE) water-flow sensor, calculating water usage, and detecting suspicious flow patterns that may indicate a leak. 

#### **The Problem** 

- Household water leaks can remain unnoticed for long periods, wasting water and increasing expenses. 

- Users may not have continuous visibility into current water flow or accumulated water usage. 

- A simple flow sensor alone does not provide a complete mobile experience for monitoring, history, and leak alerts. 

- During the OJT, physical sensor hardware is unavailable, so controlled BLE telemetry simulation is needed for development and testing. 

#### **The Solution** 

AquaSmart connects an Android mobile application to a physical BLE water-flow sensor. The app receives flow telemetry, validates and stores readings locally in SQLite, calculates water usage, analyzes flow patterns for possible leaks, and presents the results through a dashboard, charts, leak history, and an audible alarm. 

For OJT development and controlled testing only, a BLE simulator can temporarily provide scenario-driven telemetry when the physical sensor is unavailable. The simulator is not a production dependency. 

#### **Features** 

#### **Screens** 

- Dashboard — current flow rate, connection status, usage summary, and leak status. 

- BLE Connection — sensor discovery, connection state, and reconnect feedback. 

- Usage — hourly, daily, and weekly consumption charts. 

- Leak History — previously detected leak events. 

- Leak Detail — details for an individual leak event. 

- Active Leak Alarm — prominent warning and audible alarm controls. 

- Settings — monitoring and alarm preferences. 

- Testing / Simulation Controls — development-only controls for generating controlled telemetry scenarios. 

#### **Tech Stack** 

#### **Quick Start** 

##### **Prerequisites** 

- Node.js LTS 

- npm 

- Git 

- Android device or Android Emulator 

- Expo development tooling compatible with the selected Expo SDK 

##### **Installation** 

```
git clone <repository-url>
cd aquasmart
```

AquaSmart — Combined Project Documentation | Page 1 

```
npm install
npx expo start
```

##### **Run on Android** 

```
npx expo start --android
```

For actual BLE integration, use a development build/environment that supports the required native BLE functionality. Do not assume Expo Go alone provides every native capability required by the final BLE implementation. 

#### **Architecture** 

Production data path 

```
Physical BLE Water Flow Sensor
```

↓ `BLE AquaSmart Android App` ↓ 

BLE Connection Service 



Telemetry Parser 



Telemetry Validation 



SQLite Repositories 



Usage Calculation + Leak Detection 



Dashboard / Charts / Leak History / Alarm 

Development and testing substitution 

BLE Simulator 

- ↓ `controlled telemetry AquaSmart Android App` 

- ↓ 

Telemetry Parser + Validation + Analysis 

The production architecture is sensor-first: the physical BLE water-flow sensor is the intended real-world telemetry source. The simulator exists only to support OJT development and controlled tests. 

#### **Data Model** 

- sensors — registered BLE sensor metadata and connection information. 

- flow_readings — timestamped flow-rate telemetry and data-quality information. 

- usage_records — calculated water consumption for defined time periods. 

- leak_events — detected suspicious-flow events, status, timestamps, and supporting information. 

- settings — monitoring and alarm preferences. 

#### **Leak Detection** 

AquaSmart uses pattern/state-based leak detection rather than treating one flow-rate threshold as proof of a leak. The analysis can consider persistence, flow characteristics, interruptions, data quality, and recovery. A condition such as continuous suspicious flow for 30 minutes can be used as a controlled OJT test scenario, but it is not a universal definition of a household leak or a guarantee of real-world detection accuracy. 

#### **Development BLE Simulator** 

AquaSmart — Combined Project Documentation | Page 2 

- Normal flow 

- Continuous flow 

- Intermittent flow 

- Sudden high flow 

- No flow 

- Sensor error 

- Invalid packet 

- Missing packet 

- Duplicate packet 

- Out-of-order packet 

- Impossible flow value 

- BLE disconnect 

The simulator maintains expected scenario behavior so that validation and leak-detection results can be compared with known test conditions. Exact physical-sensor service UUIDs, characteristic UUIDs, packet layout, byte order, scaling, and status values remain TBD until the physical sensor hardware is selected. 

#### **Testing** 

- Unit tests for repositories, telemetry parsing and validation, usage calculations, and leak detection. 

- Component tests for dashboard, charts, connection state, leak history, and alarm UI. 

- Integration tests covering telemetry through validation, persistence, usage analysis, and leak detection. 

- Android E2E tests for onboarding, BLE connection behavior, dashboard, leak alarm, and settings. 

- Controlled simulator scenarios for malformed, missing, duplicate, out-of-order, and abnormal telemetry. 

- Physical sensor validation is hardware-dependent and is not claimed as completed during the OJT. 

#### **Building the App** 

```
npm install -g eas-cli
```

```
eas login
eas build --platform android --profile development
eas build --platform android --profile internal
```

The exact build profiles and Android application configuration should match the project's committed eas.json and deployment configuration. 

#### **Project Structure** 

- app/ — Expo Router routes and screens. 

- components/ — reusable React Native UI components. 

- stores/ — Zustand client and UI state. 

- hooks/ — reusable React hooks and data-query hooks. 

- repositories/ — SQLite data-access layer. 

- database/ — SQLite client, schema, migrations, and seed data. 

- services/ — BLE, telemetry, usage, leak detection, alarm, and testing services. 

- theme/ — design tokens and theme utilities. 

- types/ — shared model and error definitions represented in JavaScript modules. 

- utils/ — date, unit, flow, and validation utilities. 

- __tests__/ — unit, component, and integration tests. 

AquaSmart — Combined Project Documentation | Page 3 

- e2e/ — Android end-to-end tests. 

- docs/ — separate OJT documentation deliverables. 

- .github/ — CI/CD workflows and GitHub templates. 

#### **Documentation Index** 

- 01 — Project Overview 

- 02 — Business Requirements Document (BRD) 

- 03 — Product Requirements Document (PRD) 

- 04 — UX Requirements 

- 05 — Technical Requirements Document (TRD) 

- 06 — High-Level Design (HLD) 

- 07 — Database / Data Design 

- 08 — Repository API Specification 

- 09 — Low-Level Design (LLD) 

- 10 — Frontend Architecture 

- 11 — Security Design 

- 12 — Testing Strategy 

- 13 — CI/CD Pipeline 

- 14 — Observability Design 

- 15 — Deployment Architecture 

- 16 — Cost Analysis 

- 17 — Project Roadmap 

- 18 — Team Responsibilities 

- 19 — GitHub Repository Structure 

- 20 — README 

- 21 — Architecture Decision Records (ADRs) 

#### **Privacy and Data Handling** 

- The MVP is designed as a local-first mobile application without a required backend account. 

- Flow readings, usage history, leak events, and settings are stored locally in SQLite. 

- The MVP does not require a cloud backend for core monitoring and history features. 

- BLE permissions should be requested only when required and explained to the user. 

- Logs and diagnostics should avoid unnecessary sensitive information. 

#### **Project Information** 

- Student: Chinthaginjala Madhav Sai Kiran 

- Roll No: 25100010700016 

- Year & Section: Sem 3 A 

- Project: Solo OJT 

- Mentor: Kshitiz Dhooria 

- Institution: Polaris School of Technology 

AquaSmart — Combined Project Documentation | Page 4 

- Duration: 9 weeks 

- Project Type: Application Development / Mobile IoT 

- Target Users: Homeowners and Plumbers 

#### **License** 

License terms can be finalized according to the OJT/project submission requirements. 

#### **Scope Note** 

This README describes the intended OJT architecture and implementation scope. It does not claim that physical sensor integration has already been validated. Hardware-specific BLE protocol details remain subject to the selected sensor, while advanced capabilities such as remote BLE shutoff control remain future scope. 

|Feature|Scope|
|---|---|
|BLE water-flow sensor connection|Core|
|Real-time flow-rate display|Core|
|Telemetry parsing and validation|Core|
|Local SQLite storage|Core|
|Water usage calculation|Core|
|Hourly, daily, and weekly usage charts|Core|
|Pattern/state-based leak detection|Core|
|Loud leak alarm|Core|
|Leak history and event details|Core|
|BLE disconnect and invalid-data handling|Core|
|BLE simulator for controlled test scenarios|Development / Testing|
|Testing and simulation controls|Development / Testing|
|Water bill calculator|Stretch|
|Usage reports and smart notifications|Future|
|Multiple sensor support|Future|
|Remote BLE shutoff valve control|Future|



|Layer|Technology|
|---|---|
|Framework|React Native + Expo|
|Language|JavaScript|
|Routing|Expo Router|
|State|Zustand|
|Data Queries|TanStack Query where useful|
|Database|expo-sqlite / SQLite|
|BLE|react-native-ble-plx|
|Audio|expo-av|
|Charts|React Native-compatible charting library|
|Testing|Jest + React Native Testing Library + Android E2E testing|
|CI/CD|GitHub Actions + EAS Build|
|Primary Platform|Android|



AquaSmart — Combined Project Documentation | Page 5 

AquaSmart — Combined Project Documentation | Page 6 

#### **Document 21: Architecture Decision Records (ADRs)** 

AquaSmart – Bluetooth Water Flow Meter & Leak Alarm App 

Document ID: ADR-IOT-01 Status: Draft Track: Application Development / Mobile IoT 

This document records important architecture and technology decisions for AquaSmart. The decisions are tailored to the project's Android-first BLE architecture, local SQLite storage, nine-week OJT timeline, and solo development scope. 

#### **ADR-001 — Framework: Expo + React Native over Bare React Native** 

##### **Context** 

AquaSmart needs a mobile UI, SQLite persistence, Android deployment, audio alarm support, and BLE communication. The project has a nine-week OJT schedule and is developed by one student. The architecture should minimize unnecessary native-project maintenance while still allowing the native BLE capability required by the physical sensor. 

##### **Options Considered** 

##### **Decision** 

Expo + React Native 

##### **Rationale** 

- Provides a productive React Native development model for the nine-week OJT. 

- Expo tooling and EAS simplify Android builds and project configuration. 

- expo-sqlite fits the local-first data architecture. 

- React Native keeps UI development modular while allowing native dependencies where required. 

- Using a development build avoids assuming that Expo Go contains every native BLE capability. 

##### **Trade-offs** 

- Native BLE integration may require additional Expo configuration or a development build. 

- Some future hardware-specific native requirements may require deeper native integration. 

- Expo SDK/library compatibility must be checked when selecting the BLE package version. 

##### **Consequences** 

- The repository uses Expo configuration and EAS build profiles. 

- BLE functionality is validated in a native-capable Android development build. 

- The application remains JavaScript-based; TypeScript is not introduced solely because of framework conventions. 

#### **ADR-002 — BLE Communication: Physical Sensor as Production Source** 

##### **Context** 

The core product depends on receiving water-flow telemetry from a real BLE water-flow sensor. The OJT does not have the physical sensor hardware, so a simulator is needed for controlled development tests. The architecture must not accidentally make the simulator appear to be the production device. 

##### **Options Considered** 

##### **Decision** 

`Physical BLE water-flow sensor` → `Android AquaSmart app` 

AquaSmart — Combined Project Documentation | Page 1 

##### **Rationale** 

- The real-world data path is direct BLE communication from the physical sensor to the Android app. 

- Android acts as the BLE Central / GATT Client. 

- Local processing avoids a backend dependency for core monitoring. 

- The simulator can reproduce known telemetry scenarios without changing the production architecture. 

##### **Trade-offs** 

- Physical hardware protocol details cannot be finalized until the sensor is selected. 

- BLE permissions, pairing, bonding, reconnect behavior, and packet details require hardware-specific validation. 

- OJT testing cannot prove physical-sensor interoperability before hardware is available. 

##### **Consequences** 

- BleService is designed around the physical sensor contract. 

- BleSimulatorService is isolated to development/testing. 

- Service UUIDs, characteristic UUIDs, packet structure, scaling, byte order, and status fields remain TBD until hardware selection. 

#### **ADR-003 — Database: SQLite over Key-Value Storage** 

##### **Context** 

AquaSmart stores timestamped flow readings, usage records, leak events, sensor metadata, and settings. History and chart features require filtering, grouping, ordering, and time-based queries. 

##### **Options Considered** 

##### **Decision** 

SQLite through expo-sqlite 

##### **Rationale** 

- Flow telemetry and leak history are naturally tabular and time-series oriented. 

- SQL supports aggregation for hourly, daily, and weekly usage. 

- SQLite keeps the MVP local-first and avoids backend infrastructure. 

- Repository separation keeps SQL away from UI components. 

- Manual migrations are acceptable at OJT scale. 

##### **Trade-offs** 

- Migration code must be maintained carefully. 

- Large long-term telemetry datasets may require retention and aggregation strategies. 

- Database encryption is not assumed by the MVP and can be revisited if threat analysis requires it. 

##### **Consequences** 

- All core business data goes through repositories. 

- Schema migrations are versioned in the database module. 

- Indexes are added for timestamps, sensor identifiers, and event lookup patterns. 

#### **ADR-004 — State Management: Zustand for Client State** 

AquaSmart — Combined Project Documentation | Page 2 

##### **Context** 

AquaSmart needs transient application state for BLE connection status, alarm state, settings UI, and development/testing controls. Persistent business data belongs in SQLite rather than being treated as global in-memory state. 

##### **Options Considered** 

##### **Decision** 

Zustand 

##### **Rationale** 

- Simple stores fit a solo React Native project. 

- Connection and alarm state can update without excessive provider nesting. 

- Stores can remain small and focused. 

- Persistent records remain in SQLite rather than duplicating the database in global state. 

##### **Trade-offs** 

- Developers must avoid mutating state incorrectly. 

- Global stores can become overused if repository-backed data is placed there unnecessarily. 

##### **Consequences** 

- connectionStore handles BLE connection state. 

- alarmStore handles active alarm UI/control state. 

- settingsStore handles user preferences. 

- testingStore is development-only and must not become a production dependency. 

#### **ADR-005 — Data Access: Repository Layer with Query Hooks** 

##### **Context** 

UI screens need flow history, usage summaries, leak events, sensor information, and settings. Direct SQL calls from screens would couple presentation code to persistence details and make testing harder. 

##### **Options Considered** 

##### **Decision** 

Repositories for SQLite access, with reusable React hooks for screen consumption 

##### **Rationale** 

- Repositories provide a stable boundary around SQL operations. 

- Hooks expose loading, error, and data states to React screens. 

- Business services can use repositories without depending on UI components. 

- Tests can mock or isolate repository boundaries. 

##### **Trade-offs** 

- More files and abstraction than direct SQL. 

- Query invalidation and refresh behavior must be designed consistently. 

- TanStack Query is useful for read/query state but does not replace the repository layer. 

##### **Consequences** 

AquaSmart — Combined Project Documentation | Page 3 

- Screens do not contain raw SQL. 

- Repositories map to sensors, flow readings, usage, leak events, and settings. 

- Hooks provide reusable access patterns for dashboard, charts, and history screens. 

#### **ADR-006 — Leak Detection: Pattern/State-Based Rules over Machine Learning** 

##### **Context** 

The application must identify suspicious water-flow behavior while avoiding the false assumption that any single high flow reading is a leak. The OJT has limited data and no physical sensor history, so a transparent deterministic approach is more appropriate than machine learning. 

##### **Options Considered** 

##### **Decision** 

Pattern/state-based leak detection 

##### **Rationale** 

- It can reason about persistence, flow behavior, interruptions, data quality, and recovery. 

- Rules are deterministic and straightforward to test with simulator ground truth. 

- It does not require a training dataset. 

- Thresholds and timing can be tuned as configuration rather than hidden model behavior. 

##### **Trade-offs** 

- Rule-based detection may require calibration for different homes and sensor characteristics. 

- It cannot guarantee detection of every real-world leak. 

- A controlled 30-minute continuous suspicious-flow scenario is a test condition, not a universal leak definition. 

##### **Consequences** 

- LeakDetectionService remains independent from the UI. 

- Detection decisions can be unit-tested against scenario-driven telemetry. 

- Future versions can introduce more advanced anomaly detection without changing the UI/data boundaries. 

#### **ADR-007 — Telemetry Handling: Parse and Validate Before Persistence** 

##### **Context** 

BLE data may be malformed, incomplete, duplicated, out of order, or disconnected. Persisting unvalidated data could corrupt usage calculations and leak detection. 

##### **Options Considered** 

##### **Decision** 

Parse and validate telemetry before business analysis and persistence 

##### **Rationale** 

- Separating parsing from validation makes protocol errors easier to isolate. 

- Invalid readings can be rejected or marked with explicit quality information. 

AquaSmart — Combined Project Documentation | Page 4 

- Usage and leak detection receive a cleaner input contract. 

- Controlled simulator scenarios can exercise each validation rule. 

##### **Trade-offs** 

- Some raw packet information may be unavailable after rejection unless diagnostics are intentionally retained. 

- Exact validation rules depend on the final sensor protocol. 

##### **Consequences** 

- TelemetryParserService and TelemetryValidationService remain separate modules. 

- Duplicate, missing, out-of-order, impossible, and malformed data are explicit test cases. 

- Hardware-specific protocol assumptions remain configurable/TBD. 

#### **ADR-008 — Local-First MVP without a Backend** 

##### **Context** 

The core product requirements are monitoring, usage history, leak detection, and local alarm behavior. A cloud backend would add authentication, API hosting, network failure modes, cost, and privacy complexity without being necessary for the MVP. 

##### **Options Considered** 

##### **Decision** 

Local-first architecture with no required backend for MVP 

##### **Rationale** 

- Core functionality can operate without internet. 

- SQLite is sufficient for local history and analysis. 

- Reduces deployment and operational complexity. 

- Improves privacy by avoiding mandatory cloud storage of household water-usage data. 

##### **Trade-offs** 

- No remote access to data in the MVP. 

- Multi-device synchronization is deferred. 

- Cloud-based notifications and remote control require additional security architecture later. 

##### **Consequences** 

- The app must not assume network availability for core monitoring. 

- Future cloud features can be added behind explicit service boundaries. 

- Remote BLE shutoff valve control remains future scope and requires separate safety/security decisions. 

#### **Decision Summary** 

- Expo + React Native is selected for the mobile application, with Android as the primary target. 

- The physical BLE water-flow sensor is the production telemetry source; the BLE simulator is development/testing only. 

- SQLite provides the local relational data store. 

- Zustand manages focused client/UI state, while persistent business data remains in SQLite. 

- Repositories isolate SQLite access from the UI, with hooks providing reusable screen-level data access. 

- Leak detection uses transparent pattern/state-based logic rather than machine learning. 

AquaSmart — Combined Project Documentation | Page 5 

- Telemetry is parsed and validated before it is used for usage calculation and leak analysis. 

- The MVP remains local-first and does not require a cloud backend. 

#### **Deferred Decisions** 

- Final physical BLE sensor model and vendor. 

- Exact BLE service and characteristic UUIDs. 

- Final telemetry packet format, byte order, scaling, units, and status codes. 

- Pairing/bonding/authentication requirements for the selected sensor. 

- Whether database encryption is required after a detailed threat analysis. 

- Exact hardware calibration procedure and leak-detection tuning using physical-sensor data. 

- Remote BLE shutoff valve protocol and safety controls. 

- Future cloud synchronization, remote notifications, or multi-device support. 

#### **Review Principle** 

These ADRs should be revisited when a physical sensor is selected, when native BLE constraints are discovered, or when the project moves beyond the OJT MVP. Hardware-specific decisions should be based on the selected sensor's official protocol documentation and actual Android interoperability testing rather than assumed values. 

|Option|Setup / Maintenance|BLE Support|SQLite|Build Complexity|
|---|---|---|---|---|
|Expo + React Native|Lower|Requires compatible<br>native BLE<br>development build|Yes|Lower|
|Bare React Native|Higher|Full native control|Yes|Higher|
|Native Android only|Higher for cross-layer<br>UI work|Excellent|Yes|Higher|
|Option|Production Fit|Testing U|se|Hardware Realism|
|Physical BLE sensor|Primary|Later hard|ware validation|Highest|
|BLE simulator|Not production|Primary O<br>testing|JT controlled|Controlled|
|Cloud/API telemetry|Not required for|MVP<br>Possible f|uture integration|Indirect|



|Option|Rela|tional Queries|History/C|harts|Migration||Fit|
|---|---|---|---|---|---|---|---|
|SQLite / expo-sqlite|Yes||Strong||Manual/code-ma|naged|High|
|AsyncStorage|No||Weak for|large history|Not relational||Low|
|MMKV|No||Weak for<br>data|relational|Not relational||Low|
|WatermelonDB|Yes||Strong||Built-in patterns||Medium|
|Option||Boilerplate||Fit for Mob|ile UI State|Com|plexity|
|Zustand||Low||High||Low||
|Redux Toolkit||Moderate||High||Mod|erate|
|Context + useReducer||Moderate||Medium||Mod|erate|
|Jotai||Low||High||Low||



AquaSmart — Combined Project Documentation | Page 6 

|Option|Separation|Testability|Reuse|Complexity|
|---|---|---|---|---|
|Repositories + hooks|Strong|Strong|Strong|Moderate|
|Direct SQLite in<br>screens|Weak|Weak|Low|Low initially|
|Single global data<br>service|Medium|Medium|Medium|Medium|
|Option|Data Requirement|Explainability|OJT Fit|Implementation Risk|
|Pattern/state-based<br>rules|Low|High|High|Low|
|Simple threshold +<br>timer|Low|High|Medium|Low|
|Machine learning|High|Lower|Low|High|
|Cloud anomaly service|High|Variable|Low|High|



|Option<br>Data Quality||Debugg|ability|Complexity|
|---|---|---|---|---|
|Parse→Validate→Store<br>High||High||Moderate|
|Store raw payload first<br>Medium||High||Higher downstream|
|Direct parse into database<br>Low||Low||Low initially|
|Option<br>Offline Operation|Infrastruct|ure|Privacy Com|plexity<br>OJT Fit|
|Local-first SQLite<br>Strong|Minimal||Lower|High|
|Cloud backend<br>Weak without sync|Higher||Higher|Low|
|Hybrid sync<br>Medium|Higher||Higher|Medium|



AquaSmart — Combined Project Documentation | Page 7 

