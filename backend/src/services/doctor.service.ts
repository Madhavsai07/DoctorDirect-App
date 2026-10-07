import {
  doctorRepository,
  UpsertAvailabilityDto,
  ScheduleWindowDto,
} from '../repositories/doctor.repository';

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

function isValidTime(value: unknown): value is string {
  if (typeof value !== 'string' || !TIME_RE.test(value)) return false;
  const [hour, minute, second = 0] = value.split(':').map(Number);
  return hour <= 23 && minute <= 59 && second <= 59;
}

function timeToSeconds(value: string): number {
  const [hour, minute, second = 0] = value.split(':').map(Number);
  return hour * 3600 + minute * 60 + second;
}

function validateAvailabilityDto(dto: unknown): UpsertAvailabilityDto {
  const d = dto as Record<string, unknown>;

  const day = Number(d.day_of_week);
  if (!DAYS.includes(day)) {
    throw Object.assign(new Error('day_of_week must be an integer 0-6'), { status: 422 });
  }

  if (!isValidTime(d.start_time)) {
    throw Object.assign(new Error('start_time must be HH:MM or HH:MM:SS'), { status: 422 });
  }
  if (!isValidTime(d.end_time)) {
    throw Object.assign(new Error('end_time must be HH:MM or HH:MM:SS'), { status: 422 });
  }
  if (timeToSeconds(d.end_time) <= timeToSeconds(d.start_time)) {
    throw Object.assign(new Error('end_time must be after start_time'), { status: 422 });
  }

  const duration = Number(d.slot_duration_minutes);
  if (![15, 30, 45, 60].includes(duration)) {
    throw Object.assign(new Error('slot_duration_minutes must be 15, 30, 45, or 60'), { status: 422 });
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

function validateDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw Object.assign(new Error('date must be YYYY-MM-DD'), { status: 422 });
  }
  const parsed = Date.parse(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed) || new Date(parsed).toISOString().slice(0, 10) !== value) {
    throw Object.assign(new Error('date must be a valid calendar date'), { status: 422 });
  }
  return value;
}

function validateScheduleWindows(value: unknown): ScheduleWindowDto[] {
  if (!Array.isArray(value)) {
    throw Object.assign(new Error('windows must be an array'), { status: 422 });
  }
  const windows = value.map((item) => {
    if (!item || typeof item !== 'object') {
      throw Object.assign(new Error('Each window must be an object'), { status: 422 });
    }
    const window = item as Record<string, unknown>;
    if (!isValidTime(window.start_time) || !isValidTime(window.end_time) ||
        timeToSeconds(window.end_time) <= timeToSeconds(window.start_time)) {
      throw Object.assign(new Error('Each window needs valid start and end times'), { status: 422 });
    }
    const duration = Number(window.slot_duration_minutes);
    if (![15, 30, 45, 60].includes(duration)) {
      throw Object.assign(new Error('Slot duration must be 15, 30, 45, or 60 minutes'), { status: 422 });
    }
    return {
      start_time: window.start_time,
      end_time: window.end_time,
      slot_duration_minutes: duration,
    };
  }).sort((left, right) => left.start_time.localeCompare(right.start_time));
  for (let index = 1; index < windows.length; index += 1) {
    if (timeToSeconds(windows[index].start_time) < timeToSeconds(windows[index - 1].end_time)) {
      throw Object.assign(new Error('Date-specific windows must not overlap'), { status: 422 });
    }
  }
  return windows;
}

