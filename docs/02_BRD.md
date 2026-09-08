**Business Requirements Document (BRD)**

**AquaSmart — Bluetooth Water Flow Meter & Leak Alarm App**

| Document ID | BRD-OJT-01 |
| --- | --- |
| Status | Draft |
| Date | 2026-09-07 |
| Track | Application Development / Mobile IoT |

# 1. Executive Summary

## Product

AquaSmart is a mobile IoT application for monitoring water-flow telemetry through Bluetooth Low Energy (BLE), recording water-consumption data locally, visualizing usage, and identifying flow patterns that may indicate a possible household water leak.

## Problem

Household water leaks can remain unnoticed for long periods, resulting in water wastage, higher water costs, and potential property damage. Users may not have a simple way to monitor water flow in real time or recognize persistent suspicious flow.

## Target Users

The primary target users are homeowners who want to monitor household water usage and receive possible-leak alerts, and plumbers who can use flow information and recorded leak events as supporting information when investigating water-flow problems.

## Proposed Solution

AquaSmart uses a BLE sensor simulator for the OJT implementation because a physical water-flow sensor is not available. The simulator provides BLE telemetry to the mobile application, which receives, parses, validates, stores, and analyzes the readings.

## Business Value

Helps homeowners become aware of persistent or suspicious water flow.

Supports better understanding of household water consumption through usage charts.

Provides a local record of flow readings and possible-leak events.

Demonstrates a practical mobile IoT solution using BLE, SQLite, real-time processing, and data visualization.

# 2. Problem Statement

## Current Problem

Household water flow may continue for long periods without the user noticing.

Users may not have real-time visibility into current water flow and daily consumption.

Persistent or unusual flow patterns can be difficult to identify manually.

A delayed response to a leak can result in unnecessary water consumption and property damage.

## Who Faces It

Homeowners who want simple monitoring of household water consumption.

Users who may not notice continuous water flow when they are away from home or occupied.

Plumbers who need flow information and event history as supporting information during investigation.

## Why Current Solutions Are Insufficient

| Approach | Gap |
| --- | --- |
| Manual observation | Users may not continuously observe water flow and can miss persistent flow. |
| Water meter checking | Periodic checking does not provide continuous in-app monitoring or immediate alarm functionality. |
| Basic usage display | A usage total alone may not identify persistent suspicious flow. |
| AquaSmart OJT prototype | Combines BLE telemetry, local storage, usage analysis, leak detection, and an alarm in one application. |

## Impact of the Problem

Unnecessary water consumption can continue until a problem is noticed.

Household water expenses may increase because of undetected flow.

Prolonged leaks may contribute to damage to walls, floors, furniture, or other property.

# 3. Vision

“Provide a simple mobile system that makes household water flow visible, records consumption, and alerts users when persistent suspicious flow may indicate a leak.”

AquaSmart aims to demonstrate a practical and extensible mobile IoT monitoring solution in which the BLE simulator used for the OJT can later be replaced by a compatible real BLE water-flow sensor.

# 4. Objectives

| ID | Objective | Metric | Target | Timeline |
| --- | --- | --- | --- | --- |
| OBJ-01 | Reliable BLE telemetry processing | Valid simulated readings successfully received, parsed, and validated | 100% of predefined valid test cases | Week 4–7 |
| OBJ-02 | Accurate water-usage calculation | Calculated consumption versus expected test values | Correct for predefined test scenarios | Week 5–7 |
| OBJ-03 | Leak detection | Correct classification of predefined normal and suspicious-flow scenarios | Correct classification in controlled test cases | Week 6–7 |
| OBJ-04 | Alarm correctness | Alarm activates only when configured leak conditions are satisfied | No false alarms in predefined normal scenarios | Week 6–7 |
| OBJ-05 | Local data persistence | Flow and leak data retained and retrievable from SQLite | 100% successful predefined persistence tests | Week 4–7 |
| OBJ-06 | Real-time application responsiveness | Dashboard and charts remain responsive during continuous simulated telemetry | Responsive during defined test load | Week 7–8 |
| OBJ-07 | End-to-end demonstration | Simulator → BLE → parsing → SQLite → analysis → dashboard → alarm | Complete successful demonstration | Week 9 |

# 5. Target Users / Personas

## Persona 1 — Homeowner

| Attribute | Detail |
| --- | --- |
| Role | Household owner / resident |
| Goals | Monitor current water flow, understand consumption, and become aware of possible leaks. |
| Pain Points | May not notice persistent flow or small leaks; wants simple monitoring rather than manual meter checking. |
| Technical Proficiency | Basic to medium |
| Expectations | Clear dashboard, easy-to-understand usage charts, and a noticeable leak warning. |

## Persona 2 — Plumber

| Attribute | Detail |
| --- | --- |
| Role | Plumbing professional |
| Goals | Use flow information and recorded possible-leak events as supporting information when investigating water-flow problems. |
| Pain Points | Intermittent or persistent flow may be difficult to understand from manual observation alone. |
| Technical Proficiency | Medium |
| Expectations | Readable flow information, event timing, duration, and useful historical records. |

# 6. User Journey

## Homeowner Journey

