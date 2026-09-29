import { doctorRepository, UpsertAvailabilityDto } from '../repositories/doctor.repository';

/**
 * DoctorService
 *
 * Business-logic layer for Milestone 5.
 * Sits between controllers and the repository.
 * All public methods throw typed errors; controllers translate them to HTTP responses.
 */

// ── Input validation helpers ──────────────────────────────────────────────────

const DAYS = [0, 1, 2, 3, 4, 5, 6];
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

function validateAvailabilityDto(dto: unknown): UpsertAvailabilityDto {
  const d = dto as Record<string, unknown>;

  const day = Number(d.day_of_week);
  if (!DAYS.includes(day)) {
    throw Object.assign(new Error('day_of_week must be an integer 0-6'), { status: 422 });
  }

  if (typeof d.start_time !== 'string' || !TIME_RE.test(d.start_time)) {
    throw Object.assign(new Error('start_time must be HH:MM or HH:MM:SS'), { status: 422 });
  }
  if (typeof d.end_time !== 'string' || !TIME_RE.test(d.end_time)) {
    throw Object.assign(new Error('end_time must be HH:MM or HH:MM:SS'), { status: 422 });
  }

  const duration = Number(d.slot_duration_minutes);
  if (!Number.isInteger(duration) || duration <= 0) {
    throw Object.assign(new Error('slot_duration_minutes must be a positive integer'), { status: 422 });
  }

  const isActive = d.is_active !== undefined ? Boolean(d.is_active) : true;

  return {
    day_of_week: day,
    start_time: d.start_time,
    end_time: d.end_time,
    slot_duration_minutes: duration,
    is_active: isActive,
  };
}

function validateDateRange(from: unknown, to: unknown): { fromDate: string; toDate: string } {
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (typeof from !== 'string' || !DATE_RE.test(from)) {
    throw Object.assign(new Error('from_date must be YYYY-MM-DD'), { status: 422 });
  }
  if (typeof to !== 'string' || !DATE_RE.test(to)) {
    throw Object.assign(new Error('to_date must be YYYY-MM-DD'), { status: 422 });
  }
  if (from > to) {
    throw Object.assign(new Error('from_date must be ≤ to_date'), { status: 422 });
  }

  // Cap range at 90 days
  const msPerDay = 86400000;
  const diff = (new Date(to).getTime() - new Date(from).getTime()) / msPerDay;
  if (diff > 90) {
    throw Object.assign(new Error('Date range must not exceed 90 days'), { status: 422 });
  }

  return { fromDate: from, toDate: to };
}

// ── Service methods ───────────────────────────────────────────────────────────

export const doctorService = {

  async getSpecializations() {
    return doctorRepository.listSpecializations();
  },

  async getDoctors(query: {
    search?: string;
    specialization_id?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.min(Number(query.limit) || 50, 100);
    const offset = Math.max(Number(query.offset) || 0, 0);
    return doctorRepository.listDoctors({
      search: query.search,
      specializationId: query.specialization_id,
      limit,
      offset,
    });
  },

  async getDoctorById(doctorId: string) {
    const doc = await doctorRepository.findDoctorById(doctorId);
    if (!doc) {
      throw Object.assign(new Error('Doctor not found'), { status: 404 });
    }
    return doc;
  },

  /** Resolve the authenticated doctor's own profile record. */
  async getDoctorProfileByUserId(userId: string) {
    const doc = await doctorRepository.findDoctorByUserId(userId);
    if (!doc) {
      throw Object.assign(new Error('Doctor profile not found for this user'), { status: 404 });
    }
    return doc;
  },

  // ── Availability ────────────────────────────────────────────────────────────

  async getAvailability(doctorId: string) {
    return doctorRepository.getAvailabilityForDoctor(doctorId);
  },

  async addAvailability(doctorId: string, body: unknown) {
    const dto = validateAvailabilityDto(body);
    return doctorRepository.upsertAvailability(doctorId, dto);
  },

  async updateAvailability(availabilityId: string, doctorId: string, body: unknown) {
    const dto = body as Partial<UpsertAvailabilityDto>;
    const updated = await doctorRepository.updateAvailability(availabilityId, doctorId, dto);
    if (!updated) {
      throw Object.assign(
        new Error('Availability window not found or does not belong to this doctor'),
        { status: 404 }
      );
    }
    return updated;
  },

  async removeAvailability(availabilityId: string, doctorId: string) {
    const ok = await doctorRepository.deactivateAvailability(availabilityId, doctorId);
    if (!ok) {
      throw Object.assign(
        new Error('Availability window not found or does not belong to this doctor'),
        { status: 404 }
      );
    }
  },

  // ── Slots ───────────────────────────────────────────────────────────────────

  async getSlots(doctorId: string, rawFrom: unknown, rawTo: unknown) {
    const { fromDate, toDate } = validateDateRange(rawFrom, rawTo);
    return doctorRepository.getSlotsForDoctor(doctorId, fromDate, toDate);
  },

  async generateSlots(doctorId: string, rawFrom: unknown, rawTo: unknown) {
    const { fromDate, toDate } = validateDateRange(rawFrom, rawTo);
    return doctorRepository.generateSlots(doctorId, fromDate, toDate);
  },
};
