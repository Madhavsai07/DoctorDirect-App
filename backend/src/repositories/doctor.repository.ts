import { pool } from '../db/pool';
import { PoolClient } from 'pg';

// ─────────────────────────────────────────────────────────────────────────────
// Types matching the Milestone 2 PostgreSQL schema
// ─────────────────────────────────────────────────────────────────────────────

export interface DbDoctorListing {
  doctor_id: string;
  user_id: string;
  email?: string;
  phone?: string | null;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  specialization_id: string;
  specialization_name: string;
  license_number: string;
  experience_years: number;
  consultation_fee: number;
  bio: string | null;
  qualification: string | null;
  id_card_url: string | null;
  is_available: boolean;
  rating: number;
  verification_status: 'pending' | 'approved' | 'rejected';
  verified_at: Date | null;
  verified_by: string | null;
  user_created_at: Date | null;
}

export interface DbSpecialization {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export interface DbAvailability {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
}

export interface DbSlot {
  id: string;
  doctor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'reserved' | 'booked' | 'cancelled' | 'blocked';
  is_manual_override: boolean;
}

export interface DbScheduleOverride {
  id: string;
  doctor_id: string;
  override_date: string;
  is_blocked: boolean;
  windows: Array<{
    id: string;
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
  }>;
}

export interface ScheduleWindowDto {
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

export interface UpsertAvailabilityDto {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
}

async function lockDoctorSchedule(client: PoolClient, doctorId: string): Promise<void> {
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1::text))', [doctorId]);
}

export class DoctorRepository {

  async listSpecializations(): Promise<DbSpecialization[]> {
    const res = await pool.query<DbSpecialization>(
      'SELECT id, name, description, icon FROM specializations ORDER BY name ASC'
    );
    return res.rows;
  }

