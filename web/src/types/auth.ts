export type UserRole = 'patient' | 'doctor' | 'admin'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  verificationStatus?: 'pending' | 'approved' | 'rejected'
}

export type AuthStatus = 'uninitialized' | 'authenticated' | 'unauthenticated'
