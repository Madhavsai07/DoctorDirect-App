/**
 * DoctorDirect – Prescription API Service (Milestone 8)
 */
import apiClient from '../api/apiClient';
import type {
  CreatePrescriptionPayload,
  PrescriptionResponse,
  PrescriptionsListResponse,
  UpdatePrescriptionPayload,
} from '../../types/prescription';

export async function createPrescriptionApi(
  payload: CreatePrescriptionPayload
): Promise<PrescriptionResponse> {
  const res = await apiClient.post<PrescriptionResponse>('/prescriptions', payload);
  return res.data;
}

export async function fetchPrescriptionByConsultationApi(
  consultationId: string
): Promise<PrescriptionResponse> {
  const res = await apiClient.get<PrescriptionResponse>(
    `/prescriptions/consultation/${consultationId}`
  );
  return res.data;
}

export async function fetchPrescriptionByIdApi(
  id: string
): Promise<PrescriptionResponse> {
  const res = await apiClient.get<PrescriptionResponse>(`/prescriptions/${id}`);
  return res.data;
}

export async function updatePrescriptionDraftApi(
  id: string,
  payload: UpdatePrescriptionPayload
): Promise<PrescriptionResponse> {
  const res = await apiClient.patch<PrescriptionResponse>(
    `/prescriptions/${id}`,
    payload
  );
  return res.data;
}

export async function finalizePrescriptionApi(
  id: string
): Promise<PrescriptionResponse> {
  const res = await apiClient.patch<PrescriptionResponse>(
    `/prescriptions/${id}/finalize`,
    {}
  );
  return res.data;
}

export async function fetchPatientPrescriptionHistoryApi(): Promise<PrescriptionsListResponse> {
  const res = await apiClient.get<PrescriptionsListResponse>(
    '/prescriptions/patient/history'
  );
  return res.data;
}
