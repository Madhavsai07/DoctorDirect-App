**Database / Data Design**

**AquaSmart — Bluetooth Water Flow Meter & Leak Alarm App**

| Document ID | DB-OJT-AQ-01 |
| --- | --- |
| Status | Draft |
| Date | 2026-09-07 |
| Track | Application Development / Mobile IoT |

# 1. Data Requirements

AquaSmart stores operational data locally in a SQLite database on the Android device. The database is designed to support BLE telemetry processing, water-usage calculation, leak detection, leak history, and application settings.

| Entity | What It Stores |
| --- | --- |
| sensors | Registered/connected sensor identity and basic BLE device information used by the application. |
| flow_readings | Validated water-flow telemetry received from the BLE simulator or a future compatible sensor. |
| usage_records | Calculated water-consumption intervals and/or aggregated usage values. |
| leak_events | Possible-leak events detected by the leak-detection engine. |
| settings | Application preferences such as leak-detection configuration and alarm settings. |

# 2. Entities

- Sensor — identifies the BLE flow sensor/simulator used as the telemetry source.
- FlowReading — one validated flow measurement received through BLE, with timestamp and protocol information.
- UsageRecord — estimated water volume derived from flow rate and elapsed time.
- LeakEvent — a recorded possible-leak condition with start/end time, duration, and supporting flow information.
- Setting — key-value application preference stored locally.
# 3. Entity Relationships

Sensor ──(1:many)──> FlowReading ──(1:many/time-derived)──> UsageRecord

FlowReading ──(many:0..1)──> LeakEvent
                 (readings may contribute evidence to a detected event)

Settings ── (key-value, no FK)

# 4. ER Diagram

┌────────────────────┐
│       SENSOR       │
├────────────────────┤
│ id PK              │
│ device_name        │
│ device_identifier  │
│ created_at         │
│ last_seen_at       │
└─────────┬──────────┘
          │ 1
          │
          │ many
┌─────────▼──────────┐
│   FLOW_READINGS    │
├────────────────────┤
│ id PK              │
│ sensor_id FK       │
│ flow_rate_lpm      │
│ recorded_at        │
│ sequence_number    │
│ status              │
│ data_quality       │
└─────────┬──────────┘
          │
          ├───────────────┐
          │               │
          ▼               ▼
┌─────────────────┐   ┌────────────────────┐
│  USAGE_RECORDS  │   │    LEAK_EVENTS     │
├─────────────────┤   ├────────────────────┤
│ id PK           │   │ id PK              │
│ sensor_id FK    │   │ sensor_id FK       │
│ start_at        │   │ start_at           │
│ end_at          │   │ end_at             │
│ elapsed_seconds │   │ duration_seconds   │
│ volume_liters   │   │ peak_flow_lpm      │
└─────────────────┘   │ avg_flow_lpm       │
                      │ status             │
                      └────────────────────┘

┌────────────────────┐
│      SETTINGS      │
├────────────────────┤
│ key PK             │
│ value              │
│ updated_at         │
└────────────────────┘

# 5. Schema

## Table: `sensors`

| Field | Type | PK | Nullable | Default | Description |
| --- | --- | --- | --- | --- | --- |
| id | INTEGER | ✓ | No | AUTOINCREMENT | Primary key. |
| device_name | TEXT | — | No | — | BLE advertised/display name. |
| device_identifier | TEXT | — | No | — | Application-level identifier for the simulator/sensor; unique where applicable. |
| created_at | INTEGER | — | No | Current timestamp | Unix timestamp when the sensor record is created. |
| last_seen_at | INTEGER | — | Yes | NULL | Timestamp of the most recent valid telemetry received. |

## Table: `flow_readings`

| Field | Type | PK | Nullable | Default | Description |
| --- | --- | --- | --- | --- | --- |
| id | INTEGER | ✓ | No | AUTOINCREMENT | Primary key. |
| sensor_id | INTEGER | — | No | — | FK → sensors.id. |
| flow_rate_lpm | REAL | — | No | — | Validated flow rate in litres per minute. |
| recorded_at | INTEGER | — | No | — | Application receipt timestamp, or protocol timestamp if defined. |
| sequence_number | INTEGER | — | Yes | NULL | Simulator/protocol sequence number when provided. |
| status | TEXT | — | No | 'valid' | Telemetry status according to the defined simulator protocol. |
| data_quality | TEXT | — | No | 'good' | Quality state such as good, duplicate, out_of_order, invalid, or missing. |

