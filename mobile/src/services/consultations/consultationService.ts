import apiClient from '../api/apiClient';
import type {
  ConsultationResponse,
  UpdateConsultationPayload,
} from '../../types/consultation';

export async function startOrGetConsultationApi(
  appointmentId: string
): Promise<ConsultationResponse> {
  const res = await apiClient.post<ConsultationResponse>('/consultations', {
    appointment_id: appointmentId,
  });
  return res.data;
}

export async function fetchConsultationByAppointmentApi(
  appointmentId: string
): Promise<ConsultationResponse> {
  const res = await apiClient.get<ConsultationResponse>(
    `/consultations/${appointmentId}`
  );
  return res.data;
}

export async function updateConsultationDraftApi(
  consultationId: string,
  payload: UpdateConsultationPayload
): Promise<ConsultationResponse> {
  const res = await apiClient.patch<ConsultationResponse>(
    `/consultations/${consultationId}`,
    payload
  );
  return res.data;
}

export async function completeConsultationApi(
  consultationId: string,
  payload?: UpdateConsultationPayload
): Promise<ConsultationResponse> {
  const res = await apiClient.patch<ConsultationResponse>(
    `/consultations/${consultationId}/complete`,
    payload ?? {}
  );
  return res.data;
}
