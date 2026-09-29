/**
 * DoctorDirect – Doctor Discovery & Availability Types (Milestone 5)
 */

export interface Specialization {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export interface Doctor {
  doctorId: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl: string | null;
  specializationId: string;
  specializationName: string;
  licenseNumber: string;
  experienceYears: number;
  consultationFee: number;
  bio: string | null;
  qualification: string | null;
  isAvailable: boolean;
  rating: number;
}

export interface Availability {
  id: string;
  doctorId: string;
  dayOfWeek: number; // 0=Sunday … 6=Saturday
  startTime: string; // "HH:MM:SS"
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

export interface Slot {
  id: string;
  doctorId: string;
  date: string;      // "YYYY-MM-DD"
  startTime: string; // "HH:MM:SS"
  endTime: string;
  status: 'available' | 'reserved' | 'booked' | 'cancelled' | 'blocked';
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface SpecializationsResponse {
  specializations: Array<{
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
  }>;
}

export interface DoctorListResponse {
  doctors: Array<{
    doctor_id: string;
    user_id: string;
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
  }>;
  count: number;
}

export interface DoctorProfileResponse {
  doctor: DoctorListResponse['doctors'][0];
}

export interface AvailabilityResponse {
  availability: Array<{
    id: string;
    doctor_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
    is_active: boolean;
  }>;
  doctorId?: string;
}

export interface SlotsResponse {
  slots: Array<{
    id: string;
    doctor_id: string;
    date: string;
    start_time: string;
    end_time: string;
    status: Slot['status'];
  }>;
}

// ─── Normalizers (snake_case API → camelCase app) ─────────────────────────────

export function normalizeDoctor(raw: DoctorListResponse['doctors'][0]): Doctor {
  const ratingNum = typeof raw.rating === 'number' ? raw.rating : parseFloat(String(raw.rating)) || 0;
  const feeNum = typeof raw.consultation_fee === 'number' ? raw.consultation_fee : parseFloat(String(raw.consultation_fee)) || 0;
  const expNum = typeof raw.experience_years === 'number' ? raw.experience_years : parseInt(String(raw.experience_years), 10) || 0;

  return {
    doctorId: raw.doctor_id,
    userId: raw.user_id,
    firstName: raw.first_name || '',
    lastName: raw.last_name || '',
    fullName: `Dr. ${(raw.first_name || '').replace(/^Dr\.?\s*/i, '')} ${raw.last_name || ''}`.trim(),
    avatarUrl: raw.avatar_url,
    specializationId: raw.specialization_id,
    specializationName: raw.specialization_name || 'General Medicine',
    licenseNumber: raw.license_number,
    experienceYears: expNum,
    consultationFee: feeNum,
    bio: raw.bio,
    qualification: raw.qualification,
    isAvailable: Boolean(raw.is_available),
    rating: ratingNum,
  };
}

export function normalizeAvailability(raw: AvailabilityResponse['availability'][0]): Availability {
  return {
    id: raw.id,
    doctorId: raw.doctor_id,
    dayOfWeek: raw.day_of_week,
    startTime: raw.start_time,
    endTime: raw.end_time,
    slotDurationMinutes: raw.slot_duration_minutes,
    isActive: raw.is_active,
  };
}

export function normalizeSlot(raw: SlotsResponse['slots'][0]): Slot {
  return {
    id: raw.id,
    doctorId: raw.doctor_id,
    date: raw.date,
    startTime: raw.start_time,
    endTime: raw.end_time,
    status: raw.status,
  };
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function formatTime(time: string): string {
  // "HH:MM:SS" → "H:MM AM/PM"
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatFee(fee: number): string {
  return `₹${fee.toLocaleString('en-IN')}`;
}
