import apiClient from '../api/apiClient';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface AdminDoctor {
  doctor_id: string;
  user_id: string;
  email?: string;
  phone?: string | null;
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
  verification_status: VerificationStatus;
  verified_at: string | null;
  verified_by: string | null;
}

export interface ListDoctorsParams {
  status?: VerificationStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListDoctorsResponse {
  doctors: AdminDoctor[];
  count: number;
}

export interface DoctorDetailResponse {
  doctor: AdminDoctor;
}

export interface DoctorActionResponse {
  message: string;
  doctor: AdminDoctor;
}

export interface StatusCounts {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export const adminService = {
  /**
   * List doctors filtered by verification status and/or search term.
   */
  async listDoctors(params?: ListDoctorsParams): Promise<ListDoctorsResponse> {
    const res = await apiClient.get<ListDoctorsResponse>('/admin/doctors', {
      params: {
        status: params?.status,
        search: params?.search,
        limit: params?.limit ?? 100,
        offset: params?.offset ?? 0,
      },
    });
    return res.data;
  },

  /**
   * Get single doctor's complete details.
   */
  async getDoctorDetail(doctorId: string): Promise<AdminDoctor> {
    const res = await apiClient.get<DoctorDetailResponse>(`/admin/doctors/${doctorId}`);
    return res.data.doctor;
  },

  /**
   * Approve a doctor.
   */
  async approveDoctor(doctorId: string): Promise<DoctorActionResponse> {
    const res = await apiClient.patch<DoctorActionResponse>(`/admin/doctors/${doctorId}/approve`);
    return res.data;
  },

  /**
   * Reject a doctor.
   */
  async rejectDoctor(doctorId: string): Promise<DoctorActionResponse> {
    const res = await apiClient.patch<DoctorActionResponse>(`/admin/doctors/${doctorId}/reject`);
    return res.data;
  },

  /**
   * Fetch aggregate counts for pending, approved, and rejected doctors.
   */
  async getStatusCounts(): Promise<StatusCounts> {
    const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
      apiClient.get<ListDoctorsResponse>('/admin/doctors', { params: { status: 'pending', limit: 1 } }),
      apiClient.get<ListDoctorsResponse>('/admin/doctors', { params: { status: 'approved', limit: 1 } }),
      apiClient.get<ListDoctorsResponse>('/admin/doctors', { params: { status: 'rejected', limit: 1 } }),
    ]);

    const pending = pendingRes.data.count;
    const approved = approvedRes.data.count;
    const rejected = rejectedRes.data.count;

    return {
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
    };
  },
};
