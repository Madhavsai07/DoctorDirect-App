import { pool } from '../db/pool';
import { notificationService } from '../services/notification.service';

export interface DbAppointmentDetail {
  id: string;
  patient_id: string;
  doctor_id: string;
  slot_id: string;
  status: 'booked' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  reason_for_visit: string | null;
  cancellation_reason: string | null;
  booked_at: Date;
  created_at: Date;
  updated_at: Date;

  // Slot details
  slot_date: string;
  slot_start_time: string;
  slot_end_time: string;

  // Doctor details
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_avatar_url: string | null;
  doctor_license_number: string;
  doctor_experience_years: number;
  doctor_consultation_fee: number;
  doctor_qualification: string | null;
  specialization_name: string;

  // Patient details
  patient_first_name: string;
  patient_last_name: string;
  patient_email: string;
  patient_phone: string | null;
  patient_date_of_birth: string | null;
  patient_gender: string | null;
  patient_blood_group: string | null;
  patient_medical_history: string | null;
  patient_allergies: string | null;
}

export class AppointmentRepository {
  /**
   * Find or create patient record for user
   */
  async ensurePatientProfile(userId: string): Promise<string> {
    const existing = await pool.query<{ id: string }>(
      'SELECT id FROM patients WHERE user_id = $1',
      [userId]
    );
    if (existing.rows[0]) {
      return existing.rows[0].id;
    }

    const created = await pool.query<{ id: string }>(
      `INSERT INTO patients (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
      [userId]
    );
    return created.rows[0].id;
  }

  /**
   * Get the doctor_id associated with a slot.
   */
  async getSlotDoctorId(slotId: string): Promise<string | null> {
    const res = await pool.query<{ doctor_id: string }>(
      'SELECT doctor_id FROM slots WHERE id = $1',
      [slotId]
    );
    return res.rows[0]?.doctor_id ?? null;
  }

  /**
   * Concurrency-safe slot booking with PostgreSQL transaction and FOR UPDATE lock.
   * Strictly enforces:
   * 1. Slot must exist and have status = 'available'.
   * 2. Slot must be in the future (not past).
   * 3. Doctor and Patient users must be active.
   * 4. Double booking prevented at DB constraint and row lock level.
   */
  async bookSlot(params: {
    patientId: string;
    patientUserId: string;
    slotId: string;
    reasonForVisit?: string;
  }): Promise<DbAppointmentDetail> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const slotIdentity = await client.query<{ doctor_id: string }>(
        'SELECT doctor_id FROM slots WHERE id = $1',
        [params.slotId]
      );
      if (!slotIdentity.rows[0]) {
        const err: any = new Error('Slot not found');
        err.status = 404;
        throw err;
      }
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1::text))', [slotIdentity.rows[0].doctor_id]);

      // 1. Lock slot row for concurrency safety after serializing schedule changes.
      const slotRes = await client.query<{
        id: string;
        doctor_id: string;
        date: string;
        start_time: string;
        end_time: string;
        status: string;
        is_manual_override: boolean;
      }>(
        `SELECT id, doctor_id, date::text, start_time::text, end_time::text, status, is_manual_override
         FROM slots
         WHERE id = $1
         FOR UPDATE`,
        [params.slotId]
      );

      if (slotRes.rowCount === 0) {
        const err: any = new Error('Slot not found');
        err.status = 404;
        throw err;
      }

      const slot = slotRes.rows[0];

      // 2. Validate availability
      if (slot.status !== 'available') {
        const err: any = new Error('Slot is no longer available for booking');
        err.status = 409;
        throw err;
      }

      // 3. Validate slot is not in the past
      const slotDateTimeCheck = await client.query<{ is_past: boolean }>(
        `SELECT ($1::date < CURRENT_DATE OR ($1::date = CURRENT_DATE AND $2::time <= CURRENT_TIME)) AS is_past`,
        [slot.date, slot.start_time]
      );
      if (slotDateTimeCheck.rows[0]?.is_past) {
        const err: any = new Error('Cannot book past slots');
        err.status = 400;
        throw err;
      }

      // 4. Validate doctor user is active, available, and approved
      const doctorCheck = await client.query<{
        is_active: boolean;
        verification_status: string;
        has_active_schedule: boolean;
        user_id: string;
      }>(
        `SELECT u.is_active, d.verification_status, u.id AS user_id,
                (
                  EXISTS (
                    SELECT 1
                    FROM schedule_date_overrides o
                    WHERE o.doctor_id = d.id AND o.override_date = $2::date
                      AND o.is_blocked = FALSE
                      AND (
                        $5::boolean
                        OR EXISTS (
                          SELECT 1 FROM schedule_date_override_windows w
                          WHERE w.override_id = o.id
                            AND w.start_time <= $3::time AND w.end_time >= $4::time
                            AND EXTRACT(EPOCH FROM ($4::time - $3::time)) / 60
                                = w.slot_duration_minutes
                        )
                      )
                  )
                  OR (
                    NOT EXISTS (
                      SELECT 1 FROM schedule_date_overrides o
                      WHERE o.doctor_id = d.id AND o.override_date = $2::date
                    )
                    AND (
                      $5::boolean
                      OR EXISTS (
                        SELECT 1 FROM availability av
                        WHERE av.doctor_id = d.id AND av.is_active = TRUE
                          AND av.day_of_week = EXTRACT(DOW FROM $2::date)
                          AND av.start_time <= $3::time AND av.end_time >= $4::time
                          AND EXTRACT(EPOCH FROM ($4::time - $3::time)) / 60
                              = av.slot_duration_minutes
                      )
                    )
                  )
                ) AS has_active_schedule
         FROM doctors d
         JOIN users u ON d.user_id = u.id
         WHERE d.id = $1`,
        [slot.doctor_id, slot.date, slot.start_time, slot.end_time, slot.is_manual_override]
      );
      if (doctorCheck.rowCount === 0 || !doctorCheck.rows[0].is_active) {
        const err: any = new Error('Doctor account is inactive');
        err.status = 400;
        throw err;
      }
      if (doctorCheck.rows[0].verification_status !== 'approved') {
        const err: any = new Error('Cannot book appointment: doctor is not yet verified');
        err.status = 403;
        throw err;
      }
      if (!doctorCheck.rows[0].has_active_schedule) {
        const err: any = new Error("This appointment slot is no longer within the doctor's active schedule");
        err.status = 409;
        throw err;
      }

      // 5. Validate patient user is active
      const patientCheck = await client.query<{ is_active: boolean }>(
        `SELECT u.is_active
         FROM patients p
         JOIN users u ON p.user_id = u.id
         WHERE p.id = $1`,
        [params.patientId]
      );
      if (patientCheck.rowCount === 0 || !patientCheck.rows[0].is_active) {
        const err: any = new Error('Patient account is inactive');
        err.status = 403;
        throw err;
      }

      // 6. Mark slot as booked
      await client.query(
        `UPDATE slots SET status = 'booked', updated_at = NOW() WHERE id = $1`,
        [slot.id]
      );

      // 7. Insert appointment (protected by uq_active_slot_appointment partial index)
      const apptRes = await client.query<{ id: string }>(
        `INSERT INTO appointments (patient_id, doctor_id, slot_id, status, reason_for_visit, booked_at)
         VALUES ($1, $2, $3, 'booked', $4, NOW())
         RETURNING id`,
        [params.patientId, slot.doctor_id, slot.id, params.reasonForVisit ?? null]
      );

      await notificationService.createOnce({
        recipientUserId: doctorCheck.rows[0].user_id,
        type: 'new_appointment_booked',
        title: 'New appointment booked',
        message: 'A patient has booked one of your available appointment slots.',
        appointmentId: apptRes.rows[0].id,
        eventKey: `appointment-booked-doctor:${apptRes.rows[0].id}`,
      }, client);
      await notificationService.createOnce({
        recipientUserId: params.patientUserId,
        type: 'appointment_booked',
        title: 'Appointment booked',
        message: 'Your appointment request has been booked and is awaiting doctor confirmation.',
        appointmentId: apptRes.rows[0].id,
        eventKey: `appointment-booked-patient:${apptRes.rows[0].id}`,
      }, client);

      await client.query('COMMIT');

      const fullAppointment = await this.getAppointmentById(apptRes.rows[0].id);
      if (!fullAppointment) {
        throw new Error('Failed to retrieve booked appointment');
      }
      return fullAppointment;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Base SQL query selecting full appointment details with all joins
   */
  private get baseDetailQuery(): string {
    return `
      SELECT
        a.id,
        a.patient_id,
        a.doctor_id,
        a.slot_id,
        a.status,
        a.reason_for_visit,
        a.cancellation_reason,
        a.booked_at,
        a.created_at,
        a.updated_at,
        s.date::text AS slot_date,
        s.start_time::text AS slot_start_time,
        s.end_time::text AS slot_end_time,
        doc_u.first_name AS doctor_first_name,
        doc_u.last_name AS doctor_last_name,
        doc_u.avatar_url AS doctor_avatar_url,
        d.license_number AS doctor_license_number,
        d.experience_years AS doctor_experience_years,
        d.consultation_fee AS doctor_consultation_fee,
        d.qualification AS doctor_qualification,
        spec.name AS specialization_name,
        pat_u.first_name AS patient_first_name,
        pat_u.last_name AS patient_last_name,
        pat_u.email AS patient_email,
        pat_u.phone AS patient_phone,
        p.date_of_birth::text AS patient_date_of_birth,
        p.gender AS patient_gender,
        p.blood_group AS patient_blood_group,
        p.medical_history AS patient_medical_history,
        p.allergies AS patient_allergies
      FROM appointments a
      JOIN slots s ON a.slot_id = s.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users doc_u ON d.user_id = doc_u.id
      JOIN specializations spec ON d.specialization_id = spec.id
      JOIN patients p ON a.patient_id = p.id
      JOIN users pat_u ON p.user_id = pat_u.id
    `;
  }

  /**
   * Get single appointment by ID
   */
  async getAppointmentById(appointmentId: string): Promise<DbAppointmentDetail | null> {
    const res = await pool.query<DbAppointmentDetail>(
      `${this.baseDetailQuery} WHERE a.id = $1`,
      [appointmentId]
    );
    return res.rows[0] ?? null;
  }

  /**
   * Get appointments for a patient with status filter
   */
  async getPatientAppointments(
    patientId: string,
    filter?: 'upcoming' | 'past' | 'all'
  ): Promise<DbAppointmentDetail[]> {
    let whereClause = `WHERE a.patient_id = $1`;
    const params: any[] = [patientId];

    if (filter === 'upcoming') {
      whereClause += ` AND a.status IN ('booked', 'confirmed', 'in_progress')
                       AND (s.date > CURRENT_DATE OR (s.date = CURRENT_DATE AND s.end_time > CURRENT_TIME))`;
    } else if (filter === 'past') {
      whereClause += ` AND (a.status IN ('completed', 'cancelled', 'rescheduled', 'no_show')
                           OR (s.date < CURRENT_DATE OR (s.date = CURRENT_DATE AND s.end_time <= CURRENT_TIME)))`;
    }

    const orderBy = filter === 'past'
      ? `ORDER BY s.date DESC, s.start_time DESC`
      : `ORDER BY s.date ASC, s.start_time ASC`;

    const res = await pool.query<DbAppointmentDetail>(
      `${this.baseDetailQuery} ${whereClause} ${orderBy}`,
      params
    );
    return res.rows;
  }

  /**
   * Get appointments for a doctor with filter
   */
  async getDoctorAppointments(
    doctorId: string,
    filter?: 'upcoming' | 'past' | 'today' | 'all'
  ): Promise<DbAppointmentDetail[]> {
    let whereClause = `WHERE a.doctor_id = $1`;
    const params: any[] = [doctorId];

    if (filter === 'today') {
      whereClause += ` AND s.date = CURRENT_DATE`;
    } else if (filter === 'upcoming') {
      whereClause += ` AND a.status IN ('booked', 'confirmed', 'in_progress')
                       AND (s.date > CURRENT_DATE OR (s.date = CURRENT_DATE AND s.end_time > CURRENT_TIME))`;
    } else if (filter === 'past') {
      whereClause += ` AND (a.status IN ('completed', 'cancelled', 'rescheduled', 'no_show')
                           OR (s.date < CURRENT_DATE OR (s.date = CURRENT_DATE AND s.end_time <= CURRENT_TIME)))`;
    }

    const orderBy = filter === 'past'
      ? `ORDER BY s.date DESC, s.start_time DESC`
      : `ORDER BY s.date ASC, s.start_time ASC`;

    const res = await pool.query<DbAppointmentDetail>(
      `${this.baseDetailQuery} ${whereClause} ${orderBy}`,
      params
    );
    return res.rows;
  }

  /**
   * Concurrency-safe status update adhering strictly to the appointment lifecycle:
   * PENDING ('booked') -> CONFIRMED -> IN_PROGRESS -> COMPLETED
   * with CANCELLED / RESCHEDULED branches.
   * When cancelled, frees the future slot back to 'available'.
   */
  async updateStatus(params: {
    appointmentId: string;
    newStatus: 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
    cancellationReason?: string;
    actorRole: 'patient' | 'doctor';
  }): Promise<DbAppointmentDetail> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const apptRes = await client.query<{
        id: string;
        status: string;
        slot_id: string;
        date: string;
        start_time: string;
        patient_user_id: string;
        doctor_user_id: string;
      }>(
        `SELECT a.id, a.status, a.slot_id, s.date::text, s.start_time::text,
                pat_u.id AS patient_user_id, doc_u.id AS doctor_user_id
         FROM appointments a
         JOIN slots s ON a.slot_id = s.id
         JOIN patients p ON a.patient_id = p.id
         JOIN users pat_u ON p.user_id = pat_u.id
         JOIN doctors d ON a.doctor_id = d.id
         JOIN users doc_u ON d.user_id = doc_u.id
         WHERE a.id = $1
         FOR UPDATE OF a`,
        [params.appointmentId]
      );

      if (apptRes.rowCount === 0) {
        const err: any = new Error('Appointment not found');
        err.status = 404;
        throw err;
      }

      const current = apptRes.rows[0];

      // Validate lifecycle transitions
      const validTransitions: Record<string, string[]> = {
        booked: ['confirmed', 'cancelled'],
        confirmed: ['in_progress', 'cancelled', 'no_show'],
        in_progress: ['completed', 'cancelled'],
        completed: [],
        cancelled: [],
        rescheduled: [],
        no_show: [],
      };

      if (!validTransitions[current.status]?.includes(params.newStatus)) {
        const err: any = new Error(
          `Invalid state transition: Cannot change appointment from ${current.status} to ${params.newStatus}`
        );
        err.status = 400;
        throw err;
      }

      // If cancelling, free future slot
      if (params.newStatus === 'cancelled') {
        await client.query(
          `UPDATE slots
           SET status = 'available', updated_at = NOW()
           WHERE id = $1
             AND (date > CURRENT_DATE OR (date = CURRENT_DATE AND start_time > CURRENT_TIME))`,
          [current.slot_id]
        );
      }

      await client.query(
        `UPDATE appointments
         SET status = $1,
             cancellation_reason = COALESCE($2, cancellation_reason),
             updated_at = NOW()
         WHERE id = $3`,
        [params.newStatus, params.cancellationReason ?? null, params.appointmentId]
      );

      if (params.newStatus === 'confirmed') {
        await notificationService.createOnce({
          recipientUserId: current.patient_user_id,
          type: 'appointment_confirmed',
          title: 'Appointment confirmed',
          message: 'Your doctor has confirmed your appointment.',
          appointmentId: current.id,
          eventKey: `appointment-confirmed-patient:${current.id}`,
        }, client);
      } else if (params.newStatus === 'cancelled') {
        const patientCancelled = params.actorRole === 'patient';
        await notificationService.createOnce({
          recipientUserId: patientCancelled ? current.doctor_user_id : current.patient_user_id,
          type: patientCancelled ? 'patient_cancelled' : 'appointment_cancelled',
          title: patientCancelled ? 'Patient cancelled appointment' : 'Appointment cancelled',
          message: patientCancelled
            ? 'A patient has cancelled their appointment with you.'
            : 'Your doctor has cancelled the appointment.',
          appointmentId: current.id,
          eventKey: `appointment-cancelled-${patientCancelled ? 'doctor' : 'patient'}:${current.id}`,
        }, client);
      }

      await client.query('COMMIT');

      const updated = await this.getAppointmentById(params.appointmentId);
      return updated!;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Reschedule appointment to a new slot.
   * Releases current slot back to 'available' if future, locks and books new slot,
   * updates appointment.
   */
  async rescheduleAppointment(params: {
    appointmentId: string;
    newSlotId: string;
    patientId: string;
  }): Promise<DbAppointmentDetail> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Lock appointment
      const apptRes = await client.query<{
        id: string;
        patient_id: string;
        doctor_id: string;
        slot_id: string;
        status: string;
      }>(
        `SELECT id, patient_id, doctor_id, slot_id, status
         FROM appointments
         WHERE id = $1
         FOR UPDATE`,
        [params.appointmentId]
      );

      if (apptRes.rowCount === 0) {
        const err: any = new Error('Appointment not found');
        err.status = 404;
        throw err;
      }

      const appt = apptRes.rows[0];

      if (appt.patient_id !== params.patientId) {
        const err: any = new Error('Access denied: You cannot reschedule this appointment');
        err.status = 403;
        throw err;
      }
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1::text))', [appt.doctor_id]);

      const usersRes = await client.query<{ patient_user_id: string; doctor_user_id: string }>(
        `SELECT pat_u.id AS patient_user_id, doc_u.id AS doctor_user_id
         FROM appointments a
         JOIN patients p ON a.patient_id = p.id
         JOIN users pat_u ON p.user_id = pat_u.id
         JOIN doctors d ON a.doctor_id = d.id
         JOIN users doc_u ON d.user_id = doc_u.id
         WHERE a.id = $1`,
        [appt.id]
      );

      if (!['booked', 'confirmed'].includes(appt.status)) {
        const err: any = new Error(`Cannot reschedule appointment with status '${appt.status}'`);
        err.status = 400;
        throw err;
      }

      // 2. Lock and validate new slot
      const newSlotRes = await client.query<{
        id: string;
        doctor_id: string;
        date: string;
        start_time: string;
        end_time: string;
        status: string;
        is_manual_override: boolean;
      }>(
        `SELECT id, doctor_id, date::text, start_time::text, end_time::text, status, is_manual_override
         FROM slots
         WHERE id = $1
         FOR UPDATE`,
        [params.newSlotId]
      );

      if (newSlotRes.rowCount === 0) {
        const err: any = new Error('New slot not found');
        err.status = 404;
        throw err;
      }

      const newSlot = newSlotRes.rows[0];

      if (newSlot.doctor_id !== appt.doctor_id) {
        const err: any = new Error('New slot must be with the same doctor');
        err.status = 400;
        throw err;
      }

      if (newSlot.status !== 'available') {
        const err: any = new Error('New slot is not available');
        err.status = 409;
        throw err;
      }

      const scheduleCheck = await client.query<{
        is_active: boolean;
        verification_status: string;
        has_active_schedule: boolean;
      }>(
        `SELECT u.is_active, d.verification_status,
                (
                  EXISTS (
                    SELECT 1 FROM schedule_date_overrides o
                    WHERE o.doctor_id = d.id AND o.override_date = $2::date AND o.is_blocked = FALSE
                      AND (
                        $5::boolean
                        OR EXISTS (
                          SELECT 1 FROM schedule_date_override_windows w
                          WHERE w.override_id = o.id
                            AND w.start_time <= $3::time AND w.end_time >= $4::time
                            AND EXTRACT(EPOCH FROM ($4::time - $3::time)) / 60 = w.slot_duration_minutes
                        )
                      )
                  )
                  OR (
                    NOT EXISTS (
                      SELECT 1 FROM schedule_date_overrides o
                      WHERE o.doctor_id = d.id AND o.override_date = $2::date
                    )
                    AND (
                      $5::boolean
                      OR EXISTS (
                        SELECT 1 FROM availability av
                        WHERE av.doctor_id = d.id AND av.is_active = TRUE
                          AND av.day_of_week = EXTRACT(DOW FROM $2::date)
                          AND av.start_time <= $3::time AND av.end_time >= $4::time
                          AND EXTRACT(EPOCH FROM ($4::time - $3::time)) / 60 = av.slot_duration_minutes
                      )
                    )
                  )
                ) AS has_active_schedule
         FROM doctors d JOIN users u ON u.id = d.user_id
         WHERE d.id = $1`,
        [newSlot.doctor_id, newSlot.date, newSlot.start_time, newSlot.end_time, newSlot.is_manual_override]
      );
      if (!scheduleCheck.rows[0]?.is_active) {
        const err: any = new Error('Doctor account is inactive');
        err.status = 400;
        throw err;
      }
      if (scheduleCheck.rows[0].verification_status !== 'approved') {
        const err: any = new Error('Cannot reschedule with a doctor who is not approved');
        err.status = 403;
        throw err;
      }
      if (!scheduleCheck.rows[0].has_active_schedule) {
        const err: any = new Error("This appointment slot is no longer within the doctor's active schedule");
        err.status = 409;
        throw err;
      }

      const pastCheck = await client.query<{ is_past: boolean }>(
        `SELECT ($1::date < CURRENT_DATE OR ($1::date = CURRENT_DATE AND $2::time <= CURRENT_TIME)) AS is_past`,
        [newSlot.date, newSlot.start_time]
      );
      if (pastCheck.rows[0]?.is_past) {
        const err: any = new Error('Cannot reschedule to a past slot');
        err.status = 400;
        throw err;
      }

      // 3. Release old slot back to available if future
      await client.query(
        `UPDATE slots
         SET status = 'available', updated_at = NOW()
         WHERE id = $1
           AND (date > CURRENT_DATE OR (date = CURRENT_DATE AND start_time > CURRENT_TIME))`,
        [appt.slot_id]
      );

      await notificationService.createOnce({
        recipientUserId: usersRes.rows[0].doctor_user_id,
        type: 'appointment_rescheduled',
        title: 'Appointment rescheduled',
        message: 'A patient has rescheduled their appointment with you.',
        appointmentId: appt.id,
        eventKey: `appointment-rescheduled-doctor:${appt.id}`,
      }, client);

      // 4. Mark new slot as booked
      await client.query(
        `UPDATE slots SET status = 'booked', updated_at = NOW() WHERE id = $1`,
        [newSlot.id]
      );

      // 5. Update appointment with new slot
      await client.query(
        `UPDATE appointments
         SET slot_id = $1, status = 'booked', updated_at = NOW()
         WHERE id = $2`,
        [newSlot.id, appt.id]
      );

      await client.query('COMMIT');

      const updated = await this.getAppointmentById(appt.id);
      return updated!;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const appointmentRepository = new AppointmentRepository();
