import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { adminService } from '../services/admin.service';

const adminRouter = Router();

// All admin routes require authentication + admin role
adminRouter.use(requireAuth, requireRole('admin'));

/**
 * GET /api/v1/admin/doctors
 * List doctors by verification status.
 * Query: status (pending | approved | rejected), search, limit, offset
 */
adminRouter.get(
  '/doctors',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as 'pending' | 'approved' | 'rejected' | undefined;
      const doctors = await adminService.listDoctorsByVerification({
        status,
        search: req.query.search as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      });
      res.json({ doctors, count: doctors.length });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/doctors/:doctorId
 * Get full doctor details (any verification status).
 */
adminRouter.get(
  '/doctors/:doctorId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctor = await adminService.getDoctorDetail(req.params.doctorId);
      res.json({ doctor });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/admin/doctors/:doctorId/approve
 * Approve a doctor (pending → approved).
 */
adminRouter.patch(
  '/doctors/:doctorId/approve',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctor = await adminService.approveDoctor(req.params.doctorId, req.user!.id);
      res.json({ message: 'Doctor approved successfully.', doctor });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/admin/doctors/:doctorId/reject
 * Reject a doctor (pending → rejected).
 */
adminRouter.patch(
  '/doctors/:doctorId/reject',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctor = await adminService.rejectDoctor(req.params.doctorId, req.user!.id);
      res.json({ message: 'Doctor rejected.', doctor });
    } catch (err) {
      next(err);
    }
  }
);

export default adminRouter;
