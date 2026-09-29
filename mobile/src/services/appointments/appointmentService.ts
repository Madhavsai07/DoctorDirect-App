import apiClient from '../api/apiClient';
import type {
  AppointmentListResponse,
  AppointmentDetailResponse,
  AppointmentStatus,
} from '../../types/appointment';

export async function bookSlotApi(payload: {
  slot_id: string;
  reason_for_visit?: string;
}): Promise<AppointmentDetailResponse> {
  const res = await apiClient.post<AppointmentDetailResponse>('/appointments/book', payload);
  return res.data;
}

export async function fetchPatientAppointmentsApi(
  status?: 'upcoming' | 'past' | 'all'
): Promise<AppointmentListResponse> {
  const res = await apiClient.get<AppointmentListResponse>('/appointments/patient', {
    params: { status },
  });
  return res.data;
}

export async function fetchDoctorAppointmentsApi(
  status?: 'upcoming' | 'past' | 'today' | 'all'
): Promise<AppointmentListResponse> {
  const res = await apiClient.get<AppointmentListResponse>('/appointments/doctor', {
    params: { status },
  });
  return res.data;
}

export async function fetchAppointmentDetailApi(
  appointmentId: string
): Promise<AppointmentDetailResponse> {
  const res = await apiClient.get<AppointmentDetailResponse>(`/appointments/${appointmentId}`);
  return res.data;
}

export async function confirmAppointmentApi(
  appointmentId: string
): Promise<AppointmentDetailResponse> {
  const res = await apiClient.patch<AppointmentDetailResponse>(
    `/appointments/${appointmentId}/confirm`
  );
  return res.data;
}

export async function updateAppointmentStatusApi(
  appointmentId: string,
  status: AppointmentStatus,
  cancellation_reason?: string
): Promise<AppointmentDetailResponse> {
  const res = await apiClient.patch<AppointmentDetailResponse>(
    `/appointments/${appointmentId}/status`,
    { status, cancellation_reason }
  );
  return res.data;
}

export async function cancelAppointmentApi(
  appointmentId: string,
  cancellation_reason?: string
): Promise<AppointmentDetailResponse> {
  const res = await apiClient.patch<AppointmentDetailResponse>(
    `/appointments/${appointmentId}/cancel`,
    { cancellation_reason }
  );
  return res.data;
}

export async function rescheduleAppointmentApi(
  appointmentId: string,
  new_slot_id: string
): Promise<AppointmentDetailResponse> {
  const res = await apiClient.patch<AppointmentDetailResponse>(
    `/appointments/${appointmentId}/reschedule`,
    { new_slot_id }
  );
  return res.data;
}
