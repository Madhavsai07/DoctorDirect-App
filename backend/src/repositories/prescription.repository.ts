// Prescription Repository
// Handles creation, retrieval, draft updates, and finalisation of medical prescriptions.
// All operations enforce that only the owning doctor can modify a prescription
// and that a finalized prescription is immutable.

import { pool } from '../db/pool';
import { notificationService } from '../services/notification.service';

export interface DbPrescription {
  id: string;
  consultation_id: string;
  doctor_id: string;
  patient_id: string;
  diagnosis: string;
  medicines: any; // JSONB array of medicine objects
  general_advice: string | null;
  signature_metadata: any; // JSONB for future e‑signature data
  is_signed: boolean;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrescriptionCreateDto {
  consultationId: string;
  doctorId: string;
  patientId: string;
  diagnosis: string;
  medicines: any[]; // each entry: { name, dosage, frequency, duration, instructions }
  generalAdvice?: string;
}

export interface PrescriptionUpdateDto {
  diagnosis?: string;
  medicines?: any[];
  generalAdvice?: string;
}

export interface DbPrescriptionDetail extends DbPrescription {
  doctor_first_name?: string;
  doctor_last_name?: string;
  doctor_qualification?: string | null;
  specialization_name?: string;
  patient_first_name?: string;
  patient_last_name?: string;
  slot_date?: string;
  slot_start_time?: string;
  slot_end_time?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DETAIL_SELECT = `
  SELECT
    p.id,
    p.consultation_id,
    p.doctor_id,
    p.patient_id,
    p.diagnosis,
    p.medicines,
    p.general_advice,
    p.signature_metadata,
    p.is_signed,
    p.signed_at,
    p.created_at,
    p.updated_at,
    doc_u.first_name AS doctor_first_name,
    doc_u.last_name AS doctor_last_name,
    d.qualification AS doctor_qualification,
    sp.name AS specialization_name,
    pat_u.first_name AS patient_first_name,
    pat_u.last_name AS patient_last_name,
    s.date::text AS slot_date,
    s.start_time::text AS slot_start_time,
    s.end_time::text AS slot_end_time
  FROM prescriptions p
  JOIN consultations c ON p.consultation_id = c.id
  JOIN appointments a ON c.appointment_id = a.id
  JOIN slots s ON a.slot_id = s.id
  JOIN doctors d ON p.doctor_id = d.id
  JOIN users doc_u ON d.user_id = doc_u.id
  JOIN specializations sp ON d.specialization_id = sp.id
  JOIN patients pat ON p.patient_id = pat.id
  JOIN users pat_u ON pat.user_id = pat_u.id
`;

export class PrescriptionRepository {
  /** Create a new prescription draft (is_signed = false) */
  async createPrescription(dto: PrescriptionCreateDto): Promise<DbPrescriptionDetail> {
    const { consultationId, doctorId, patientId, diagnosis, medicines, generalAdvice } = dto;
    const client = await pool.connect();
    let prescriptionId: string;
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1::text))', [consultationId]);
      const existing = await client.query<{ id: string; is_signed: boolean }>(
        `SELECT id, is_signed
         FROM prescriptions
         WHERE consultation_id = $1
         ORDER BY created_at DESC
         LIMIT 1
         FOR UPDATE`,
        [consultationId]
      );
      if (existing.rows[0]) {
        if (existing.rows[0].is_signed) {
          throw Object.assign(
            new Error('Prescription for this consultation has already been finalized'),
            { status: 400 }
          );
        }
        prescriptionId = existing.rows[0].id;
      } else {
        const created = await client.query<{ id: string }>(
          `INSERT INTO prescriptions (
            consultation_id, doctor_id, patient_id, diagnosis, medicines,
            general_advice, signature_metadata, is_signed, signed_at
          ) VALUES ($1,$2,$3,$4,$5,$6,'{}'::jsonb,false,null)
          RETURNING id`,
          [consultationId, doctorId, patientId, diagnosis, JSON.stringify(medicines), generalAdvice ?? null]
        );
        prescriptionId = created.rows[0].id;
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    const detailed = await this.getPrescriptionById(prescriptionId!);
    return detailed!;
  }

  /** Retrieve a prescription by its ID */
  async getPrescriptionById(id: string): Promise<DbPrescriptionDetail | null> {
    if (!UUID_RE.test(id)) {
      return null;
    }
    const res = await pool.query<DbPrescriptionDetail>(
      `${DETAIL_SELECT} WHERE p.id = $1`,
      [id]
    );
    return res.rows[0] ?? null;
  }

