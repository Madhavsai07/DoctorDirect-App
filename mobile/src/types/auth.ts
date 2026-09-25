/**
 * DoctorDirect Authentication Types & Abstraction
 *
 * Defines the core user and service contracts.
 * Real authentication providers (Supabase, Firebase, Google OAuth)
 * will implement IAuthService in future milestones without changing app logic.
 */

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  profileId?: string; // Links to patients.id or doctors.id
  specialization?: string; // Present for doctors
}

export interface AuthState {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  devBypassActive: boolean;
}

export interface IAuthService {
  /**
   * Fetch current authenticated session/user.
   */
  getCurrentUser(): Promise<AuthUser | null>;

  /**
   * Development-only login bypass.
   * Throws an error if called in a production build.
   */
  devLogin(role: 'patient' | 'doctor'): Promise<AuthUser>;

  /**
   * Terminate active session and clear cached credentials.
   */
  logout(): Promise<void>;
}