Problem Awareness
→ User notices unexpectedly high water usage or wants to monitor household flow
→ Opens AquaSmart and connects to the BLE sensor simulator
→ Views current flow rate and connection status
→ Uses the app while simulated readings are continuously received
→ Views water-consumption charts to understand usage over time
→ Persistent suspicious flow is analyzed by the leak-detection logic
→ If configured leak conditions are satisfied, a visual warning and loud alarm are triggered
→ User reviews the possible-leak event in leak history
→ Successful Outcome: User is informed of possible persistent water flow and can investigate the source

## Plumber Journey

Investigation Need
→ Plumber needs supporting information about household water-flow behavior
→ Reviews current flow and connection status
→ Examines recorded water-flow history and usage patterns
→ Reviews possible-leak event timing and duration
→ Uses the information as supporting evidence during investigation
→ Successful Outcome: Flow behavior and possible-leak events are available in an organized form

# 7. Business Use Cases

**UC-001: Monitor Water Flow**

Actor: Homeowner

Goal: View current water-flow information and BLE connection status.

**UC-002: Record Flow Telemetry**

Actor: AquaSmart System

Goal: Receive valid BLE telemetry and store flow readings with timestamps.

**UC-003: View Water Usage**

Actor: Homeowner / Plumber

Goal: View calculated water consumption through dashboard and charts.

**UC-004: Detect Possible Leak**

Actor: AquaSmart System

Goal: Analyze flow patterns and identify a possible leak when configured conditions are satisfied.

**UC-005: Receive Leak Alert**

Actor: Homeowner

Goal: Receive a visual warning and loud alarm for a detected possible-leak condition.

**UC-006: Review Leak History**

Actor: Homeowner / Plumber

Goal: View previously recorded possible-leak events and relevant timing information.

**UC-007: Handle BLE/Data Errors**

Actor: AquaSmart System

Goal: Handle disconnections, missing readings, invalid telemetry, and other data-quality problems.

# 8. Functional Business Requirements

| ID | Requirement | Description | Priority | Business Justification | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- |
| BR-001 | BLE Telemetry Reception | Receive simulated water-flow telemetry through BLE. | Must Have | Represents the sensor-to-application communication path. | Valid predefined simulator readings are received by AquaSmart. |
| BR-002 | BLE Data Parsing | Decode received telemetry into usable flow measurements. | Must Have | Raw BLE data must be converted into application-level values. | Known test packets produce the expected flow values. |
| BR-003 | Data Validation | Validate incoming readings before processing and storage. | Must Have | Invalid data must not be interpreted as real water flow. | Invalid predefined packets/readings are rejected or handled safely. |
| BR-004 | SQLite Data Storage | Store validated readings, timestamps, usage information, and leak events locally. | Must Have | Provides historical data and supports offline/local operation. | Stored records can be retrieved correctly in predefined tests. |
| BR-005 | Water Usage Calculation | Calculate estimated water consumption from flow-rate readings and elapsed time. | Must Have | Converts telemetry into useful consumption information. | Calculated values match expected predefined test values. |
| BR-006 | Real-Time Dashboard | Display current flow rate, connection status, today's usage, and leak status/risk. | Must Have | Provides immediate visibility into system state. | Dashboard updates correctly during simulated telemetry. |
| BR-007 | Usage Charts | Display hourly, daily, and weekly water-consumption data. | Must Have | Helps users understand water usage over time. | Chart values correspond to stored/calculated usage data. |
| BR-008 | Leak Detection | Analyze flow magnitude, persistence, interruptions, and data quality to identify possible leaks. | Must Have | Supports early awareness of persistent suspicious flow. | Predefined normal and leak scenarios are classified correctly. |
| BR-009 | Leak Alarm | Trigger a loud siren and visual warning when configured leak conditions are satisfied. | Must Have | Provides immediate user notification. | Alarm triggers only when the required conditions are satisfied. |
| BR-010 | Leak History | Record and display detected possible-leak events with relevant timing information. | Must Have | Allows users to review previous events. | Detected events are stored and displayed correctly. |
| BR-011 | BLE & Data Error Handling | Handle disconnections, missing readings, invalid telemetry, and other data-quality issues. | Must Have | Prevents communication/data problems from becoming false water-flow or leak events. | Predefined error scenarios are handled without false leak alarms. |
| BR-012 | Testing/Simulation Controls | Provide predefined flow scenarios for testing normal and abnormal conditions. | Should Have | Makes controlled validation of the leak-detection system possible. | Predefined scenarios can be executed and observed. |
| BR-013 | Remote BLE Shutoff Valve | Send a BLE command to a compatible remote shutoff valve. | Future / Stretch | Could enable automated response to a possible leak. | Demonstrated only if compatible hardware or a suitable simulation is available. |

# 9. Non-Functional Business Requirements

