/**
 * DoctorDirect – Prescription Types (Milestone 8)
 */

export interface MedicineItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface RawPrescription {
  id: string;
  consultation_id: string;
  doctor_id: string;
  patient_id: string;
  diagnosis: string;
  medicines: MedicineItem[] | string;
  general_advice: string | null;
  signature_metadata: any;
  is_signed: boolean;
  signed_at: string | null;
  created_at: string;
  updated_at: string;

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

export interface Prescription {
  id: string;
  consultationId: string;
  doctorId: string;
  patientId: string;
  diagnosis: string;
  medicines: MedicineItem[];
  generalAdvice: string | null;
  isSigned: boolean;
  signedAt: string | null;
  createdAt: string;
  updatedAt: string;

  doctorFullName: string;
  doctorQualification: string | null;
  specializationName: string;

  patientFullName: string;

  slotDate: string | null;
  slotStartTime: string | null;
  slotEndTime: string | null;
}

export interface CreatePrescriptionPayload {
  consultationId: string;
  diagnosis: string;
  medicines: MedicineItem[];
  generalAdvice?: string;
}

export interface UpdatePrescriptionPayload {
  diagnosis?: string;
  medicines?: MedicineItem[];
  generalAdvice?: string;
}

export interface PrescriptionResponse {
  prescription: RawPrescription;
}

export interface PrescriptionsListResponse {
  prescriptions: RawPrescription[];
}

export function normalizePrescription(raw: RawPrescription): Prescription {
  let parsedMedicines: MedicineItem[] = [];
  if (Array.isArray(raw.medicines)) {
    parsedMedicines = raw.medicines;
  } else if (typeof raw.medicines === 'string') {
    try {
      parsedMedicines = JSON.parse(raw.medicines);
    } catch {
      parsedMedicines = [];
    }
  }

  const doctorFirst = raw.doctor_first_name || '';
  const doctorLast = raw.doctor_last_name || '';
  const doctorFullName = [doctorFirst, doctorLast].filter(Boolean).join(' ') || 'Doctor';

  const patientFirst = raw.patient_first_name || '';
  const patientLast = raw.patient_last_name || '';
  const patientFullName = [patientFirst, patientLast].filter(Boolean).join(' ') || 'Patient';

  return {
    id: raw.id,
    consultationId: raw.consultation_id,
    doctorId: raw.doctor_id,
    patientId: raw.patient_id,
    diagnosis: raw.diagnosis,
    medicines: parsedMedicines,
    generalAdvice: raw.general_advice,
    isSigned: raw.is_signed,
    signedAt: raw.signed_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,

    doctorFullName: `Dr. ${doctorFullName.replace(/^Dr\.?\s*/i, '')}`.trim(),
    doctorQualification: raw.doctor_qualification ?? null,
    specializationName: raw.specialization_name || 'General Physician',

    patientFullName,

    slotDate: raw.slot_date ?? null,
    slotStartTime: raw.slot_start_time ?? null,
    slotEndTime: raw.slot_end_time ?? null,
  };
}
