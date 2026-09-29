import { pool } from '../db/pool';
import { notificationService } from '../services/notification.service';

export interface DbConsultation {
  id: string;
  appointment_id: string;
  room_id: string;
  status: 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  started_at: string | null;
  ended_at: string | null;
  notes: string | null;
  symptoms: string | null;
  diagnosis: string | null;
  clinical_notes: string | null;
  treatment_plan: string | null;
  follow_up_instructions: string | null;
  prescription: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbConsultationDetail extends DbConsultation {
  doctor_id: string;
  doctor_user_id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_qualification: string | null;
  specialization_name: string;

  patient_id: string;
  patient_user_id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_gender: string | null;
  patient_date_of_birth: string | null;
  patient_blood_group: string | null;
  patient_medical_history: string | null;
  patient_allergies: string | null;

  reason_for_visit: string | null;
  appointment_status: string;
  slot_date: string;
  slot_start_time: string;
  slot_end_time: string;
}

export interface UpdateConsultationDto {
  symptoms?: string;
  clinical_notes?: string;
  diagnosis?: string;
  treatment_plan?: string;
  follow_up_instructions?: string;
  prescription?: string;
}

export class ConsultationRepository {
  private detailSelect = `
    SELECT
      c.id,
      c.appointment_id,
      c.room_id,
      c.status,
      c.started_at,
      c.ended_at,
      c.notes,
      c.symptoms,
      c.diagnosis,
      c.clinical_notes,
      c.treatment_plan,
      c.follow_up_instructions,
      c.prescription,
      c.created_at,
      c.updated_at,

      -- Appointment & slot
      a.doctor_id,
      doc_u.id AS doctor_user_id,
      doc_u.first_name AS doctor_first_name,
      doc_u.last_name AS doctor_last_name,
      d.qualification AS doctor_qualification,
      sp.name AS specialization_name,

      a.patient_id,
      pat_u.id AS patient_user_id,
      pat_u.first_name AS patient_first_name,
      pat_u.last_name AS patient_last_name,
      p.gender AS patient_gender,
      p.date_of_birth::text AS patient_date_of_birth,
      p.blood_group AS patient_blood_group,
      p.medical_history AS patient_medical_history,
      p.allergies AS patient_allergies,

      a.reason_for_visit,
      a.status AS appointment_status,
      s.date::text AS slot_date,
      s.start_time::text AS slot_start_time,
      s.end_time::text AS slot_end_time
    FROM consultations c
    JOIN appointments a ON c.appointment_id = a.id
    JOIN slots s ON a.slot_id = s.id
    JOIN doctors d ON a.doctor_id = d.id
    JOIN users doc_u ON d.user_id = doc_u.id
    JOIN specializations sp ON d.specialization_id = sp.id
    JOIN patients p ON a.patient_id = p.id
    JOIN users pat_u ON p.user_id = pat_u.id
  `;

  async findConsultationById(id: string): Promise<DbConsultationDetail | null> {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return null;
    }
    const res = await pool.query<DbConsultationDetail>(
      `${this.detailSelect} WHERE c.id = $1`,
      [id]
    );
    return res.rows[0] ?? null;
  }