| Category | Requirement | Target |
| --- | --- | --- |
| Performance | Real-time data processing | Dashboard remains responsive during continuous simulator telemetry. |
| Performance | Database operations | Flow and event records are stored/retrieved reliably under the defined prototype test load. |
| Reliability | Data validation | Invalid/missing telemetry does not create false flow or leak events in predefined tests. |
| Reliability | Leak alarm behavior | Alarm activates only when configured leak conditions are satisfied. |
| Data Integrity | SQLite persistence | Validated readings and leak events remain correctly retrievable after app restart. |
| Compatibility | Mobile application | Target Android implementation for the OJT demonstration. |
| BLE | Connection handling | Application reports/handles BLE connection loss and recovery appropriately. |
| Usability | Dashboard clarity | Current flow, usage, connection, and leak status are understandable at a glance. |
| Scalability | Future sensor replacement | Application architecture keeps the data source separate so a compatible real BLE sensor can replace the simulator. |

# 10. Success Metrics

| Metric | Target | Measurement |
| --- | --- | --- |
| Valid BLE telemetry processing | 100% of predefined valid test cases | Compare simulator output with parsed application values. |
| Leak scenario classification | Correct classification of predefined normal and leak scenarios | Controlled simulator test cases. |
| False alarms | No false alarms in predefined normal-usage scenarios | Normal-flow test suite. |
| Water-usage calculation | Accurate against expected test values | Compare calculated totals with known scenario values. |
| SQLite persistence | Successful storage and retrieval in predefined tests | Database test cases. |
| Dashboard responsiveness | Responsive during continuous simulated data processing | Performance observation/testing. |
| End-to-end operation | Complete successful flow from simulator to alarm | Final demonstration. |

# 11. Assumptions

A physical water-flow sensor is not available for the OJT implementation.

A BLE sensor simulator will provide the telemetry used for development and demonstration.

The simulator is intended to represent the behavior of a compatible BLE water-flow sensor.

The exact BLE packet structure used by the simulator will be defined as part of the technical design.

A compatible real BLE water-flow sensor may replace the simulator in future work.

Water-consumption calculations are estimates derived from the received flow-rate telemetry.

The 30-minute condition is a controlled OJT test condition and is not a claim of universal real-world leak-detection accuracy.

A future remote shutoff valve requires compatible hardware and is outside the required core implementation.

# 12. Constraints

| Constraint | Description |
| --- | --- |
| Hardware | No physical water-flow sensor is available for the OJT project. |
| Simulator Dependency | BLE simulator is required to provide the sensor-like telemetry used for testing. |
| Infrastructure | The core OJT prototype uses local SQLite rather than a backend server. |
| Duration | Implementation and documentation are planned across 9 weeks. |
| Team | The project is being developed by one student. |
| BLE | Actual sensor packet formats cannot be assumed; future real hardware must provide its documented BLE specification. |
| Future Hardware | Remote shutoff valve control is a stretch goal and depends on compatible hardware. |
| Scope | Cloud services and unrelated smart-home features are outside the core project scope. |

# 13. Risks

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| BLE simulator/peripheral communication is difficult to implement | Medium | High | Develop and test BLE communication early and isolate BLE-specific code from application logic. |
| Telemetry parsing errors | Medium | High | Define a controlled simulator packet format and create parser test cases. |
| False leak detection | Medium | High | Use predefined normal, continuous, intermittent, and error scenarios and test the detection logic before final integration. |
| BLE disconnection or missing readings | Medium | Medium | Implement explicit connection and data-quality states and test disconnect/reconnect scenarios. |
| SQLite data errors | Low–Medium | High | Use a defined schema, validation, and database tests. |
| Real-time processing affects responsiveness | Medium | Medium | Use a controlled sampling interval and measure processing/database/dashboard responsiveness. |
| Scope creep | High | High | Prioritize core BLE, storage, usage, dashboard, leak detection, alarm, and testing features; keep valve control and other enhancements as stretch goals. |
| Real-world sensor compatibility | Medium | Medium | Do not claim physical sensor compatibility until an actual sensor specification and hardware test are available. |

# 14. MVP Scope

## IN SCOPE

BLE sensor simulator providing realistic flow telemetry.

BLE communication and telemetry reception.

BLE data parsing and validation.

SQLite storage of validated flow readings and leak events.

Water-usage calculation and time-based aggregation.

Real-time dashboard with flow rate, connection status, today's usage, and leak status/risk.

Hourly, daily, and weekly water-usage charts.

Leak detection using analyzed flow patterns and the defined controlled 30-minute persistent-flow condition.

Visual leak warning and loud alarm.

Leak history.

BLE/data error handling.

Testing and simulation controls for predefined scenarios.

## OUT OF SCOPE (MVP)

Physical water-flow sensor deployment and physical sensor testing.

Automatic control of a real water shutoff valve.

Cloud backend and remote data synchronization.

Multi-sensor production deployment.

Machine-learning-based leak detection.

Claims of universal real-world leak-detection accuracy.

# 15. Future Scope

Remote BLE shutoff valve control using compatible hardware.

Water bill calculator based on consumption and a user-defined tariff.

Weekly and monthly usage reports.

Smart notifications for possible leaks or unusual water usage.

Multiple compatible BLE flow sensors.

Advanced simulator scenarios for more realistic household usage patterns.

Integration with a compatible real BLE water-flow sensor.

*AquaSmart — Business Requirements Document | Polaris School of Technology*
