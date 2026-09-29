import {
  consultationRepository,
  DbConsultationDetail,
  UpdateConsultationDto,
} from '../repositories/consultation.repository';
import { doctorService } from './doctor.service';

export class ConsultationService {
  /**
   * Doctor starts or opens consultation session.
   * Advances appointment status to 'in_progress' if confirmed.
   */
  async startOrGetConsultation(
    appointmentId: string,
    doctorUserId: string
  ): Promise<DbConsultationDetail> {
    const doctorProfile = await doctorService.getDoctorProfileByUserId(doctorUserId);
    return consultationRepository.startOrGetConsultation(appointmentId, doctorProfile.doctor_id);
  }

  /**
   * Retrieves consultation for an appointment with RBAC check:
   * - Doctor can access own appointment consultations.
   * - Patient can access own appointment consultations.
   * - Cross-patient / cross-doctor access is strictly rejected.
   */
  async getConsultationByAppointment(
    appointmentId: string,
    user: { id: string; role: string }
  ): Promise<DbConsultationDetail> {
    const consultation = await consultationRepository.findConsultationByAppointmentId(appointmentId);
    if (!consultation) {
      const err: any = new Error('Consultation not found for this appointment');
      err.status = 404;
      throw err;
    }

    if (user.role === 'doctor') {
      const doctorProfile = await doctorService.getDoctorProfileByUserId(user.id);
      if (consultation.doctor_id !== doctorProfile.doctor_id) {
        const err: any = new Error('Forbidden: You cannot access another doctor consultation');
        err.status = 403;
        throw err;
      }
    } else if (user.role === 'patient') {
      if (consultation.patient_user_id !== user.id) {
        const err: any = new Error('Forbidden: You cannot access another patient consultation');
        err.status = 403;
        throw err;
      }
    } else {
      const err: any = new Error('Forbidden: Insufficient privileges');
      err.status = 403;
      throw err;
    }

    return consultation;
  }

  /**
   * Doctor saves draft notes / diagnosis / treatment.
   */
  async updateConsultationDraft(
    consultationId: string,
    doctorUserId: string,
    dto: UpdateConsultationDto
  ): Promise<DbConsultationDetail> {
    const doctorProfile = await doctorService.getDoctorProfileByUserId(doctorUserId);
    return consultationRepository.updateDraft(consultationId, doctorProfile.doctor_id, dto);
  }

  /**
   * Doctor completes/finalizes the consultation session.
   */
  async completeConsultation(
    consultationId: string,
    doctorUserId: string,
    dto?: UpdateConsultationDto
  ): Promise<DbConsultationDetail> {
    const doctorProfile = await doctorService.getDoctorProfileByUserId(doctorUserId);
    return consultationRepository.completeConsultation(consultationId, doctorProfile.doctor_id, dto);
  }
}

export const consultationService = new ConsultationService();