  async listDoctors(opts: {
    search?: string;
    specializationId?: string;
    limit?: number;
    offset?: number;
    verificationStatus?: 'pending' | 'approved' | 'rejected';
  }): Promise<DbDoctorListing[]> {
    const { search, specializationId, limit = 50, offset = 0, verificationStatus } = opts;
    const conditions: string[] = ['u.is_active = TRUE'];
    const params: unknown[] = [];

    // Default to approved-only for patient-facing queries
    if (verificationStatus) {
      params.push(verificationStatus);
      conditions.push(`d.verification_status = $${params.length}`);
    } else {
      conditions.push(`d.verification_status = 'approved'`);
    }

    if (specializationId) {
      params.push(specializationId);
      conditions.push(`d.specialization_id = $${params.length}`);
    }

    if (search && search.trim().length > 0) {
      params.push(`%${search.trim().toLowerCase()}%`);
      const idx = params.length;
      conditions.push(
        `(LOWER(u.first_name || ' ' || u.last_name) LIKE $${idx} OR LOWER(s.name) LIKE $${idx})`
      );
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);
    const limitIdx = params.length - 1;
    const offsetIdx = params.length;

    const sql = `
      SELECT
        d.id            AS doctor_id,
        u.id            AS user_id,
        u.email,
        u.phone,
        u.first_name,
        u.last_name,
        u.avatar_url,
        u.created_at    AS user_created_at,
        d.specialization_id,
        s.name          AS specialization_name,
        d.license_number,
        d.experience_years,
        d.consultation_fee,
        d.bio,
        d.qualification,
        d.id_card_url,
        EXISTS (
          SELECT 1
          FROM availability av
          WHERE av.doctor_id = d.id AND av.is_active = TRUE
        ) AS is_available,
        d.rating,
        d.verification_status,
        d.verified_at,
        d.verified_by
      FROM doctors d
      JOIN users u ON u.id = d.user_id
      JOIN specializations s ON s.id = d.specialization_id
      ${where}
      ORDER BY d.rating DESC, u.first_name ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;
    const res = await pool.query<DbDoctorListing>(sql, params);
    return res.rows;
  }

  async findDoctorById(doctorId: string): Promise<DbDoctorListing | null> {
    const sql = `
      SELECT
        d.id            AS doctor_id,
        u.id            AS user_id,
        u.email,
        u.phone,
        u.first_name,
        u.last_name,
        u.avatar_url,
        u.created_at    AS user_created_at,
        d.specialization_id,
        s.name          AS specialization_name,
        d.license_number,
        d.experience_years,
        d.consultation_fee,
        d.bio,
        d.qualification,
        d.id_card_url,
        EXISTS (
          SELECT 1
          FROM availability av
          WHERE av.doctor_id = d.id AND av.is_active = TRUE
        ) AS is_available,
        d.rating,
        d.verification_status,
        d.verified_at,
        d.verified_by
      FROM doctors d
      JOIN users u ON u.id = d.user_id
      JOIN specializations s ON s.id = d.specialization_id
      WHERE d.id = $1
    `;
    const res = await pool.query<DbDoctorListing>(sql, [doctorId]);
    return res.rows[0] ?? null;
  }

  async findDoctorByUserId(userId: string): Promise<DbDoctorListing | null> {
    const sql = `
      SELECT
        d.id            AS doctor_id,
        u.id            AS user_id,
        u.email,
        u.phone,
        u.first_name,
        u.last_name,
        u.avatar_url,
        u.created_at    AS user_created_at,
        d.specialization_id,
        s.name          AS specialization_name,
        d.license_number,
        d.experience_years,
        d.consultation_fee,
        d.bio,
        d.qualification,
        d.id_card_url,
        EXISTS (
          SELECT 1
          FROM availability av
          WHERE av.doctor_id = d.id AND av.is_active = TRUE
        ) AS is_available,
        d.rating,
        d.verification_status,
        d.verified_at,
        d.verified_by
      FROM doctors d
      JOIN users u ON u.id = d.user_id
      JOIN specializations s ON s.id = d.specialization_id
      WHERE d.user_id = $1 AND u.is_active = TRUE
    `;
    const res = await pool.query<DbDoctorListing>(sql, [userId]);
    return res.rows[0] ?? null;
  }

  // ── Admin verification methods ──────────────────────────────────────────────

  async updateVerificationStatus(
    doctorId: string,
    status: 'approved' | 'rejected',
    adminUserId: string
  ): Promise<DbDoctorListing | null> {
    const res = await pool.query<{ id: string }>(
      `UPDATE doctors
       SET verification_status = $1,
           verified_at = NOW(),
           verified_by = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id`,
      [status, adminUserId, doctorId]
    );
    if (!res.rows[0]) return null;
    return this.findDoctorById(doctorId);
  }

  async getDoctorVerificationStatus(doctorId: string): Promise<string | null> {
    const res = await pool.query<{ verification_status: string }>(
      'SELECT verification_status FROM doctors WHERE id = $1',
      [doctorId]
    );
    return res.rows[0]?.verification_status ?? null;
  }

  async getAvailabilityForDoctor(doctorId: string): Promise<DbAvailability[]> {
    const res = await pool.query<DbAvailability>(
      `SELECT id, doctor_id, day_of_week, start_time::text, end_time::text,
              slot_duration_minutes, is_active
       FROM availability
       WHERE doctor_id = $1
       ORDER BY day_of_week ASC, start_time ASC`,
      [doctorId]
    );
    return res.rows;
  }

  async getScheduleOverrides(doctorId: string, fromDate: string, toDate: string): Promise<DbScheduleOverride[]> {
    const res = await pool.query<DbScheduleOverride>(
      `SELECT o.id, o.doctor_id, o.override_date::text, o.is_blocked,
              COALESCE(
                json_agg(json_build_object(
                  'id', w.id,
                  'start_time', w.start_time::text,
                  'end_time', w.end_time::text,
                  'slot_duration_minutes', w.slot_duration_minutes
                ) ORDER BY w.start_time) FILTER (WHERE w.id IS NOT NULL),
                '[]'::json
              ) AS windows
       FROM schedule_date_overrides o
       LEFT JOIN schedule_date_override_windows w ON w.override_id = o.id
       WHERE o.doctor_id = $1 AND o.override_date BETWEEN $2::date AND $3::date
       GROUP BY o.id
       ORDER BY o.override_date`,
      [doctorId, fromDate, toDate]
    );
    return res.rows;
  }

  async saveScheduleOverride(
    doctorId: string,
    date: string,
    isBlocked: boolean,
    windows: ScheduleWindowDto[]
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await lockDoctorSchedule(client, doctorId);
      const saved = await client.query<{ id: string }>(
        `INSERT INTO schedule_date_overrides (doctor_id, override_date, is_blocked)
         VALUES ($1, $2::date, $3)
         ON CONFLICT (doctor_id, override_date)
         DO UPDATE SET is_blocked = EXCLUDED.is_blocked, updated_at = NOW()
         RETURNING id`,
        [doctorId, date, isBlocked]
      );
      const overrideId = saved.rows[0].id;
      await client.query('DELETE FROM schedule_date_override_windows WHERE override_id = $1', [overrideId]);
      if (!isBlocked) {
        for (const window of windows) {
          await client.query(
            `INSERT INTO schedule_date_override_windows
               (override_id, start_time, end_time, slot_duration_minutes)
             VALUES ($1, $2::time, $3::time, $4)`,
            [overrideId, window.start_time, window.end_time, window.slot_duration_minutes]
          );
        }
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteScheduleOverride(doctorId: string, date: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await lockDoctorSchedule(client, doctorId);
      const res = await client.query(
        'DELETE FROM schedule_date_overrides WHERE doctor_id = $1 AND override_date = $2::date',
        [doctorId, date]
      );
      await client.query('COMMIT');
      return (res.rowCount ?? 0) > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async upsertAvailability(
    doctorId: string,
    dto: UpsertAvailabilityDto
  ): Promise<DbAvailability> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await lockDoctorSchedule(client, doctorId);

      if (![15, 30, 45, 60].includes(dto.slot_duration_minutes)) {
        throw Object.assign(new Error('Slot duration must be 15, 30, 45, or 60 minutes'), { status: 422 });
      }
      if (dto.end_time <= dto.start_time) {
        throw new Error('end_time must be after start_time');
      }

      const overlapRes = await client.query<{ id: string }>(
        `SELECT id FROM availability
         WHERE doctor_id = $1
           AND day_of_week = $2
           AND is_active = TRUE
           AND start_time < $4::time
           AND end_time   > $3::time`,
        [doctorId, dto.day_of_week, dto.start_time, dto.end_time]
      );
      if (overlapRes.rowCount && overlapRes.rowCount > 0) {
        throw new Error('Availability window overlaps with an existing active window on this day');
      }

      const res = await client.query<DbAvailability>(
        `INSERT INTO availability
           (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
         VALUES ($1, $2, $3::time, $4::time, $5, $6)
         RETURNING id, doctor_id, day_of_week,
                   start_time::text, end_time::text,
                   slot_duration_minutes, is_active`,
        [doctorId, dto.day_of_week, dto.start_time, dto.end_time, dto.slot_duration_minutes, dto.is_active]
      );

      await client.query('COMMIT');
      return res.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateAvailability(
    availabilityId: string,
    doctorId: string,
    dto: Partial<UpsertAvailabilityDto>
  ): Promise<DbAvailability | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await lockDoctorSchedule(client, doctorId);

      const current = await client.query<DbAvailability>(
        'SELECT * FROM availability WHERE id = $1 AND doctor_id = $2',
        [availabilityId, doctorId]
      );
      if (!current.rows[0]) {
        await client.query('ROLLBACK');
        return null;
      }
      const row = current.rows[0];

      const newStart = dto.start_time ?? String(row.start_time);
      const newEnd = dto.end_time ?? String(row.end_time);
      const newDay = dto.day_of_week ?? row.day_of_week;
      const newDuration = dto.slot_duration_minutes ?? row.slot_duration_minutes;
      const newActive = dto.is_active ?? row.is_active;

      if (newEnd <= newStart) throw new Error('end_time must be after start_time');

      const overlapRes = await client.query<{ id: string }>(
        `SELECT id FROM availability
         WHERE doctor_id = $1
           AND day_of_week = $2
           AND is_active = TRUE
           AND id <> $3
           AND start_time < $5::time
           AND end_time   > $4::time`,
        [doctorId, newDay, availabilityId, newStart, newEnd]
      );
      if (overlapRes.rowCount && overlapRes.rowCount > 0) {
        throw new Error('Updated window overlaps with an existing active window on this day');
      }

      const res = await client.query<DbAvailability>(
        `UPDATE availability
         SET day_of_week = $1, start_time = $2::time, end_time = $3::time,
             slot_duration_minutes = $4, is_active = $5
         WHERE id = $6
         RETURNING id, doctor_id, day_of_week,
                   start_time::text, end_time::text,
                   slot_duration_minutes, is_active`,
        [newDay, newStart, newEnd, newDuration, newActive, availabilityId]
      );

      await client.query('COMMIT');
      return res.rows[0] ?? null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteAvailability(availabilityId: string, doctorId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await lockDoctorSchedule(client, doctorId);
      const res = await client.query(
        `DELETE FROM availability WHERE id = $1 AND doctor_id = $2`,
        [availabilityId, doctorId]
      );
      await client.query('COMMIT');
      return (res.rowCount ?? 0) > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getSlotsForDoctor(
    doctorId: string,
    fromDate: string,
    toDate: string,
    includeNonAvailable = false
  ): Promise<DbSlot[]> {
    const res = await pool.query<DbSlot>(
      `SELECT id, doctor_id, date::text, start_time::text, end_time::text, status, is_manual_override
       FROM slots
       WHERE doctor_id = $1
         AND date BETWEEN $2::date AND $3::date
         AND (
           $4::boolean
           OR date > CURRENT_DATE
           OR (date = CURRENT_DATE AND start_time > CURRENT_TIME)
         )
         AND (
           $4::boolean
           OR (
             status = 'available'
             AND (
               EXISTS (
                 SELECT 1 FROM schedule_date_overrides o
                 WHERE o.doctor_id = slots.doctor_id AND o.override_date = slots.date
                   AND o.is_blocked = FALSE
                   AND (
                     slots.is_manual_override
                     OR EXISTS (
                       SELECT 1 FROM schedule_date_override_windows w
                       WHERE w.override_id = o.id
                         AND w.start_time <= slots.start_time AND w.end_time >= slots.end_time
                         AND EXTRACT(EPOCH FROM (slots.end_time - slots.start_time)) / 60
                             = w.slot_duration_minutes
                     )
                   )
               )
               OR (
                 NOT EXISTS (
                   SELECT 1 FROM schedule_date_overrides o
                   WHERE o.doctor_id = slots.doctor_id AND o.override_date = slots.date
                 )
                 AND (
                   slots.is_manual_override
                   OR EXISTS (
                     SELECT 1 FROM availability av
                     WHERE av.doctor_id = slots.doctor_id AND av.is_active = TRUE
                       AND av.day_of_week = EXTRACT(DOW FROM slots.date)
                       AND av.start_time <= slots.start_time AND av.end_time >= slots.end_time
                       AND EXTRACT(EPOCH FROM (slots.end_time - slots.start_time)) / 60
                           = av.slot_duration_minutes
                   )
                 )
               )
             )
           )
         )
       ORDER BY date ASC, start_time ASC`,
      [doctorId, fromDate, toDate, includeNonAvailable]
    );
    return res.rows;
  }

  async generateSlots(
    doctorId: string,
    fromDate: string,
    toDate: string,
    includeNonAvailable = false
  ): Promise<DbSlot[]> {
    const dates = buildDateRange(fromDate, toDate);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await lockDoctorSchedule(client, doctorId);

      const availabilityRes = await client.query<DbAvailability>(
        `SELECT id, doctor_id, day_of_week, start_time::text, end_time::text,
                slot_duration_minutes, is_active
         FROM availability WHERE doctor_id = $1`,
        [doctorId]
      );
      const activeWindows = availabilityRes.rows.filter((window) => window.is_active);

      const overridesRes = await client.query<{
        override_date: string;
        is_blocked: boolean;
        start_time: string;
        end_time: string;
        slot_duration_minutes: number;
      }>(
        `SELECT o.override_date::text, o.is_blocked, w.start_time::text, w.end_time::text,
                w.slot_duration_minutes
         FROM schedule_date_overrides o
         LEFT JOIN schedule_date_override_windows w ON w.override_id = o.id
         WHERE o.doctor_id = $1 AND o.override_date BETWEEN $2::date AND $3::date
         ORDER BY o.override_date, w.start_time`,
        [doctorId, fromDate, toDate]
      );
      const overrideByDate = new Map<string, typeof overridesRes.rows>();
      for (const row of overridesRes.rows) {
        const key = row.override_date;
        overrideByDate.set(key, [...(overrideByDate.get(key) ?? []), row]);
      }

      for (const date of dates) {
        const dateOverride = overrideByDate.get(date);
        const windows = dateOverride
          ? dateOverride[0]?.is_blocked
            ? []
            : dateOverride
                .filter((row) => row.start_time !== null)
                .map((row) => ({
                  start_time: row.start_time,
                  end_time: row.end_time,
                  slot_duration_minutes: row.slot_duration_minutes,
                }))
          : activeWindows
              .filter((window) => window.day_of_week === new Date(date + 'T12:00:00').getDay())
              .map((window) => ({
                start_time: window.start_time,
                end_time: window.end_time,
                slot_duration_minutes: window.slot_duration_minutes,
              }));

        const desiredSlots = windows.flatMap((window) =>
          splitIntoSlots(window.start_time, window.end_time, window.slot_duration_minutes)
        );

        await client.query(
          `UPDATE slots s SET status = 'cancelled', updated_at = NOW()
           WHERE s.doctor_id = $1 AND s.date = $2::date
             AND s.status = 'available' AND s.is_manual_override = FALSE
             AND NOT EXISTS (
               SELECT 1 FROM UNNEST($3::time[], $4::time[]) AS desired(start_time, end_time)
               WHERE s.start_time = desired.start_time AND s.end_time = desired.end_time
             )
             AND NOT EXISTS (
               SELECT 1 FROM appointments a
               WHERE a.slot_id = s.id AND a.status NOT IN ('cancelled', 'rescheduled')
             )`,
          [
            doctorId,
            date,
            desiredSlots.map((slot) => slot.start),
            desiredSlots.map((slot) => slot.end),
          ]
        );

        await client.query(
          `INSERT INTO slots (doctor_id, date, start_time, end_time, status)
           SELECT $1, $2::date, desired.start_time, desired.end_time, 'available'
           FROM UNNEST($3::time[], $4::time[]) AS desired(start_time, end_time)
           WHERE NOT EXISTS (
             SELECT 1
             FROM appointments a
             JOIN slots booked_slot ON booked_slot.id = a.slot_id
             WHERE a.doctor_id = $1 AND booked_slot.date = $2::date
               AND a.status NOT IN ('cancelled', 'rescheduled')
               AND booked_slot.start_time < desired.end_time
               AND booked_slot.end_time > desired.start_time
           )
           AND NOT EXISTS (
             SELECT 1 FROM slots existing
             WHERE existing.doctor_id = $1 AND existing.date = $2::date
               AND existing.start_time <> desired.start_time
               AND existing.status <> 'cancelled'
               AND existing.start_time < desired.end_time
               AND existing.end_time > desired.start_time
           )
           ON CONFLICT (doctor_id, date, start_time) DO UPDATE
             SET end_time = EXCLUDED.end_time, status = 'available', updated_at = NOW()
           WHERE slots.status IN ('available', 'cancelled')
             AND slots.is_manual_override = FALSE
             AND (
               NOT EXISTS (SELECT 1 FROM appointments history WHERE history.slot_id = slots.id)
               OR slots.end_time = EXCLUDED.end_time
             )
             AND NOT EXISTS (
               SELECT 1 FROM appointments a
               WHERE a.slot_id = slots.id AND a.status NOT IN ('cancelled', 'rescheduled')
             )`,
          [
            doctorId,
            date,
            desiredSlots.map((slot) => slot.start),
            desiredSlots.map((slot) => slot.end),
          ]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return this.getSlotsForDoctor(doctorId, fromDate, toDate, includeNonAvailable);
  }

  async updateSlot(
    doctorId: string,
    slotId: string,
    action: 'edit' | 'block' | 'restore',
    startTime?: string,
    endTime?: string
  ): Promise<DbSlot | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await lockDoctorSchedule(client, doctorId);
      const current = await client.query<DbSlot>(
        `SELECT id, doctor_id, date::text, start_time::text, end_time::text, status, is_manual_override
         FROM slots WHERE id = $1 AND doctor_id = $2 FOR UPDATE`,
        [slotId, doctorId]
      );
      const slot = current.rows[0];
      if (!slot) {
        await client.query('ROLLBACK');
        return null;
      }
      const activeAppointment = await client.query(
        `SELECT 1 FROM appointments
         WHERE slot_id = $1 AND status NOT IN ('cancelled', 'rescheduled')
         LIMIT 1`,
        [slotId]
      );
      if (activeAppointment.rowCount) {
        throw Object.assign(new Error('Booked slots cannot be changed.'), { status: 409 });
      }
      if (action === 'restore') {
        await client.query(
          `UPDATE slots SET status = 'available', is_manual_override = TRUE, updated_at = NOW()
           WHERE id = $1`,
          [slotId]
        );
      } else if (action === 'block') {
        await client.query(
          `UPDATE slots SET status = 'blocked', is_manual_override = TRUE, updated_at = NOW()
           WHERE id = $1`,
          [slotId]
        );
      } else {
        const appointmentHistory = await client.query(
          'SELECT 1 FROM appointments WHERE slot_id = $1 LIMIT 1',
          [slotId]
        );
        if (appointmentHistory.rowCount) {
          throw Object.assign(
            new Error('A slot with appointment history cannot be moved; add another available slot instead.'),
            { status: 409 }
          );
        }
        if (!startTime || !endTime || endTime <= startTime) {
          throw Object.assign(new Error('A valid start and end time are required.'), { status: 422 });
        }
        const overlappingSlots = await client.query<{
          id: string;
          start_time: string;
          status: string;
          is_manual_override: boolean;
          has_appointment_history: boolean;
        }>(
          `SELECT s.id, s.start_time::text, s.status, s.is_manual_override,
                  EXISTS (SELECT 1 FROM appointments a WHERE a.slot_id = s.id) AS has_appointment_history
           FROM slots s
           WHERE s.doctor_id = $1 AND s.date = $2::date AND s.id <> $3
             AND (
               s.start_time = $4::time
               OR (s.status <> 'cancelled' AND s.start_time < $5::time AND s.end_time > $4::time)
             )
           FOR UPDATE`,
          [doctorId, slot.date, slotId, startTime, endTime]
        );
        for (const overlap of overlappingSlots.rows) {
          if (overlap.start_time.slice(0, 8) === startTime.slice(0, 8) &&
              !overlap.has_appointment_history && !overlap.is_manual_override) {
            await client.query('DELETE FROM slots WHERE id = $1', [overlap.id]);
            continue;
          }
          if (overlap.status !== 'cancelled' &&
              !overlap.has_appointment_history && !overlap.is_manual_override) {
            await client.query(
              `UPDATE slots SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
              [overlap.id]
            );
            continue;
          }
          throw Object.assign(new Error('The edited slot overlaps a booked, historical, or manually changed slot.'), {
            status: 409,
          });
        }
        const conflict = await client.query(
          `SELECT 1 FROM slots
           WHERE doctor_id = $1 AND date = $2::date AND id <> $3
             AND status <> 'cancelled'
             AND start_time < $5::time AND end_time > $4::time
           LIMIT 1`,
          [doctorId, slot.date, slotId, startTime, endTime]
        );
        if (conflict.rowCount) {
          throw Object.assign(new Error('The edited slot overlaps another slot.'), { status: 409 });
        }
        await client.query(
          `UPDATE slots
           SET start_time = $1::time, end_time = $2::time,
               status = 'available', is_manual_override = TRUE, updated_at = NOW()
           WHERE id = $3`,
          [startTime, endTime, slotId]
        );
      }
      const updated = await client.query<DbSlot>(
        `SELECT id, doctor_id, date::text, start_time::text, end_time::text, status, is_manual_override
         FROM slots WHERE id = $1`,
        [slotId]
      );
      await client.query('COMMIT');
      return updated.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

function buildDateRange(fromDate: string, toDate: string): string[] {
  const dates: string[] = [];
  const cur = new Date(fromDate + 'T12:00:00');
  const end = new Date(toDate + 'T12:00:00');
  let guard = 0;
  while (cur <= end && guard < 90) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
    guard++;
  }
  return dates;
}

function splitIntoSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  let cur = sh * 60 + sm;
  const endM = eh * 60 + em;

  while (cur + durationMinutes <= endM) {
    const next = cur + durationMinutes;
    slots.push({ start: minutesToTime(cur), end: minutesToTime(next) });
    cur = next;
  }
  return slots;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
}

export const doctorRepository = new DoctorRepository();
