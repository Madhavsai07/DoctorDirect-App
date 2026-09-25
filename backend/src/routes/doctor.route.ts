import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { userRepository } from '../repositories/user.repository';

const doctorRouter = Router();

/**
 * GET /api/v1/doctor/me
 *
 * Protected route for authenticated doctors only.
 * Enforces role === 'doctor'.
 */
doctorRouter.get(
  '/me',
  requireAuth,
  requireRole('doctor'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const profile = await userRepository.getDoctorProfile(user.id);

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

export default doctorRouter;
