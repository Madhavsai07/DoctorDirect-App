import { DbUser } from '../repositories/user.repository';
import { consultationRepository, DbConsultationDetail } from '../repositories/consultation.repository';
import { getSupabaseClient } from './supabase';
import { resolveApplicationUser } from './application-user.service';
import { appointmentRepository } from '../repositories/appointment.repository';

export async function authenticateSignalingToken(token: string): Promise<DbUser> {
  const { data, error } = await getSupabaseClient().auth.getUser(token);
  if (error || !data.user?.email) throw Object.assign(new Error('Invalid or expired session.'), { status: 401 });
  const user = await resolveApplicationUser({
    id: data.user.id,
    email: data.user.email,
    email_confirmed_at: data.user.email_confirmed_at,
  });
  if (!user) throw Object.assign(new Error('Application profile is not set up.'), { status: 403 });
  if (!user.is_active) throw Object.assign(new Error('This application account is inactive.'), { status: 403 });
  return user;
}

export async function authorizeSignalingJoin(user: DbUser, consultationId: string): Promise<{ consultation: DbConsultationDetail; role: 'patient' | 'doctor' }> {
  await appointmentRepository.expireOverdueAppointments();
  const consultation = await consultationRepository.findConsultationById(consultationId);
  if (!consultation) throw Object.assign(new Error('Consultation not found.'), { status: 404 });
  if (consultation.status !== 'in_progress' || consultation.appointment_status !== 'in_progress') {
    throw Object.assign(new Error('This consultation is not available for a video call.'), { status: 409 });
  }
  if (user.role === 'patient' && consultation.patient_user_id === user.id) return { consultation, role: 'patient' };
  if (user.role === 'doctor' && consultation.doctor_user_id === user.id) return { consultation, role: 'doctor' };
  throw Object.assign(new Error('You are not a participant in this consultation.'), { status: 403 });
}