  /** Retrieve a prescription by its consultation ID */
  async getPrescriptionByConsultationId(consultationId: string): Promise<DbPrescriptionDetail | null> {
    if (!UUID_RE.test(consultationId)) {
      return null;
    }
    const res = await pool.query<DbPrescriptionDetail>(
      `${DETAIL_SELECT} WHERE p.consultation_id = $1 ORDER BY p.created_at DESC LIMIT 1`,
      [consultationId]
    );
    return res.rows[0] ?? null;
  }

  /** Retrieve all prescriptions for a patient (history) */
  async getPrescriptionsByPatientId(patientId: string): Promise<DbPrescriptionDetail[]> {
    if (!UUID_RE.test(patientId)) {
      return [];
    }
    const res = await pool.query<DbPrescriptionDetail>(
      `${DETAIL_SELECT} WHERE p.patient_id = $1 AND p.is_signed = TRUE ORDER BY p.signed_at DESC, p.created_at DESC`,
      [patientId]
    );
    return res.rows;
  }

  /** Update a prescription draft – only allowed while is_signed = false */
  async updatePrescriptionDraft(
    prescriptionId: string,
    doctorId: string,
    dto: PrescriptionUpdateDto
  ): Promise<DbPrescription> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const locked = await client.query<Pick<DbPrescription, 'doctor_id' | 'is_signed'>>(
        'SELECT doctor_id, is_signed FROM prescriptions WHERE id = $1 FOR UPDATE',
        [prescriptionId]
      );
      const pres = locked.rows[0];
      if (!pres) throw Object.assign(new Error('Prescription not found'), { status: 404 });
      if (pres.doctor_id !== doctorId) {
        throw Object.assign(new Error('Forbidden: You are not the prescribing doctor'), { status: 403 });
      }
      if (pres.is_signed) {
        throw Object.assign(new Error('Cannot edit a finalized prescription'), { status: 400 });
      }

      await client.query(
        `UPDATE prescriptions SET
          diagnosis = COALESCE($1, diagnosis),
          medicines = COALESCE($2, medicines),
          general_advice = COALESCE($3, general_advice),
          updated_at = NOW()
         WHERE id = $4 AND is_signed = FALSE`,
        [dto.diagnosis ?? null, dto.medicines ? JSON.stringify(dto.medicines) : null,
          dto.generalAdvice ?? null, prescriptionId]
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    const updated = await this.getPrescriptionById(prescriptionId);
    return updated!;
  }

  /** Finalise a prescription – lock it for further edits */
  async finalizePrescription(prescriptionId: string, doctorId: string): Promise<DbPrescriptionDetail> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const locked = await client.query<DbPrescription & { patient_user_id: string; appointment_id: string }>(
        `SELECT p.*, pat_u.id AS patient_user_id, c.appointment_id
         FROM prescriptions p
         JOIN patients pat ON p.patient_id = pat.id
         JOIN users pat_u ON pat.user_id = pat_u.id
         JOIN consultations c ON p.consultation_id = c.id
         WHERE p.id = $1 FOR UPDATE OF p`,
        [prescriptionId]
      );
      const pres = locked.rows[0];
      if (!pres) throw Object.assign(new Error('Prescription not found'), { status: 404 });
      if (pres.doctor_id !== doctorId) {
        throw Object.assign(new Error('Forbidden: You are not the prescribing doctor'), { status: 403 });
      }
      if (pres.is_signed) throw Object.assign(new Error('Prescription is already finalised'), { status: 400 });

      await client.query(
        `UPDATE prescriptions SET is_signed = TRUE, signed_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [prescriptionId]
      );
      await notificationService.createOnce({
        recipientUserId: pres.patient_user_id,
        type: 'prescription_finalized',
        title: 'Prescription finalized',
        message: 'Your doctor has finalized a digital prescription for your consultation.',
        appointmentId: pres.appointment_id,
        consultationId: pres.consultation_id,
        prescriptionId,
        eventKey: `prescription-finalized-patient:${prescriptionId}`,
      }, client);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    const finalized = await this.getPrescriptionById(prescriptionId);
    return finalized!;
  }
}

export const prescriptionRepository = new PrescriptionRepository();
