import { IAuthService } from '../../types/auth';
import { devAuthService } from './devAuthService';

/**
 * Centralized Authentication Service.
 *
 * Current provider: DevAuthService (Development Bypass Mode).
 * In future milestones, replace devAuthService here with SupabaseAuthService,
 * FirebaseAuthService, or GoogleOAuthService without altering UI or store code.
 */
export const authService: IAuthService = devAuthService;

export * from './devAuthService';