  async findConsultationByAppointmentId(appointmentId: string): Promise<DbConsultationDetail | null> {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appointmentId)) {
      return null;
    }
    const res = await pool.query<DbConsultationDetail>(
      `${this.detailSelect} WHERE c.appointment_id = $1`,
      [appointmentId]
    );
    return res.rows[0] ?? null;
  }

  /**
   * Initializes or fetches a consultation for an appointment.
   * Atomically sets appointment status to 'in_progress' if currently 'confirmed'.
   */
  async startOrGetConsultation(appointmentId: string, doctorId: string): Promise<DbConsultationDetail> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch and lock appointment
      const apptRes = await client.query<{
        id: string;
        doctor_id: string;
        patient_id: string;
        patient_user_id: string;
        status: string;
      }>(
        `SELECT a.id, a.doctor_id, a.patient_id, a.status, u.id AS patient_user_id
         FROM appointments a
         JOIN patients p ON a.patient_id = p.id
         JOIN users u ON p.user_id = u.id
         WHERE a.id = $1
         FOR UPDATE`,
        [appointmentId]
      );

      if (apptRes.rowCount === 0) {
        const err: any = new Error('Appointment not found');
        err.status = 404;
        throw err;
      }

      const appt = apptRes.rows[0];

      if (appt.doctor_id !== doctorId) {
        const err: any = new Error('Forbidden: You can only start consultations for your own appointments');
        err.status = 403;
        throw err;
      }

      if (appt.status === 'cancelled') {
        const err: any = new Error('Cannot start consultation for a cancelled appointment');
        err.status = 400;
        throw err;
      }

      // If appointment is confirmed, advance to in_progress
      if (appt.status === 'confirmed') {
        await client.query(
          `UPDATE appointments SET status = 'in_progress', updated_at = NOW() WHERE id = $1`,
          [appointmentId]
        );
      } else if (appt.status !== 'in_progress' && appt.status !== 'completed') {
        const err: any = new Error(`Cannot start consultation for appointment in ${appt.status} status`);
        err.status = 400;
        throw err;
      }

      // 2. Check if consultation record already exists
      const existingRes = await client.query<{ id: string }>(
        `SELECT id FROM consultations WHERE appointment_id = $1`,
        [appointmentId]
      );

      if (existingRes.rowCount === 0) {
        const roomId = `room_${appointmentId.replace(/-/g, '').slice(0, 16)}`;
        await client.query(
          `INSERT INTO consultations (appointment_id, room_id, status, started_at)
           VALUES ($1, $2, 'in_progress', NOW())`,
          [appointmentId, roomId]
        );
        await notificationService.createOnce({
          recipientUserId: appt.patient_user_id,
          type: 'consultation_started',
          title: 'Consultation started',
          message: 'Your doctor has started your consultation.',
          appointmentId,
          consultationId: (await client.query<{ id: string }>('SELECT id FROM consultations WHERE appointment_id = $1', [appointmentId])).rows[0].id,
          eventKey: `consultation-started-patient:${appointmentId}`,
        }, client);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const detail = await this.findConsultationByAppointmentId(appointmentId);
    return detail!;
  }

  /**
   * Updates consultation draft notes/diagnosis/treatment.
   * Only allowed while consultation is not completed.
   */
  async updateDraft(
    consultationId: string,
    doctorId: string,
    dto: UpdateConsultationDto
  ): Promise<DbConsultationDetail> {
    const existing = await this.findConsultationById(consultationId);
    if (!existing) {
      const err: any = new Error('Consultation not found');
      err.status = 404;
      throw err;
    }

    if (existing.doctor_id !== doctorId) {
      const err: any = new Error('Forbidden: You can only update your own consultations');
      err.status = 403;
      throw err;
    }

    if (existing.status === 'completed') {
      const err: any = new Error('Cannot modify a finalized/completed consultation');
      err.status = 400;
      throw err;
    }

    const query = `
      UPDATE consultations
      SET
        symptoms = COALESCE($1, symptoms),
        clinical_notes = COALESCE($2, clinical_notes),
        diagnosis = COALESCE($3, diagnosis),
        treatment_plan = COALESCE($4, treatment_plan),
        follow_up_instructions = COALESCE($5, follow_up_instructions),
        prescription = COALESCE($6, prescription),
        updated_at = NOW()
      WHERE id = $7
    `;

    await pool.query(query, [
      dto.symptoms ?? null,
      dto.clinical_notes ?? null,
      dto.diagnosis ?? null,
      dto.treatment_plan ?? null,
      dto.follow_up_instructions ?? null,
      dto.prescription ?? null,
      consultationId,
    ]);

    const updated = await this.findConsultationById(consultationId);
    return updated!;
  }

  /**
   * Finalizes consultation and marks both consultation and appointment as 'completed'.
   */
  async completeConsultation(
    consultationId: string,
    doctorId: string,
    dto?: UpdateConsultationDto
  ): Promise<DbConsultationDetail> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existingRes = await client.query<{
        id: string;
        appointment_id: string;
        doctor_id: string;
        status: string;
        patient_user_id: string;
      }>(
        `SELECT c.id, c.appointment_id, a.doctor_id, c.status, pat_u.id AS patient_user_id
         FROM consultations c
         JOIN appointments a ON c.appointment_id = a.id
         JOIN patients p ON a.patient_id = p.id
         JOIN users pat_u ON p.user_id = pat_u.id
         WHERE c.id = $1
         FOR UPDATE OF c`,
        [consultationId]
      );

      if (existingRes.rowCount === 0) {
        const err: any = new Error('Consultation not found');
        err.status = 404;
        throw err;
      }

      const existing = existingRes.rows[0];

      if (existing.doctor_id !== doctorId) {
        const err: any = new Error('Forbidden: You can only complete your own consultations');
        err.status = 403;
        throw err;
      }

      if (existing.status === 'completed') {
        const err: any = new Error('Consultation is already completed');
        err.status = 400;
        throw err;
      }

      // Update consultation record
      await client.query(
        `UPDATE consultations
         SET
           status = 'completed',
           ended_at = NOW(),
           symptoms = COALESCE($1, symptoms),
           clinical_notes = COALESCE($2, clinical_notes),
           diagnosis = COALESCE($3, diagnosis),
           treatment_plan = COALESCE($4, treatment_plan),
           follow_up_instructions = COALESCE($5, follow_up_instructions),
           prescription = COALESCE($6, prescription),
           updated_at = NOW()
         WHERE id = $7`,
        [
          dto?.symptoms ?? null,
          dto?.clinical_notes ?? null,
          dto?.diagnosis ?? null,
          dto?.treatment_plan ?? null,
          dto?.follow_up_instructions ?? null,
          dto?.prescription ?? null,
          consultationId,
        ]
      );

      await notificationService.createOnce({
        recipientUserId: existing.patient_user_id,
        type: 'consultation_completed',
        title: 'Consultation completed',
        message: 'Your consultation is complete. You can review the clinical record.',
        appointmentId: existing.appointment_id,
        consultationId,
        eventKey: `consultation-completed-patient:${consultationId}`,
      }, client);

      // Advance appointment to completed
      await client.query(
        `UPDATE appointments
         SET status = 'completed', updated_at = NOW()
         WHERE id = $1`,
        [existing.appointment_id]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const completed = await this.findConsultationById(consultationId);
    return completed!;
  }
}

export const consultationRepository = new ConsultationRepository();
