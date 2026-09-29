/**
 * DoctorDirect – Appointment Types (Milestone 6)
 */

export type AppointmentStatus =
  | 'booked'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'
  | 'no_show';

export interface RawAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  slot_id: string;
  status: AppointmentStatus;
  reason_for_visit: string | null;
  cancellation_reason: string | null;
  booked_at: string;
  created_at: string;
  updated_at: string;

  slot_date: string;
  slot_start_time: string;
  slot_end_time: string;

  doctor_first_name: string;
  doctor_last_name: string;
  doctor_avatar_url: string | null;
  doctor_license_number: string;
  doctor_experience_years: number;
  doctor_consultation_fee: string | number;
  doctor_qualification: string | null;
  specialization_name: string;

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

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  slotId: string;
  status: AppointmentStatus;
  reasonForVisit: string | null;
  cancellationReason: string | null;
  bookedAt: string;
  createdAt: string;
  updatedAt: string;

  // Slot
  date: string;
  startTime: string;
  endTime: string;

  // Doctor info
  doctorFirstName: string;
  doctorLastName: string;
  doctorFullName: string;
  doctorAvatarUrl: string | null;
  doctorLicenseNumber: string;
  doctorExperienceYears: number;
  doctorConsultationFee: number;
  doctorQualification: string | null;
  specializationName: string;

  // Patient info
  patientFirstName: string;
  patientLastName: string;
  patientFullName: string;
  patientEmail: string;
  patientPhone: string | null;
  patientDateOfBirth: string | null;
  patientGender: string | null;
  patientBloodGroup: string | null;
  patientMedicalHistory: string | null;
  patientAllergies: string | null;
}

export function normalizeAppointment(raw: RawAppointment): Appointment {
  const feeNum = typeof raw.doctor_consultation_fee === 'number'
    ? raw.doctor_consultation_fee
    : parseFloat(String(raw.doctor_consultation_fee)) || 0;

  const expNum = typeof raw.doctor_experience_years === 'number'
    ? raw.doctor_experience_years
    : parseInt(String(raw.doctor_experience_years), 10) || 0;

  return {
    id: raw.id,
    patientId: raw.patient_id,
    doctorId: raw.doctor_id,
    slotId: raw.slot_id,
    status: raw.status,
    reasonForVisit: raw.reason_for_visit,
    cancellationReason: raw.cancellation_reason,
    bookedAt: raw.booked_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,

    date: raw.slot_date,
    startTime: raw.slot_start_time,
    endTime: raw.slot_end_time,

    doctorFirstName: raw.doctor_first_name || '',
    doctorLastName: raw.doctor_last_name || '',
    doctorFullName: `Dr. ${raw.doctor_first_name || ''} ${raw.doctor_last_name || ''}`.trim(),
    doctorAvatarUrl: raw.doctor_avatar_url,
    doctorLicenseNumber: raw.doctor_license_number,
    doctorExperienceYears: expNum,
    doctorConsultationFee: feeNum,
    doctorQualification: raw.doctor_qualification,
    specializationName: raw.specialization_name || 'General Medicine',

    patientFirstName: raw.patient_first_name || '',
    patientLastName: raw.patient_last_name || '',
    patientFullName: `${raw.patient_first_name || ''} ${raw.patient_last_name || ''}`.trim(),
    patientEmail: raw.patient_email,
    patientPhone: raw.patient_phone,
    patientDateOfBirth: raw.patient_date_of_birth,
    patientGender: raw.patient_gender,
    patientBloodGroup: raw.patient_blood_group,
    patientMedicalHistory: raw.patient_medical_history,
    patientAllergies: raw.patient_allergies,
  };
}

export interface AppointmentListResponse {
  appointments: RawAppointment[];
  count: number;
}

export interface AppointmentDetailResponse {
  appointment: RawAppointment;
}
