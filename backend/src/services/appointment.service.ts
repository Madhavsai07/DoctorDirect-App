import { appointmentRepository, DbAppointmentDetail } from '../repositories/appointment.repository';
import { doctorService } from './doctor.service';
import { userRepository } from '../repositories/user.repository';
import { doctorRepository } from '../repositories/doctor.repository';

export class AppointmentService {
  /**
   * Book an available slot as a patient.
   * Rejects bookings with unapproved doctors.
   */
  async bookAppointment(
    patientUserId: string,
    slotId: string,
    reasonForVisit?: string
  ): Promise<DbAppointmentDetail> {
    if (!slotId) {
      const err: any = new Error('Slot ID is required');
      err.status = 400;
      throw err;
    }

    // Verify that the doctor associated with this slot is approved
    const slotDoctor = await appointmentRepository.getSlotDoctorId(slotId);
    if (slotDoctor) {
      const verificationStatus = await doctorRepository.getDoctorVerificationStatus(slotDoctor);
      if (verificationStatus && verificationStatus !== 'approved') {
        const err: any = new Error('Cannot book appointment: doctor is not yet verified');
        err.status = 403;
        throw err;
      }
    }

    const patientId = await appointmentRepository.ensurePatientProfile(patientUserId);
    return appointmentRepository.bookSlot({
      patientId,
      patientUserId,
      slotId,
      reasonForVisit,
    });
  }

  /**
   * List appointments for authenticated patient
   */
  async getPatientAppointments(
    patientUserId: string,
    filter?: 'upcoming' | 'past' | 'all'
  ): Promise<DbAppointmentDetail[]> {
    const patientId = await appointmentRepository.ensurePatientProfile(patientUserId);
    return appointmentRepository.getPatientAppointments(patientId, filter);
  }

  /**
   * List appointments for authenticated doctor
   */
  async getDoctorAppointments(
    doctorUserId: string,
    filter?: 'upcoming' | 'past' | 'today' | 'all'
  ): Promise<DbAppointmentDetail[]> {
    const doctorProfile = await doctorService.getDoctorProfileByUserId(doctorUserId);
    return appointmentRepository.getDoctorAppointments(doctorProfile.doctor_id, filter);
  }

  /**
   * Get single appointment with RBAC check
   */
  async getAppointmentDetail(
    appointmentId: string,
    user: { id: string; role: string }
  ): Promise<DbAppointmentDetail> {
    const appt = await appointmentRepository.getAppointmentById(appointmentId);
    if (!appt) {
      const err: any = new Error('Appointment not found');
      err.status = 404;
      throw err;
    }

    if (user.role === 'patient') {
      const patientId = await appointmentRepository.ensurePatientProfile(user.id);
      if (appt.patient_id !== patientId) {
        const err: any = new Error('Forbidden: Access denied to this appointment');
        err.status = 403;
        throw err;
      }
    } else if (user.role === 'doctor') {
      const doctorProfile = await doctorService.getDoctorProfileByUserId(user.id);
      if (appt.doctor_id !== doctorProfile.doctor_id) {
        const err: any = new Error('Forbidden: Access denied to this appointment');
        err.status = 403;
        throw err;
      }
    } else {
      const err: any = new Error('Forbidden: Access denied to this appointment');
      err.status = 403;
      throw err;
    }

    return appt;
  }

  /**
   * Doctor confirms a booked appointment
   */
  async confirmAppointment(appointmentId: string, doctorUserId: string): Promise<DbAppointmentDetail> {
    const doctorProfile = await doctorService.getDoctorProfileByUserId(doctorUserId);
    const appt = await appointmentRepository.getAppointmentById(appointmentId);
    if (!appt) {
      const err: any = new Error('Appointment not found');
      err.status = 404;
      throw err;
    }

    if (appt.doctor_id !== doctorProfile.doctor_id) {
      const err: any = new Error('Forbidden: You can only confirm appointments for yourself');
      err.status = 403;
      throw err;
    }

    return appointmentRepository.updateStatus({
      appointmentId,
      newStatus: 'confirmed',
      actorRole: 'doctor',
    });
  }

  /**
   * Doctor updates appointment status (in_progress, completed)
   */
  async updateDoctorAppointmentStatus(
    appointmentId: string,
    doctorUserId: string,
    newStatus: 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show',
    cancellationReason?: string
  ): Promise<DbAppointmentDetail> {
    const doctorProfile = await doctorService.getDoctorProfileByUserId(doctorUserId);
    const appt = await appointmentRepository.getAppointmentById(appointmentId);
    if (!appt) {
      const err: any = new Error('Appointment not found');
      err.status = 404;
      throw err;
    }

    if (appt.doctor_id !== doctorProfile.doctor_id) {
      const err: any = new Error('Forbidden: You cannot modify this appointment');
      err.status = 403;
      throw err;
    }

    return appointmentRepository.updateStatus({
      appointmentId,
      newStatus,
      cancellationReason,
      actorRole: 'doctor',
    });
  }

  /**
   * Cancel appointment by patient or doctor
   */
  async cancelAppointment(
    appointmentId: string,
    user: { id: string; role: string },
    cancellationReason?: string
  ): Promise<DbAppointmentDetail> {
    const appt = await appointmentRepository.getAppointmentById(appointmentId);
    if (!appt) {
      const err: any = new Error('Appointment not found');
      err.status = 404;
      throw err;
    }

    if (user.role === 'patient') {
      const patientId = await appointmentRepository.ensurePatientProfile(user.id);
      if (appt.patient_id !== patientId) {
        const err: any = new Error('Forbidden: You cannot cancel another patient appointment');
        err.status = 403;
        throw err;
      }
    } else if (user.role === 'doctor') {
      const doctorProfile = await doctorService.getDoctorProfileByUserId(user.id);
      if (appt.doctor_id !== doctorProfile.doctor_id) {
        const err: any = new Error('Forbidden: You cannot cancel another doctor appointment');
        err.status = 403;
        throw err;
      }
      const verificationStatus = await doctorRepository.getDoctorVerificationStatus(doctorProfile.doctor_id);
      if (verificationStatus !== 'approved') {
        const err: any = new Error('Only approved doctors may cancel appointments.');
        err.status = 403;
        throw err;
      }
    } else {
      const err: any = new Error('Forbidden: You cannot cancel this appointment');
      err.status = 403;
      throw err;
    }

    const reasonPrefix = user.role === 'patient' ? 'Cancelled by patient' : 'Cancelled by doctor';
    const fullReason = cancellationReason ? `${reasonPrefix}: ${cancellationReason}` : reasonPrefix;

    return appointmentRepository.updateStatus({
      appointmentId,
      newStatus: 'cancelled',
      cancellationReason: fullReason,
      actorRole: user.role as 'patient' | 'doctor',
    });
  }

  /**
   * Reschedule appointment by patient
   */
  async rescheduleAppointment(
    appointmentId: string,
    newSlotId: string,
    patientUserId: string
  ): Promise<DbAppointmentDetail> {
    if (!newSlotId) {
      const err: any = new Error('New slot ID is required');
      err.status = 400;
      throw err;
    }

    const patientId = await appointmentRepository.ensurePatientProfile(patientUserId);
    return appointmentRepository.rescheduleAppointment({
      appointmentId,
      newSlotId,
      patientId,
    });
  }
}

export const appointmentService = new AppointmentService();