function validateDateRange(from: unknown, to: unknown): { fromDate: string; toDate: string } {
  const fromDate = validateDate(from);
  const toDate = validateDate(to);
  if (fromDate > toDate) {
    throw Object.assign(new Error('from_date must be ≤ to_date'), { status: 422 });
  }

  const diff = (Date.parse(`${toDate}T12:00:00Z`) - Date.parse(`${fromDate}T12:00:00Z`)) / 86400000;
  if (diff > 90) {
    throw Object.assign(new Error('Date range must not exceed 90 days'), { status: 422 });
  }

  return { fromDate, toDate };
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
    if (dto.day_of_week !== undefined && !DAYS.includes(Number(dto.day_of_week))) {
      throw Object.assign(new Error('day_of_week must be an integer 0-6'), { status: 422 });
    }
    if (dto.start_time !== undefined && !isValidTime(dto.start_time)) {
      throw Object.assign(new Error('start_time must be HH:MM or HH:MM:SS'), { status: 422 });
    }
    if (dto.end_time !== undefined && !isValidTime(dto.end_time)) {
      throw Object.assign(new Error('end_time must be HH:MM or HH:MM:SS'), { status: 422 });
    }
    if (dto.slot_duration_minutes !== undefined &&
        ![15, 30, 45, 60].includes(Number(dto.slot_duration_minutes))) {
      throw Object.assign(new Error('slot_duration_minutes must be 15, 30, 45, or 60'), { status: 422 });
    }
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
    const ok = await doctorRepository.deleteAvailability(availabilityId, doctorId);
    if (!ok) {
      throw Object.assign(
        new Error('Availability window not found or does not belong to this doctor'),
        { status: 404 }
      );
    }
  },

  // ── Slots ───────────────────────────────────────────────────────────────────

  async getSlots(doctorId: string, rawFrom: unknown, rawTo: unknown, includeNonAvailable = false) {
    const { fromDate, toDate } = validateDateRange(rawFrom, rawTo);
    return doctorRepository.generateSlots(doctorId, fromDate, toDate, includeNonAvailable);
  },

  async generateSlots(doctorId: string, rawFrom: unknown, rawTo: unknown) {
    const { fromDate, toDate } = validateDateRange(rawFrom, rawTo);
    return doctorRepository.generateSlots(doctorId, fromDate, toDate, true);
  },

  async getScheduleOverrides(doctorId: string, rawFrom: unknown, rawTo: unknown) {
    const { fromDate, toDate } = validateDateRange(rawFrom, rawTo);
    return doctorRepository.getScheduleOverrides(doctorId, fromDate, toDate);
  },

  async saveScheduleOverride(doctorId: string, body: unknown) {
    const value = body as Record<string, unknown>;
    const date = validateDate(value.date);
    const isBlocked = value.is_blocked === true;
    const windows = isBlocked ? [] : validateScheduleWindows(value.windows);
    if (!isBlocked && windows.length === 0) {
      throw Object.assign(new Error('Add at least one custom time window or block the date.'), { status: 422 });
    }
    await doctorRepository.saveScheduleOverride(doctorId, date, isBlocked, windows);
  },

  async deleteScheduleOverride(doctorId: string, rawDate: unknown) {
    const date = validateDate(rawDate);
    const deleted = await doctorRepository.deleteScheduleOverride(doctorId, date);
    if (!deleted) {
      throw Object.assign(new Error('No date-specific override exists for this date.'), { status: 404 });
    }
  },

  async updateSlot(
    doctorId: string,
    slotId: string,
    body: unknown
  ) {
    const value = body as Record<string, unknown>;
    const action = value.action;
    if (action !== 'edit' && action !== 'block' && action !== 'restore') {
      throw Object.assign(new Error('action must be edit, block, or restore'), { status: 422 });
    }
    const startTime = value.start_time;
    const endTime = value.end_time;
    if (action === 'edit' &&
        (!isValidTime(startTime) || !isValidTime(endTime) ||
         timeToSeconds(endTime) <= timeToSeconds(startTime))) {
      throw Object.assign(new Error('A valid start_time and end_time are required'), { status: 422 });
    }
    const updated = await doctorRepository.updateSlot(
      doctorId,
      slotId,
      action,
      typeof startTime === 'string' ? startTime : undefined,
      typeof endTime === 'string' ? endTime : undefined
    );
    if (!updated) {
      throw Object.assign(new Error('Slot not found for this doctor'), { status: 404 });
    }
    return updated;
  },
};
