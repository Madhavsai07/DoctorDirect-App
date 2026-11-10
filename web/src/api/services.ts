import { apiClient } from '@/api/client'

export interface Doctor {
  doctor_id: string
  first_name: string
  last_name: string
  specialization_id: string
  specialization_name: string
  experience_years: number
  consultation_fee: number | string
  rating: number | string
  qualification: string | null
  bio: string | null
}

export interface Slot {
  id: string
  date: string
  start_time: string
  end_time: string
  status: string
}

export interface ScheduleSlot extends Slot {
  doctor_id: string
  is_manual_override: boolean
}

export interface AvailabilityWindow {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
  is_active: boolean
}

export interface ScheduleOverride {
  id: string
  doctor_id: string
  override_date: string
  is_blocked: boolean
  windows: Array<{
    id: string
    start_time: string
    end_time: string
    slot_duration_minutes: number
  }>
}

export interface Appointment {
  id: string
  doctor_id: string
  slot_id: string
  status: string
  slot_date: string
  slot_start_time: string
  slot_end_time: string
  doctor_first_name: string
  doctor_last_name: string
  patient_first_name: string
  patient_last_name: string
  patient_email: string
  patient_phone: string | null
  patient_gender: string | null
  patient_date_of_birth: string | null
  patient_blood_group: string | null
  patient_medical_history: string | null
  patient_allergies: string | null
  reason_for_visit: string | null
}

export interface AdminDoctor extends Doctor {
  user_id: string
  email?: string
  license_number: string
  verification_status: 'pending' | 'approved' | 'rejected'
  id_card_url: string | null
  qualification: string | null
  bio: string | null
}

