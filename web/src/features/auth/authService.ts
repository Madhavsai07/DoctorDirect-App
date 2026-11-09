import type { Session } from '@supabase/supabase-js'
import { api } from '@/api/services'
import { apiClient } from '@/api/client'
import { getSupabaseClient } from '@/auth/supabaseClient'
import type { AuthUser, UserRole } from '@/types/auth'

interface PendingProfile {
  role: 'patient' | 'doctor'
  fields: Record<string, unknown>
}

const pendingProfileKey = (userId: string) => `doctordirect-pending-profile:${userId}`
let pendingDoctorFile: File | undefined
const sessionActivations = new Map<string, Promise<AuthUser>>()

function mapUser(raw: Record<string, unknown>, profile: Record<string, unknown> | null): AuthUser {
  const role = raw.role
  if (role !== 'patient' && role !== 'doctor' && role !== 'admin') {
    throw new Error('Your account role is not recognized.')
  }
  return {
    id: String(raw.id),
    email: String(raw.email),
    role: role as UserRole,
    firstName: String(raw.first_name ?? raw.firstName ?? ''),
    lastName: String(raw.last_name ?? raw.lastName ?? ''),
    verificationStatus:
      profile?.verification_status === 'pending' ||
      profile?.verification_status === 'approved' ||
      profile?.verification_status === 'rejected'
        ? profile.verification_status
        : undefined,
  }
}

async function submitPendingProfile(userId: string, confirmationFile?: File) {
  const stored = sessionStorage.getItem(pendingProfileKey(userId))
  if (!stored) return
  const pending = JSON.parse(stored) as PendingProfile
  let fields = pending.fields
  if (pending.role === 'doctor') {
    const file = confirmationFile ?? pendingDoctorFile
    if (!file) throw new Error('Upload a JPG or PNG ID card to finish your doctor registration.')
    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      throw new Error('The ID card image must be non-empty and 10 MB or smaller.')
    }
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      throw new Error('Choose a JPG or PNG image for your ID card.')
    }
    const extension = file.type === 'image/png' ? 'png' : 'jpg'
    const path = `${userId}/${crypto.randomUUID()}.${extension}`
    const { data, error } = await getSupabaseClient()
      .storage.from('doctor-id-cards')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (error) throw error
    fields = { ...fields, idCardUrl: data.path }
  }
  if (pending.role === 'doctor') await api.registerDoctor(fields)
  else await api.registerPatient(fields)
  sessionStorage.removeItem(pendingProfileKey(userId))
}

export async function activateSession(session: Session, confirmationFile?: File): Promise<AuthUser> {
  const existing = sessionActivations.get(session.user.id)
  if (existing) return existing
  const activation = (async () => {
    await submitPendingProfile(session.user.id, confirmationFile)
    const { user, profile } = await api.currentUser()
    return mapUser(user, profile)
  })()
  sessionActivations.set(session.user.id, activation)
  try {
    return await activation
  } finally {
    sessionActivations.delete(session.user.id)
    pendingDoctorFile = undefined
  }
}

export async function signIn(email: string, password: string, confirmationFile?: File): Promise<AuthUser> {
  pendingDoctorFile = confirmationFile
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) throw error
  if (!data.session) throw new Error('Sign-in did not create an authenticated session.')
  return activateSession(data.session, confirmationFile)
}

export async function signUp(
  role: 'patient' | 'doctor',
  fields: Record<string, unknown>,
  credentials: { email: string; password: string },
  file?: File,
): Promise<{ user: AuthUser | null; confirmationRequired: boolean }> {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.signUp({
    email: credentials.email.trim(),
    password: credentials.password,
  })
  if (error) throw error
  if (!data.user) throw new Error('Registration did not create an account.')

  const pending: PendingProfile = { role, fields }
  sessionStorage.setItem(pendingProfileKey(data.user.id), JSON.stringify(pending))
  if (!data.session) {
    pendingDoctorFile = undefined
    return { user: null, confirmationRequired: true }
  }
  pendingDoctorFile = file
  return { user: await activateSession(data.session, file), confirmationRequired: false }
}

export async function restoreUser(): Promise<AuthUser | null> {
  const { data, error } = await getSupabaseClient().auth.getSession()
  if (error) throw error
  if (!data.session) return null
  return activateSession(data.session)
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut({ scope: 'local' })
  if (error) throw error
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/forgot-password`,
  })
  if (error) throw error
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await getSupabaseClient().auth.updateUser({ password })
  if (error) throw error
}

export async function refreshBackendUser(): Promise<AuthUser> {
  const { user, profile } = await api.currentUser()
  return mapUser(user, profile)
}

export async function sendTestRequest() {
  return apiClient.get('/auth/me')
}
