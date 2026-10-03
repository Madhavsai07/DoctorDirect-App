import { pool } from '../db/pool';

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
  is_available: boolean;
  rating: number;
  verification_status: 'pending' | 'approved' | 'rejected';
  verified_at: Date | null;
  verified_by: string | null;
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
}

export interface UpsertAvailabilityDto {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
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
        d.specialization_id,
        s.name          AS specialization_name,
        d.license_number,
        d.experience_years,
        d.consultation_fee,
        d.bio,
        d.qualification,
        d.is_available,
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
        d.specialization_id,
        s.name          AS specialization_name,
        d.license_number,
        d.experience_years,
        d.consultation_fee,
        d.bio,
        d.qualification,
        d.is_available,
        d.rating,
        d.verification_status,
        d.verified_at,
        d.verified_by
      FROM doctors d
      JOIN users u ON u.id = d.user_id
      JOIN specializations s ON s.id = d.specialization_id
      WHERE d.id = $1 AND u.is_active = TRUE
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
        d.specialization_id,
        s.name          AS specialization_name,
        d.license_number,
        d.experience_years,
        d.consultation_fee,
        d.bio,
        d.qualification,
        d.is_available,
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

  async upsertAvailability(
    doctorId: string,
    dto: UpsertAvailabilityDto
  ): Promise<DbAvailability> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (dto.slot_duration_minutes <= 0) {
        throw new Error('slot_duration_minutes must be greater than 0');
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

  async deactivateAvailability(availabilityId: string, doctorId: string): Promise<boolean> {
    const res = await pool.query(
      `UPDATE availability SET is_active = FALSE WHERE id = $1 AND doctor_id = $2`,
      [availabilityId, doctorId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async getSlotsForDoctor(doctorId: string, fromDate: string, toDate: string): Promise<DbSlot[]> {
    const res = await pool.query<DbSlot>(
      `SELECT id, doctor_id, date::text, start_time::text, end_time::text, status
       FROM slots
       WHERE doctor_id = $1
         AND date BETWEEN $2::date AND $3::date
       ORDER BY date ASC, start_time ASC`,
      [doctorId, fromDate, toDate]
    );
    return res.rows;
  }

  async generateSlots(doctorId: string, fromDate: string, toDate: string): Promise<DbSlot[]> {
    const avail = await this.getAvailabilityForDoctor(doctorId);
    const activeWindows = avail.filter((a) => a.is_active);

    if (activeWindows.length === 0) {
      return this.getSlotsForDoctor(doctorId, fromDate, toDate);
    }

    const dates = buildDateRange(fromDate, toDate);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const date of dates) {
        const dayOfWeek = new Date(date + 'T12:00:00').getDay();
        const windows = activeWindows.filter((w) => w.day_of_week === dayOfWeek);

        for (const window of windows) {
          const timeSlots = splitIntoSlots(window.start_time, window.end_time, window.slot_duration_minutes);
          for (const slot of timeSlots) {
            await client.query(
              `INSERT INTO slots (doctor_id, date, start_time, end_time, status)
               VALUES ($1, $2::date, $3::time, $4::time, 'available')
               ON CONFLICT (doctor_id, date, start_time) DO NOTHING`,
              [doctorId, date, slot.start, slot.end]
            );
          }
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return this.getSlotsForDoctor(doctorId, fromDate, toDate);
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
