**Project Overview — AquaSmart: Bluetooth Water Flow Meter & Leak Alarm App**

**Project Code: OJT-AQ-01
**Track: Application Development / Mobile IoT
Duration: 9 Weeks
Team Size: 1 Student
Skill Level: Intermediate

# Project Identity

| Field | Value |
| --- | --- |
| Project Name | AquaSmart — Bluetooth Water Flow Meter & Leak Alarm App |
| Track | Application Development / Mobile IoT |
| Technology Stack | JavaScript, React Native, Expo, react-native-ble-plx, expo-sqlite, expo-av, Charting Library, BLE Sensor Simulator |
| Duration | 9 Weeks |
| Team Size | 1 Student |
| Skill Level | Intermediate |
| Institution | Polaris School of Technology |
| Mentor | Kshitiz Dhooria |

# Problem Summary

Water wastage — continuous or unusual water flow can consume significant amounts of water.

Increased water costs — undetected flow can unnecessarily increase household water consumption.

Property damage — prolonged leaks may damage walls, floors, furniture, and other parts of a property.

Lack of real-time monitoring — homeowners often do not have a simple way to observe water flow and identify suspicious usage patterns.

The result is that a small or persistent water-flow problem may continue until the user notices it manually or significant damage has already occurred.

# Proposed Solution

AquaSmart is a React Native mobile application that monitors water-flow telemetry received through Bluetooth Low Energy (BLE) and helps users identify possible water leaks.

Receive BLE flow telemetry from a BLE sensor simulator representing a water-flow sensor.

Parse and validate sensor data to convert BLE telemetry into usable flow measurements.

Store flow readings locally using SQLite for historical analysis.

Calculate water consumption from flow-rate readings and elapsed time.

Display real-time information such as current flow rate, BLE connection status, today's usage, and leak status.

Visualize water usage through hourly, daily, and weekly charts.

Analyze flow patterns to identify persistent suspicious water flow.

Trigger a loud alarm when the configured leak-detection conditions are satisfied.

Maintain leak history for previously detected possible-leak events.

For the OJT implementation, a BLE sensor simulator is used because a physical water-flow sensor is not available. The system architecture is intended to allow a compatible real BLE flow sensor to replace the simulator in the future.

# Core Capabilities

**1. BLE Data Simulator — **Generate realistic water-flow telemetry representing normal usage, continuous flow, intermittent flow, and other test scenarios.

**2. BLE Communication & Data Parsing — **Receive simulated BLE telemetry, decode it, validate it, and convert it into usable flow measurements.

**3. SQLite Data Storage — **Store validated flow readings, timestamps, usage information, and leak events locally.

**4. Water Usage Calculation — **Estimate water consumption from flow-rate readings and elapsed time and organize the data for analysis.

**5. Real-Time Dashboard — **Display current flow rate, BLE connection status, today's water usage, and current leak status/risk.

**6. Water Usage Charts — **Visualize hourly, daily, and weekly water-consumption data.

**7. Leak Detection — **Analyze flow magnitude, persistence, interruptions, and data quality to identify conditions that may indicate a possible leak. Persistent suspicious flow, including the defined 30-minute condition, is evaluated by the detection logic.

**8. Leak Alarm — **Trigger a loud siren and visual warning when the configured leak-detection conditions are satisfied.

**9. Leak History — **Record and display details of detected possible-leak events.

**10. BLE & Data Error Handling — **Handle BLE disconnections, missing readings, invalid telemetry, and other data-quality problems without incorrectly treating them as water flow or a leak.

# Business Value

| Stakeholder | Value |
| --- | --- |
| Homeowners | Monitor household water flow and receive alerts about possible leaks. |
| Plumbers | Use flow information and leak events as supporting information when investigating water-flow problems. |
| Water-Conscious Users | Understand consumption patterns and identify unusual or persistent flow. |
| Students / Portfolio | Demonstrates React Native, BLE communication, telemetry parsing, SQLite, real-time processing, data visualization, and IoT-oriented application development. |

# What Makes This Different from a Basic College Project

Real BLE communication architecture rather than only generating values inside the app.

BLE sensor simulation that represents a water-flow sensor for OJT testing.

Telemetry parsing and validation between raw BLE data and application-level measurements.

Local SQLite persistence for continuous flow readings and leak events.

Real-time data processing for dashboard updates and leak analysis.

Time-series water-usage analysis for hourly, daily, and weekly visualization.

Rule/state-based leak detection rather than relying only on a simple timer.

BLE and sensor-error handling for disconnections, missing data, and invalid telemetry.

Audio and visual leak alarms for possible leak conditions.

Future hardware extensibility, allowing the simulator to eventually be replaced by a compatible real BLE water-flow sensor.

Future IoT expansion through a possible BLE-controlled remote water shutoff valve.

*AquaSmart — Project Overview | Polaris School of Technology*
