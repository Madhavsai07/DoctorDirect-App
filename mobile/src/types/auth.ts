/**
 * Supabase identity and DoctorDirect application profile types.
 */

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface AuthIdentity {
  id: string;
  email: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  profileId?: string; // Links to patients.id or doctors.id
  specialization?: string; // Present for doctors
  verificationStatus?: 'pending' | 'approved' | 'rejected'; // Present for doctors
}

export interface AuthState {
  supabaseUser: AuthIdentity | null;
  user: AuthUser | null;
  role: UserRole | null;
  verificationStatus: 'pending' | 'approved' | 'rejected' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

export interface AuthBundle {
  identity: AuthIdentity;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PatientRegistration {
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface DoctorRegistration {
  firstName: string;
  lastName: string;
  phone?: string;
  specializationName: string;
  licenseNumber: string;
  experienceYears: number;
  consultationFee: number;
  qualification: string;
  bio?: string;
}

export type RegistrationPayload =
  | { role: 'patient'; profile: PatientRegistration }
  | { role: 'doctor'; profile: DoctorRegistration };

export interface RegistrationResult {
  bundle: AuthBundle | null;
  confirmationRequired: boolean;
}