## Table: `usage_records`

| Field | Type | PK | Nullable | Default | Description |
| --- | --- | --- | --- | --- | --- |
| id | INTEGER | ✓ | No | AUTOINCREMENT | Primary key. |
| sensor_id | INTEGER | — | No | — | FK → sensors.id. |
| start_at | INTEGER | — | No | — | Beginning of the flow interval. |
| end_at | INTEGER | — | No | — | End of the flow interval. |
| elapsed_seconds | REAL | — | No | — | Elapsed time used for the volume calculation. |
| flow_rate_lpm | REAL | — | No | — | Flow rate used for the interval calculation. |
| volume_liters | REAL | — | No | 0.0 | Estimated volume for the interval. |

## Table: `leak_events`

| Field | Type | PK | Nullable | Default | Description |
| --- | --- | --- | --- | --- | --- |
| id | INTEGER | ✓ | No | AUTOINCREMENT | Primary key. |
| sensor_id | INTEGER | — | No | — | FK → sensors.id. |
| start_at | INTEGER | — | No | — | Time suspicious persistent flow began for the event. |
| end_at | INTEGER | — | Yes | NULL | Time the event ended/resolved; NULL while active. |
| duration_seconds | REAL | — | Yes | NULL | Computed event duration. |
| peak_flow_lpm | REAL | — | Yes | NULL | Highest valid flow observed during the event. |
| avg_flow_lpm | REAL | — | Yes | NULL | Average flow observed during the event. |
| status | TEXT | — | No | 'active' | Event state such as active, acknowledged, or resolved. |
| reason | TEXT | — | Yes | NULL | Detection reason or classification summary. |

## Table: `settings`

| Field | Type | PK | Nullable | Default | Description |
| --- | --- | --- | --- | --- | --- |
| key | TEXT | ✓ | No | — | Setting key. |
| value | TEXT | — | No | — | Stored setting value; JSON/text representation may be used. |
| updated_at | INTEGER | — | No | Current timestamp | Last update timestamp. |

Example settings keys:

- leak_duration_seconds
- alarm_enabled
- alarm_volume
- flow_threshold_lpm
- theme
# 6. Relationships

| Relationship | Type | Description |
| --- | --- | --- |
| Sensor → FlowReading | One-to-many | A sensor/simulator can provide many validated flow readings. |
| Sensor → UsageRecord | One-to-many | A sensor can produce many calculated consumption intervals. |
| Sensor → LeakEvent | One-to-many | A sensor can produce multiple possible-leak events over time. |
| FlowReading → UsageRecord | Many-to-zero/one | A validated reading can contribute to an interval calculation; exact linkage is implementation-dependent. |
| Settings → Application | Key-value | Settings are application preferences and do not require foreign keys. |

# 7. Indexing Strategy

| Table | Index | Type | Reason |
| --- | --- | --- | --- |
| sensors | device_identifier | UNIQUE B-tree | Identify a simulator/sensor efficiently and avoid duplicate registered identities. |
| flow_readings | sensor_id, recorded_at | B-tree | Efficient time-range queries for telemetry and usage analysis. |
| flow_readings | recorded_at | B-tree | Retrieve recent readings and process time-ordered data. |
| flow_readings | sequence_number | B-tree | Assist duplicate/out-of-order detection when sequence numbers are present. |
| usage_records | sensor_id, start_at | B-tree | Efficient usage history and time-range aggregation. |
| leak_events | sensor_id, start_at | B-tree | Display leak history in chronological order. |
| leak_events | status | B-tree | Find active/unresolved events quickly. |
| settings | key | PRIMARY KEY | Fast lookup of application preferences. |

# 8. Query Patterns

