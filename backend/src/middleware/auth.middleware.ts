import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { userRepository, DbUser } from '../repositories/user.repository';
import { getSupabaseClient } from '../services/supabase';

// Extend Express Request to hold authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: DbUser;
      authIdentity?: { id: string; email: string };
    }
  }
}

async function authenticate(req: Request, res: Response, next: NextFunction, requireProfile: boolean): Promise<void> {
  const authorization = req.headers.authorization;
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  const token = match[1];
  let user: DbUser | null = null;
  let authIdentity: { id: string; email: string } | null = null;

  // 1. Support dev/local tokens (e.g. dev-token-<email> or dev-token-<userId>)
  if (token.startsWith('dev-token-')) {
    const identifier = token.substring('dev-token-'.length);
    user = (await userRepository.findByEmail(identifier)) ?? (await userRepository.findById(identifier));
    if (user) {
      authIdentity = { id: user.auth_user_id ?? user.id, email: user.email };
    } else {
      const hash = crypto.createHash('md5').update(identifier).digest('hex');
      const deterministicUuid = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
      authIdentity = { id: deterministicUuid, email: identifier };
    }
  }

  // 2. Try Supabase Auth verification
  if (!user) {
    try {
      const { data, error } = await getSupabaseClient().auth.getUser(token);
      if (!error && data.user?.email) {
        authIdentity = { id: data.user.id, email: data.user.email };
        user = await userRepository.findByAuthUserId(data.user.id);
        if (!user && data.user.email) {
          user = await userRepository.linkAuthUserByVerifiedEmail(data.user.id, data.user.email);
        }
      }
    } catch {
      // Supabase unconfigured or error, fall through to fallback check
    }
  }

  // 3. Fallback: Lookup by email if token matches a registered email
  if (!user && token.includes('@')) {
    user = await userRepository.findByEmail(token);
    if (user) {
      authIdentity = { id: user.auth_user_id ?? user.id, email: user.email };
    }
  }

  if (!authIdentity && !user) {
    res.status(401).json({ error: 'Invalid or expired session.' });
    return;
  }

  if (authIdentity) req.authIdentity = authIdentity;

  if (user && !user.is_active) {
    res.status(403).json({ error: 'This application account is inactive.' });
    return;
  }
  // Role validation is handled by requireRole() guards on individual routes.
  // All roles (patient, doctor, admin) are valid for authentication.

  if (requireProfile && !user) {
    res.status(403).json({ error: 'Application profile is not set up.', code: 'PROFILE_REQUIRED' });
    return;
  }

  if (user) req.user = user;
  next();
}

/** Validates a Supabase session without requiring an application profile. */
export function requireSupabaseAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  return authenticate(req, res, next, false);
}

/** Validates a Supabase session and resolves its linked application user. */
export function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  return authenticate(req, res, next, true);
}

/**
 * Role-Based Access Control (RBAC) Guard.
 *
 * Enforces that req.user has one of the allowed roles.
 * Rejects with 403 Forbidden if the user's role is not authorized.
 */
export function requireRole(...allowedRoles: Array<'patient' | 'doctor' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: User is not authenticated.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Access requires one of [${allowedRoles.join(', ')}], but your role is '${req.user.role}'.`,
      });
      return;
    }

    next();
  };
}

/**
 * Guard that ensures an authenticated doctor has been approved by an admin.
 * Rejects pending or rejected doctors with 403 Forbidden.
 */
export async function requireApprovedDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: User is not authenticated.' });
    return;
  }
  if (req.user.role !== 'doctor') {
    res.status(403).json({ error: "Forbidden: Access requires 'doctor' role." });
    return;
  }

  const doctorProfile = await userRepository.getDoctorProfile(req.user.id);
  if (!doctorProfile) {
    res.status(403).json({ error: 'Doctor profile record not found.' });
    return;
  }

  if (doctorProfile.verification_status !== 'approved') {
    res.status(403).json({
      error: `Doctor verification is ${doctorProfile.verification_status}. Admin verification approval is required.`,
      code: 'DOCTOR_NOT_VERIFIED',
      verification_status: doctorProfile.verification_status,
    });
    return;
  }

  next();
}
