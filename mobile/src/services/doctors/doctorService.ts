/**
 * DoctorDirect – Doctor API Service (Milestone 5)
 *
 * Thin wrapper around apiClient. Returns raw API shapes;
 * normalization is done in selectors or at the call site.
 */
import apiClient from '../api/apiClient';
import type {
  SpecializationsResponse,
  DoctorListResponse,
  DoctorProfileResponse,
  AvailabilityResponse,
  SlotsResponse,
  ScheduleOverride,
} from '../../types/doctor';

// ── Public endpoints ──────────────────────────────────────────────────────────

export async function fetchSpecializations(): Promise<SpecializationsResponse> {
  const res = await apiClient.get<SpecializationsResponse>('/doctor/specializations');
  return res.data;
}

export async function fetchDoctors(params?: {
  search?: string;
  specialization_id?: string;
  limit?: number;
  offset?: number;
}): Promise<DoctorListResponse> {
  const res = await apiClient.get<DoctorListResponse>('/doctor/list', { params });
  return res.data;
}

export async function fetchDoctorProfile(doctorId: string): Promise<DoctorProfileResponse> {
  const res = await apiClient.get<DoctorProfileResponse>(`/doctor/${doctorId}/profile`);
  return res.data;
}

export async function fetchDoctorSlots(
  doctorId: string,
  fromDate: string,
  toDate: string
): Promise<SlotsResponse> {
  const res = await apiClient.get<SlotsResponse>(`/doctor/${doctorId}/slots`, {
    params: { from_date: fromDate, to_date: toDate },
  });
  return res.data;
}

export async function generateDoctorSlots(
  doctorId: string,
  fromDate: string,
  toDate: string
): Promise<SlotsResponse> {
  const res = await apiClient.post<SlotsResponse>(`/doctor/${doctorId}/slots/generate`, {
    from_date: fromDate,
    to_date: toDate,
  });
  return res.data;
}

// ── Doctor-only endpoints ─────────────────────────────────────────────────────

export async function fetchMyAvailability(): Promise<AvailabilityResponse> {
  const res = await apiClient.get<AvailabilityResponse>('/doctor/me/availability');
  return res.data;
}

export async function addAvailabilityWindow(dto: {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active?: boolean;
}): Promise<AvailabilityResponse> {
  const res = await apiClient.post<AvailabilityResponse>('/doctor/me/availability', dto);
  return res.data;
}

export async function updateAvailabilityWindow(
  availabilityId: string,
  dto: Partial<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
    is_active: boolean;
  }>
): Promise<AvailabilityResponse> {
  const res = await apiClient.patch<AvailabilityResponse>(
    `/doctor/me/availability/${availabilityId}`,
    dto
  );
  return res.data;
}

export async function removeAvailabilityWindow(availabilityId: string): Promise<void> {
  await apiClient.delete(`/doctor/me/availability/${availabilityId}`);
}

export async function fetchMySlots(fromDate: string, toDate: string): Promise<SlotsResponse> {
  const res = await apiClient.get<SlotsResponse>('/doctor/me/slots', {
    params: { from_date: fromDate, to_date: toDate },
  });
  return res.data;
}

export async function generateMySlots(fromDate: string, toDate: string): Promise<SlotsResponse> {
  const res = await apiClient.post<SlotsResponse>('/doctor/me/slots/generate', {
    from_date: fromDate,
    to_date: toDate,
  });
  return res.data;
}

export async function fetchMyScheduleOverrides(
  fromDate: string,
  toDate: string
): Promise<ScheduleOverride[]> {
  const res = await apiClient.get<{ overrides: ScheduleOverride[] }>('/doctor/me/schedule-overrides', {
    params: { from_date: fromDate, to_date: toDate },
  });
  return res.data.overrides;
}

export async function saveMyScheduleOverride(payload: {
  date: string;
  is_blocked: boolean;
  windows: Array<{ start_time: string; end_time: string; slot_duration_minutes: number }>;
  expected_booked_count?: number;
}): Promise<void> {
  await apiClient.put('/doctor/me/schedule-overrides', payload);
}

export async function deleteMyScheduleOverride(date: string): Promise<void> {
  await apiClient.delete(`/doctor/me/schedule-overrides/${date}`);
}

export async function updateMySlot(payload: {
  slotId: string;
  action: 'edit' | 'block' | 'restore';
  start_time?: string;
  end_time?: string;
  expected_booked_count?: number;
}): Promise<SlotsResponse['slots'][0]> {
  const { slotId, ...body } = payload;
  const res = await apiClient.patch<{ slot: SlotsResponse['slots'][0] }>(
    `/doctor/me/slots/${slotId}`,
    body
  );
  return res.data.slot;
}