| Query | SQL Pattern | Used By |
| --- | --- | --- |
| Latest flow | SELECT * FROM flow_readings WHERE sensor_id = ? ORDER BY recorded_at DESC LIMIT 1 | Dashboard |
| Flow history | SELECT * FROM flow_readings WHERE sensor_id = ? AND recorded_at BETWEEN ? AND ? ORDER BY recorded_at ASC | Usage / analysis |
| Daily usage | SELECT date(datetime(start_at,'unixepoch')), SUM(volume_liters) FROM usage_records WHERE start_at BETWEEN ? AND ? GROUP BY date(datetime(start_at,'unixepoch')) | Usage charts |
| Weekly usage | SELECT strftime('%Y-%W', datetime(start_at,'unixepoch')), SUM(volume_liters) FROM usage_records WHERE start_at BETWEEN ? AND ? GROUP BY strftime('%Y-%W', datetime(start_at,'unixepoch')) | Weekly chart |
| Leak history | SELECT * FROM leak_events WHERE sensor_id = ? ORDER BY start_at DESC LIMIT ? OFFSET ? | Leak History |
| Active leak | SELECT * FROM leak_events WHERE sensor_id = ? AND status = 'active' ORDER BY start_at DESC LIMIT 1 | Dashboard / Alarm |
| Sensor lookup | SELECT * FROM sensors WHERE device_identifier = ? | BLE service |
| Setting lookup | SELECT value FROM settings WHERE key = ? | Settings service |

# 9. Data Integrity

| Rule | Implementation |
| --- | --- |
| Valid flow rate | Application/protocol validation must reject malformed or impossible flow values before insertion. |
| Sensor reference | FOREIGN KEY on flow_readings.sensor_id, usage_records.sensor_id, and leak_events.sensor_id. |
| Non-negative volume | CHECK (volume_liters >= 0). |
| Non-negative duration | CHECK (elapsed_seconds >= 0) and CHECK (duration_seconds >= 0). |
| Valid event status | CHECK status is one of the defined application states. |
| Timestamp ordering | Application logic ensures end_at is not earlier than start_at. |
| Sequence handling | Duplicate or out-of-order telemetry is identified before it can corrupt usage calculations. |
| Settings uniqueness | PRIMARY KEY on settings.key ensures one current value per setting. |

# 10. Data Lifecycle

## Sensor

BLE simulator/sensor discovered → identified → connected → telemetry received → last_seen_at updated → remains available as a source record for historical readings.

## Flow Reading

BLE packet received → parsed → validated → timestamped → stored → used by live dashboard / usage / leak analysis → retained as historical telemetry.

## Usage Record

Two valid readings define an interval → elapsed time calculated → volume estimated from flow rate × elapsed time → usage record stored → included in hourly/daily/weekly aggregation.

## Leak Event

Suspicious persistent flow begins → detection state maintained → configured conditions satisfied → event created/activated → alarm triggered → event continues until recovery → event closed/resolved → appears in Leak History.

## Settings

Default setting created → user changes supported preference → setting updated locally → application reads current value when required.

# 11. Migration System

The database uses a version-based migration approach. Each schema change is represented by a numbered migration. "
"Existing user data should be preserved whenever possible, and migrations should be executed atomically.

Example structure:
MIGRATIONS = [
  version 1 → create sensors, flow_readings, usage_records, leak_events, settings
  version 2 → future additive schema change
]

Migration runner:
1. Read current database schema version.
2. Find migrations with a higher version.
3. Execute each migration in order.
4. Commit the migration atomically.
5. Update the stored schema version.

- Migrations should be additive where practical.
- Destructive schema changes require an explicit migration and data-preservation strategy.
- Each migration should be tested before being included in a release.
- Migration failure must not leave the database in a partially applied state.
# 12. Backup and Recovery

| Scenario | Behavior |
| --- | --- |
| App crash during telemetry processing | Previously committed SQLite records remain available; the next valid reading can resume normal processing. |
| App crash during leak event | An active event can be identified from its stored status and recovered/reconciled on next launch. |
| SQLite write failure | Repository layer catches the error, logs diagnostics, and reports the failure to the application layer. |
| BLE disconnect | No fabricated zero-flow reading is inserted; connection/data-quality state is updated and reconnection can be attempted. |
| Invalid packet | Packet is rejected or recorded diagnostically according to the defined protocol; it is not used as valid flow. |
| Accidental event deletion | If deletion is supported, it is treated as a permanent local operation unless a future backup/export feature is implemented. |
| App uninstall | Local SQLite data is removed by the platform; future export/backup can be considered as an enhancement. |

*AquaSmart — Database / Data Design | Polaris School of Technology*
