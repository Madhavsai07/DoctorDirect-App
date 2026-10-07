// Prescription Service
// Business logic for creating, reading, updating draft, and finalising prescriptions.
// Enforces RBAC: only the consulting doctor can create / edit / finalize.
// Patients can only read their own prescriptions.

import { prescriptionRepository, PrescriptionCreateDto, PrescriptionUpdateDto, DbPrescription } from '../repositories/prescription.repository';
import { consultationRepository } from '../repositories/consultation.repository';

export class PrescriptionService {
  /**
   * Create a new prescription draft for a completed consultation.
   * The doctor must be the one who conducted the consultation.
   */
  async createPrescription(dto: PrescriptionCreateDto, doctorUserId: string): Promise<DbPrescription> {
    // Verify consultation exists and belongs to this doctor
    const consultation = await consultationRepository.findConsultationById(dto.consultationId);
    if (!consultation) {
      const err: any = new Error('Consultation not found');
      err.status = 404;
      throw err;
    }
    const doctorId = await this._getDoctorIdFromUser(doctorUserId);
    if (consultation.doctor_id !== doctorId) {
      const err: any = new Error('Forbidden: You are not the doctor for this consultation');
      err.status = 403;
      throw err;
    }
    // Ensure consultation is completed before prescribing
    if (consultation.status !== 'completed') {
      const err: any = new Error('Prescription can only be created after consultation is completed');
      err.status = 400;
      throw err;
    }
    // Populate doctorId and patientId for repository
    const repoDto = {
      ...dto,
      doctorId,
      patientId: consultation.patient_id,
    };
    return prescriptionRepository.createPrescription(repoDto);
  }

  /** Retrieve a prescription by ID. Accessible to the prescribing doctor or the patient of the consultation. */
  async getPrescriptionById(prescriptionId: string, requester: { id: string; role: string }): Promise<DbPrescription> {
    const pres = await prescriptionRepository.getPrescriptionById(prescriptionId);
    if (!pres) {
      const err: any = new Error('Prescription not found');
      err.status = 404;
      throw err;
    }
    // Load consultation to verify patient access
    const consultation = await consultationRepository.findConsultationById(pres.consultation_id);
    if (!consultation) {
      const err: any = new Error('Associated consultation not found');
      err.status = 404;
      throw err;
    }
    if (requester.role === 'doctor') {
      const doctorId = await this._getDoctorIdFromUser(requester.id);
      if (consultation.doctor_id !== doctorId) {
        const err: any = new Error('Forbidden: Doctor does not own this prescription');
        err.status = 403;
        throw err;
      }
    } else if (requester.role === 'patient') {
      const patientId = await this._getPatientIdFromUser(requester.id);
      if (consultation.patient_id !== patientId) {
        const err: any = new Error('Forbidden: Patient does not own this prescription');
        err.status = 403;
        throw err;
      }
      if (!pres.is_signed) {
        throw Object.assign(new Error('Prescription not found'), { status: 404 });
      }
    } else {
      const err: any = new Error('Forbidden: Invalid role');
      err.status = 403;
      throw err;
    }
    return pres;
  }

  /** Retrieve a prescription by consultation ID. Accessible to the prescribing doctor or the patient. */
  async getPrescriptionByConsultationId(consultationId: string, requester: { id: string; role: string }): Promise<DbPrescription | null> {
    const consultation = await consultationRepository.findConsultationById(consultationId);
    if (!consultation) {
      const err: any = new Error('Consultation not found');
      err.status = 404;
      throw err;
    }

    if (requester.role === 'doctor') {
      const doctorId = await this._getDoctorIdFromUser(requester.id);
      if (consultation.doctor_id !== doctorId) {
        const err: any = new Error('Forbidden: Doctor does not own this consultation');
        err.status = 403;
        throw err;
      }
    } else if (requester.role === 'patient') {
      const patientId = await this._getPatientIdFromUser(requester.id);
      if (consultation.patient_id !== patientId) {
        const err: any = new Error('Forbidden: Patient does not own this consultation');
        err.status = 403;
        throw err;
      }
    } else {
      const err: any = new Error('Forbidden: Invalid role');
      err.status = 403;
      throw err;
    }

    const prescription = await prescriptionRepository.getPrescriptionByConsultationId(consultationId);
    if (requester.role === 'patient' && prescription && !prescription.is_signed) {
      throw Object.assign(new Error('Prescription not found'), { status: 404 });
    }
    return prescription;
  }

  /** Retrieve all prescriptions for a patient (history) */
  async getPatientPrescriptionHistory(patientUserId: string): Promise<DbPrescription[]> {
    const patientId = await this._getPatientIdFromUser(patientUserId);
    return prescriptionRepository.getPrescriptionsByPatientId(patientId);
  }

  /** Update a prescription draft – only allowed for the prescribing doctor while not finalised. */
  async updatePrescriptionDraft(prescriptionId: string, dto: PrescriptionUpdateDto, doctorUserId: string): Promise<DbPrescription> {
    const doctorId = await this._getDoctorIdFromUser(doctorUserId);
    return prescriptionRepository.updatePrescriptionDraft(prescriptionId, doctorId, dto);
  }

  /** Finalise a prescription – makes it read‑only. */
  async finalizePrescription(prescriptionId: string, doctorUserId: string): Promise<DbPrescription> {
    const doctorId = await this._getDoctorIdFromUser(doctorUserId);
    return prescriptionRepository.finalizePrescription(prescriptionId, doctorId);
  }

  // Helper to translate a userId to doctor_id (via doctorService / repository)
  private async _getDoctorIdFromUser(userId: string): Promise<string> {
    // Lazy import to avoid circular dependency
    const { doctorService } = await import('../services/doctor.service');
    const profile = await doctorService.getDoctorProfileByUserId(userId);
    return profile.doctor_id;
  }

  // Helper to translate a userId to patient_id (via appointmentRepository ensurePatientProfile)
  private async _getPatientIdFromUser(userId: string): Promise<string> {
    const { appointmentRepository } = await import('../repositories/appointment.repository');
    return appointmentRepository.ensurePatientProfile(userId);
  }
}

export const prescriptionService = new PrescriptionService();
