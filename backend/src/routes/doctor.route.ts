import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { userRepository } from '../repositories/user.repository';
import { doctorService } from '../services/doctor.service';

const doctorRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// 1. GENERAL / LISTING ROUTES (accessible to all authenticated users)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/doctor/specializations
 * Returns all specializations.
 */
doctorRouter.get(
  '/specializations',
  requireAuth,
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await doctorService.getSpecializations();
      res.json({ specializations: data });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/doctor/list
 * Returns doctor listing with optional search/filter by specialization.
 * Query params: search, specialization_id, limit, offset
 */
doctorRouter.get(
  '/list',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctors = await doctorService.getDoctors({
        search: req.query.search as string | undefined,
        specialization_id: req.query.specialization_id as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      });
      res.json({ doctors, count: doctors.length });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. DOCTOR-ONLY ROUTES (/me/...) — MUST BE DEFINED BEFORE /:doctorId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/doctor/me
 * Returns the authenticated doctor's own profile.
 */
doctorRouter.get(
  '/me',
  requireAuth,
  requireRole('doctor'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const [baseProfile, doctorProfile] = await Promise.all([
        userRepository.findById(user.id),
        doctorService.getDoctorProfileByUserId(user.id),
      ]);

      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
        },
        profile: baseProfile,
        doctorProfile,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/doctor/me/availability
 * Returns the authenticated doctor's availability windows.
 */
doctorRouter.get(
  '/me/availability',
  requireAuth,
  requireRole('doctor'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorProfile = await doctorService.getDoctorProfileByUserId(req.user!.id);
      const availability = await doctorService.getAvailability(doctorProfile.doctor_id);
      res.json({ availability, doctorId: doctorProfile.doctor_id });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/doctor/me/availability
 * Adds a new availability window for the authenticated doctor.
 * Body: { day_of_week, start_time, end_time, slot_duration_minutes, is_active? }
 */
doctorRouter.post(
  '/me/availability',
  requireAuth,
  requireRole('doctor'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorProfile = await doctorService.getDoctorProfileByUserId(req.user!.id);
      const availability = await doctorService.addAvailability(doctorProfile.doctor_id, req.body);
      res.status(201).json({ availability });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/doctor/me/availability/:availabilityId
 * Updates one of the authenticated doctor's availability windows.
 */
doctorRouter.patch(
  '/me/availability/:availabilityId',
  requireAuth,
  requireRole('doctor'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorProfile = await doctorService.getDoctorProfileByUserId(req.user!.id);
      const availability = await doctorService.updateAvailability(
        req.params.availabilityId,
        doctorProfile.doctor_id,
        req.body
      );
      res.json({ availability });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/v1/doctor/me/availability/:availabilityId
 * Deactivates (soft-deletes) an availability window.
 */
doctorRouter.delete(
  '/me/availability/:availabilityId',
  requireAuth,
  requireRole('doctor'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorProfile = await doctorService.getDoctorProfileByUserId(req.user!.id);
      await doctorService.removeAvailability(req.params.availabilityId, doctorProfile.doctor_id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/doctor/me/slots
 * Returns the authenticated doctor's own slots for a date range.
 * Query params: from_date, to_date
 */
doctorRouter.get(
  '/me/slots',
  requireAuth,
  requireRole('doctor'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorProfile = await doctorService.getDoctorProfileByUserId(req.user!.id);
      const slots = await doctorService.getSlots(
        doctorProfile.doctor_id,
        req.query.from_date,
        req.query.to_date
      );
      res.json({ slots });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/doctor/me/slots/generate
 * Generates slots from availability for the authenticated doctor.
 * Body: { from_date, to_date }
 */
doctorRouter.post(
  '/me/slots/generate',
  requireAuth,
  requireRole('doctor'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorProfile = await doctorService.getDoctorProfileByUserId(req.user!.id);
      const slots = await doctorService.generateSlots(
        doctorProfile.doctor_id,
        req.body.from_date,
        req.body.to_date
      );
      res.json({ slots });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. PARAMETERIZED ROUTES (/:doctorId) — DEFINED AFTER /me
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/doctor/:doctorId/profile
 * Returns a single doctor profile.
 */
doctorRouter.get(
  '/:doctorId/profile',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctor = await doctorService.getDoctorById(req.params.doctorId);
      res.json({ doctor });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/doctor/:doctorId/slots
 * Returns existing slots for a doctor in a date range.
 * Query params: from_date (YYYY-MM-DD), to_date (YYYY-MM-DD)
 */
doctorRouter.get(
  '/:doctorId/slots',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slots = await doctorService.getSlots(
        req.params.doctorId,
        req.query.from_date,
        req.query.to_date
      );
      res.json({ slots });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/doctor/:doctorId/slots/generate
 * Generates slots for a date range from active availability windows.
 * Body: { from_date, to_date }
 */
doctorRouter.post(
  '/:doctorId/slots/generate',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slots = await doctorService.generateSlots(
        req.params.doctorId,
        req.body.from_date,
        req.body.to_date
      );
      res.json({ slots });
    } catch (err) {
      next(err);
    }
  }
);

export default doctorRouter;
