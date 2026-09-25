import { Request, Response, NextFunction } from 'express';
import config from '../config/env';
import { userRepository, DbUser } from '../repositories/user.repository';

// Extend Express Request to hold authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: DbUser;
    }
  }
}

/**
 * Authentication Middleware.
 *
 * Supports development bypass mode when NODE_ENV !== 'production'.
 * In production builds, development bypass headers are strictly ignored and rejected.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const isDevBypass = req.headers['x-dev-bypass'] === 'true';

  // 1. Strict Production Guard
  if (config.nodeEnv === 'production' && isDevBypass) {
    res.status(401).json({
      error: 'Unauthorized: Development authentication bypass is strictly disabled in production builds.',
    });
    return;
  }

  // 2. Development Bypass Mode (Non-production environments only)
  if (isDevBypass && config.nodeEnv !== 'production') {
    const devUserId = req.headers['x-dev-user-id'] as string;
    const devRole = req.headers['x-dev-role'] as 'patient' | 'doctor' | 'admin';

    if (!devUserId && !devRole) {
      res.status(401).json({ error: 'Unauthorized: Missing development authentication headers.' });
      return;
    }

    // Attempt database lookup if userId is provided
    if (devUserId) {
      const dbUser = await userRepository.findById(devUserId);
      if (dbUser) {
        req.user = dbUser;
        next();
        return;
      }
    }

    // Fallback development user object
    req.user = {
      id: devUserId || (devRole === 'doctor' ? '22222222-2222-2222-2222-222222222201' : '22222222-2222-2222-2222-222222222202'),
      email: devRole === 'doctor' ? 'dev.doctor@doctordirect.local' : 'dev.patient@doctordirect.local',
      role: devRole || 'patient',
      first_name: devRole === 'doctor' ? 'Aditi' : 'Rahul',
      last_name: devRole === 'doctor' ? 'Sharma' : 'Verma',
      phone: null,
      avatar_url: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
    next();
    return;
  }

  // 3. Real Auth Placeholder (Supabase, Firebase, or JWT in future milestones)
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Unauthorized: Missing authentication credentials.' });
    return;
  }

  // Future real provider verification logic plugs in here
  res.status(401).json({ error: 'Unauthorized: Invalid authentication credentials.' });
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
