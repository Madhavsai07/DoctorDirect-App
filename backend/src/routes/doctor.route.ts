import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole, requireApprovedDoctor } from '../middleware/auth.middleware';
import { userRepository } from '../repositories/user.repository';
import { doctorService } from '../services/doctor.service';

const doctorRouter = Router();

// GET /api/v1/doctor/specializations — all specializations
doctorRouter.get(
  '/specializations',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await doctorService.getSpecializations();
      res.json({ specializations: data });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/doctor/list — doctor listing with optional search/filter
doctorRouter.get(
  '/list',
  requireAuth,
  requireRole('patient'),
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

// GET /api/v1/doctor/me — authenticated doctor's own profile
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

// GET /api/v1/doctor/me/availability — doctor's availability windows
doctorRouter.get(
  '/me/availability',
  requireAuth,
  requireRole('doctor'),
  requireApprovedDoctor,
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

// POST /api/v1/doctor/me/availability — add availability window
doctorRouter.post(
  '/me/availability',
  requireAuth,
  requireRole('doctor'),
  requireApprovedDoctor,
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

// PATCH /api/v1/doctor/me/availability/:availabilityId — update availability window
doctorRouter.patch(
  '/me/availability/:availabilityId',
  requireAuth,
  requireRole('doctor'),
  requireApprovedDoctor,
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

// DELETE /api/v1/doctor/me/availability/:availabilityId — deactivate availability window
doctorRouter.delete(
  '/me/availability/:availabilityId',
  requireAuth,
  requireRole('doctor'),
  requireApprovedDoctor,
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

// GET /api/v1/doctor/me/slots — doctor's own slots for a date range
doctorRouter.get(
  '/me/slots',
  requireAuth,
  requireRole('doctor'),
  requireApprovedDoctor,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorProfile = await doctorService.getDoctorProfileByUserId(req.user!.id);
      const slots = await doctorService.getSlots(
        doctorProfile.doctor_id,
        req.query.from_date,
        req.query.to_date,
        true
      );
      res.json({ slots });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/doctor/me/slots/generate — generate slots from availability
doctorRouter.post(
  '/me/slots/generate',
  requireAuth,
  requireRole('doctor'),
  requireApprovedDoctor,
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

// GET /api/v1/doctor/me/schedule-overrides — date-specific rules in a range
doctorRouter.get(
  '/me/schedule-overrides',
  requireAuth,
  requireRole('doctor'),
  requireApprovedDoctor,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await doctorService.getDoctorProfileByUserId(req.user!.id);
      const overrides = await doctorService.getScheduleOverrides(
        profile.doctor_id,
        req.query.from_date,
        req.query.to_date
      );
      res.json({ overrides });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/v1/doctor/me/schedule-overrides — replace this date's custom windows or block it
doctorRouter.put(
  '/me/schedule-overrides',
  requireAuth,
  requireRole('doctor'),
  requireApprovedDoctor,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await doctorService.getDoctorProfileByUserId(req.user!.id);
      await doctorService.saveScheduleOverride(profile.doctor_id, req.body);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/doctor/me/schedule-overrides/:date — restore recurring weekly hours
doctorRouter.delete(
  '/me/schedule-overrides/:date',
  requireAuth,
  requireRole('doctor'),
  requireApprovedDoctor,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await doctorService.getDoctorProfileByUserId(req.user!.id);
      await doctorService.deleteScheduleOverride(profile.doctor_id, req.params.date);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/v1/doctor/me/slots/:slotId — edit, block, or restore an unbooked slot
doctorRouter.patch(
  '/me/slots/:slotId',
  requireAuth,
  requireRole('doctor'),
  requireApprovedDoctor,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await doctorService.getDoctorProfileByUserId(req.user!.id);
      const slot = await doctorService.updateSlot(profile.doctor_id, req.params.slotId, req.body);
      res.json({ slot });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/doctor/:doctorId/profile — single doctor profile (defined after /me)
doctorRouter.get(
  '/:doctorId/profile',
  requireAuth,
  requireRole('patient'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctor = await doctorService.getDoctorById(req.params.doctorId);
      res.json({ doctor });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/doctor/:doctorId/slots — slots for a doctor in a date range
doctorRouter.get(
  '/:doctorId/slots',
  requireAuth,
  requireRole('patient'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await doctorService.getDoctorById(req.params.doctorId);
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

// POST /api/v1/doctor/:doctorId/slots/generate — generate slots for a date range
doctorRouter.post(
  '/:doctorId/slots/generate',
  requireAuth,
  requireRole('doctor'),
  requireApprovedDoctor,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorProfile = await doctorService.getDoctorProfileByUserId(req.user!.id);
      if (doctorProfile.doctor_id !== req.params.doctorId) {
        res.status(403).json({ error: 'Doctors may only generate slots for their own profile.' });
        return;
      }
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

export default doctorRouter;