export const api = {
  async currentUser() {
    const { data } = await apiClient.get<{
      user: Record<string, unknown>
      profile: Record<string, unknown> | null
    }>('/auth/me')
    return data
  },
  async registerPatient(body: Record<string, unknown>) {
    return apiClient.post('/auth/register/patient', body)
  },
  async registerDoctor(body: Record<string, unknown>) {
    return apiClient.post('/auth/register/doctor', body)
  },
  async specializations() {
    const { data } = await apiClient.get<{ specializations: Array<{ id: string; name: string }> }>(
      '/doctor/specializations',
    )
    return data.specializations
  },
  async doctors(params: { search?: string; specialization_id?: string }) {
    const { data } = await apiClient.get<{ doctors: Doctor[] }>('/doctor/list', { params })
    return data.doctors
  },
  async doctorSlots(doctorId: string, fromDate: string, toDate: string) {
    const { data } = await apiClient.get<{ slots: Slot[] }>(`/doctor/${doctorId}/slots`, {
      params: { from_date: fromDate, to_date: toDate },
    })
    return data.slots
  },
  async generateMySlots(fromDate: string, toDate: string) {
    const { data } = await apiClient.post<{ slots: ScheduleSlot[] }>('/doctor/me/slots/generate', {
      from_date: fromDate,
      to_date: toDate,
    })
    return data.slots
  },
  async scheduleOverrides(fromDate: string, toDate: string) {
    const { data } = await apiClient.get<{ overrides: ScheduleOverride[] }>('/doctor/me/schedule-overrides', {
      params: { from_date: fromDate, to_date: toDate },
    })
    return data.overrides
  },
  async saveScheduleOverride(body: {
    date: string
    is_blocked: boolean
    windows: Array<{ start_time: string; end_time: string; slot_duration_minutes: number }>
    expected_booked_count?: number
  }) {
    return apiClient.put('/doctor/me/schedule-overrides', body)
  },
  async removeScheduleOverride(date: string) {
    return apiClient.delete(`/doctor/me/schedule-overrides/${date}`)
  },
  async updateScheduleSlot(id: string, body: {
    action: 'edit' | 'block' | 'restore'
    start_time?: string
    end_time?: string
    expected_booked_count?: number
  }) {
    const { data } = await apiClient.patch<{ slot: ScheduleSlot }>(`/doctor/me/slots/${id}`, body)
    return data.slot
  },
  async bookAppointment(slotId: string, reason: string) {
    return apiClient.post('/appointments/book', { slot_id: slotId, reason_for_visit: reason })
  },
  async appointments(kind: 'patient' | 'doctor') {
    const { data } = await apiClient.get<{ appointments: Appointment[] }>(`/appointments/${kind}`)
    return data.appointments
  },
  async cancelAppointment(id: string, reason?: string) {
    return apiClient.patch(`/appointments/${id}/cancel`, {
      cancellation_reason: reason || undefined,
    })
  },
  async rescheduleAppointment(id: string, slotId: string) {
    return apiClient.patch(`/appointments/${id}/reschedule`, { new_slot_id: slotId })
  },
  async confirmAppointment(id: string) {
    return apiClient.patch(`/appointments/${id}/confirm`)
  },
  async setAppointmentStatus(id: string, status: string) {
    return apiClient.patch(`/appointments/${id}/status`, { status })
  },
  async patientPrescriptions() {
    const { data } = await apiClient.get<{ prescriptions: Prescription[] }>(
      '/prescriptions/patient/history',
    )
    return data.prescriptions
  },
  async patientProfile() {
    const { data } = await apiClient.get<{
      user: Record<string, unknown>
      profile: Record<string, unknown> | null
    }>('/patient/me')
    return data
  },
  async doctorProfile() {
    const { data } = await apiClient.get<{
      user: Record<string, unknown>
      profile: Record<string, unknown>
      doctorProfile: Record<string, unknown>
    }>('/doctor/me')
    return data
  },
  async availability() {
    const { data } = await apiClient.get<{ availability: AvailabilityWindow[] }>('/doctor/me/availability')
    return data.availability
  },
  async addAvailability(body: {
    day_of_week: number
    start_time: string
    end_time: string
    slot_duration_minutes: number
  }) {
    return apiClient.post('/doctor/me/availability', body)
  },
  async updateAvailability(id: string, body: Partial<{
    day_of_week: number
    start_time: string
    end_time: string
    slot_duration_minutes: number
    is_active: boolean
  }>) {
    const { data } = await apiClient.patch<{ availability: AvailabilityWindow }>(`/doctor/me/availability/${id}`, body)
    return data.availability
  },
  async removeAvailability(id: string) {
    return apiClient.delete(`/doctor/me/availability/${id}`)
  },
  async consultation(appointmentId: string) {
    const { data } = await apiClient.get<{ consultation: Consultation }>(
      `/consultations/${appointmentId}`,
    )
    return data.consultation
  },
  async startConsultation(appointmentId: string) {
    const { data } = await apiClient.post<{ consultation: Consultation }>('/consultations', {
      appointment_id: appointmentId,
    })
    return data.consultation
  },
  async iceServers(consultationId: string) {
    const { data } = await apiClient.get<{ iceServers: ConsultationIceServer[] }>(
      `/consultations/video/${consultationId}/ice-servers`,
    )
    return data
  },
  async updateConsultation(id: string, body: Record<string, string>) {
    const { data } = await apiClient.patch<{ consultation: Consultation }>(
      `/consultations/${id}`,
      body,
    )
    return data.consultation
  },
  async completeConsultation(id: string, body: Record<string, string>) {
    const { data } = await apiClient.patch<{ consultation: Consultation }>(
      `/consultations/${id}/complete`,
      body,
    )
    return data.consultation
  },
  async createPrescription(body: {
    consultationId: string
    diagnosis: string
    medicines: Medicine[]
    generalAdvice?: string
  }) {
    const { data } = await apiClient.post<{ prescription: Prescription }>('/prescriptions', body)
    return data.prescription
  },
  async prescriptionsForConsultation(consultationId: string) {
    const { data } = await apiClient.get<{ prescription: Prescription | null }>(
      `/prescriptions/consultation/${consultationId}`,
    )
    return data.prescription
  },
  async finalizePrescription(id: string) {
    return apiClient.patch(`/prescriptions/${id}/finalize`, {})
  },
  async adminDoctors(status: 'pending' | 'approved' | 'rejected' | 'all', search: string) {
    const statuses = status === 'all' ? ['pending', 'approved', 'rejected'] : [status]
    const results = await Promise.all(statuses.map(async (verificationStatus) => {
      const { data } = await apiClient.get<{ doctors: AdminDoctor[] }>('/admin/doctors', {
        params: { status: verificationStatus, search: search || undefined, limit: 100 },
      })
      return data.doctors
    }))
    return results.flat()
  },
  async doctorIdCard(id: string) {
    const { data } = await apiClient.get<{ url: string }>(`/admin/doctors/${id}/id-card`)
    return data.url
  },
  async doctorDetails(id: string) {
    const { data } = await apiClient.get<{ doctor: AdminDoctor }>(`/admin/doctors/${id}`)
    return data.doctor
  },
  async doctorDecision(id: string, decision: 'approve' | 'reject') {
    return apiClient.patch(`/admin/doctors/${id}/${decision}`)
  },
  async notifications() {
    const { data } = await apiClient.get<{ notifications: NotificationItem[] }>('/notifications')
    return data.notifications
  },
  async markAllNotificationsRead() {
    return apiClient.patch('/notifications/read-all')
  },
  async markNotificationRead(id: string) {
    return apiClient.patch(`/notifications/${id}/read`)
  },
}

export interface Medicine {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

export interface Prescription {
  id: string
  consultation_id: string
  diagnosis: string
  medicines: Medicine[] | string
  general_advice: string | null
  is_signed: boolean
  signed_at: string | null
  doctor_first_name?: string
  doctor_last_name?: string
  specialization_name?: string
  slot_date?: string
}

export interface Consultation {
  id: string
  appointment_id: string
  status: string
  symptoms: string | null
  diagnosis: string | null
  clinical_notes: string | null
  treatment_plan: string | null
  follow_up_instructions: string | null
  prescription: string | null
}

export interface ConsultationIceServer {
  urls: string | string[]
  username?: string
  credential?: string
}

export interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  created_at: string
  is_read: boolean
}
