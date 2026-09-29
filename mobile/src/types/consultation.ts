/**
 * DoctorDirect – Consultation Types (Milestone 7)
 */

export type ConsultationStatus =
  | 'scheduled'
  | 'waiting'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface RawConsultation {
  id: string;
  appointment_id: string;
  room_id: string;
  status: ConsultationStatus;
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

export interface Consultation {
  id: string;
  appointmentId: string;
  roomId: string;
  status: ConsultationStatus;
  startedAt: string | null;
  endedAt: string | null;
  symptoms: string;
  diagnosis: string;
  clinicalNotes: string;
  treatmentPlan: string;
  followUpInstructions: string;
  prescription: string;
  createdAt: string;
  updatedAt: string;

  // Doctor info
  doctorId: string;
  doctorFullName: string;
  doctorQualification: string;
  specializationName: string;

  // Patient info
  patientId: string;
  patientFullName: string;
  patientGender: string;
  patientAge: number | null;
  patientBloodGroup: string;
  patientMedicalHistory: string;
  patientAllergies: string;

  // Appointment info
  reasonForVisit: string;
  appointmentStatus: string;
  slotDate: string;
  slotStartTime: string;
  slotEndTime: string;
}

export function normalizeConsultation(raw: RawConsultation): Consultation {
  const birthYear = raw.patient_date_of_birth
    ? new Date(raw.patient_date_of_birth).getFullYear()
    : null;
  const currentYear = new Date().getFullYear();
  const patientAge = birthYear ? currentYear - birthYear : null;

  return {
    id: raw.id,
    appointmentId: raw.appointment_id,
    roomId: raw.room_id,
    status: raw.status,
    startedAt: raw.started_at,
    endedAt: raw.ended_at,
    symptoms: raw.symptoms || '',
    diagnosis: raw.diagnosis || '',
    clinicalNotes: raw.clinical_notes || raw.notes || '',
    treatmentPlan: raw.treatment_plan || '',
    followUpInstructions: raw.follow_up_instructions || '',
    prescription: raw.prescription || '',
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,

    doctorId: raw.doctor_id,
    doctorFullName: `Dr. ${raw.doctor_first_name || ''} ${raw.doctor_last_name || ''}`.trim(),
    doctorQualification: raw.doctor_qualification || '',
    specializationName: raw.specialization_name || 'General Medicine',

    patientId: raw.patient_id,
    patientFullName: `${raw.patient_first_name || ''} ${raw.patient_last_name || ''}`.trim(),
    patientGender: raw.patient_gender || '',
    patientAge,
    patientBloodGroup: raw.patient_blood_group || '',
    patientMedicalHistory: raw.patient_medical_history || '',
    patientAllergies: raw.patient_allergies || '',

    reasonForVisit: raw.reason_for_visit || '',
    appointmentStatus: raw.appointment_status || '',
    slotDate: raw.slot_date,
    slotStartTime: raw.slot_start_time,
    slotEndTime: raw.slot_end_time,
  };
}

export interface ConsultationResponse {
  consultation: RawConsultation;
}

export interface UpdateConsultationPayload {
  symptoms?: string;
  clinical_notes?: string;
  diagnosis?: string;
  treatment_plan?: string;
  follow_up_instructions?: string;
  prescription?: string;
}
