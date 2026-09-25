import { AuthUser, IAuthService, UserRole } from '../../types/auth';

declare const __DEV__: boolean | undefined;

/**
 * Pre-configured development users matching Milestone 2 PostgreSQL seed data.
 */
export const DEV_USERS: Record<'patient' | 'doctor', AuthUser> = {
  patient: {
    id: '22222222-2222-2222-2222-222222222202',
    email: 'dev.patient@doctordirect.local',
    role: 'patient',
    firstName: 'Rahul',
    lastName: 'Verma',
    phone: '+919876543211',
    profileId: '44444444-4444-4444-4444-444444444401',
  },
  doctor: {
    id: '22222222-2222-2222-2222-222222222201',
    email: 'dev.doctor@doctordirect.local',
    role: 'doctor',
    firstName: 'Dr. Aditi',
    lastName: 'Sharma',
    phone: '+919876543210',
    profileId: '33333333-3333-3333-3333-333333333301',
    specialization: 'Cardiology',
  },
};

/**
 * Safety check: strictly rejects development bypass in production builds.
 */
export function isDevBypassAllowed(): boolean {
  // In React Native / Expo, __DEV__ is globally available and false in production bundles.
  const isEnvDev = process.env.NODE_ENV !== 'production';
  const isGlobalDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
  return isEnvDev && isGlobalDev;
}

export class DevAuthService implements IAuthService {
  private currentUser: AuthUser | null = null;

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.currentUser;
  }

  async devLogin(role: 'patient' | 'doctor'): Promise<AuthUser> {
    if (!isDevBypassAllowed()) {
      throw new Error(
        '[SECURITY VIOLATION] Development authentication bypass is strictly disabled in production builds.'
      );
    }

    const user = DEV_USERS[role];
    if (!user) {
      throw new Error(`Unknown development role: ${role}`);
    }

    this.currentUser = user;
    return user;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
  }
}

export const devAuthService = new DevAuthService();
