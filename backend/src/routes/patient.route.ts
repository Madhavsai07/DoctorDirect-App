import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { userRepository } from '../repositories/user.repository';

const patientRouter = Router();

/**
 * GET /api/v1/patient/me
 *
 * Protected route for authenticated patients only.
 * Enforces role === 'patient'.
 */
patientRouter.get(
  '/me',
  requireAuth,
  requireRole('patient'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const profile = await userRepository.getPatientProfile(user.id);

      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
        },
        profile,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default patientRouter;
