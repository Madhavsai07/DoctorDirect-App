import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole, requireApprovedDoctor } from '../middleware/auth.middleware';
import { appointmentService } from '../services/appointment.service';

const appointmentRouter = Router();

/**
 * POST /api/v1/appointments/book
 * Books an available slot as a patient.
 * Body: { slot_id, reason_for_visit? }
 */
appointmentRouter.post(
  '/book',
  requireAuth,
  requireRole('patient'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slotId = req.body.slot_id || req.body.slotId;
      const reasonForVisit = req.body.reason_for_visit || req.body.reasonForVisit;
      const appointment = await appointmentService.bookAppointment(
        req.user!.id,
        slotId,
        reasonForVisit
      );
      res.status(201).json({ appointment });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/appointments/patient
 * Lists appointments for authenticated patient.
 * Query: status (upcoming | past | all)
 */
appointmentRouter.get(
  '/patient',
  requireAuth,
  requireRole('patient'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = req.query.status as 'upcoming' | 'past' | 'all' | undefined;
      const appointments = await appointmentService.getPatientAppointments(req.user!.id, filter);
      res.json({ appointments, count: appointments.length });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/appointments/doctor
 * Lists appointments for authenticated doctor.
 * Query: status (upcoming | past | today | all)
 */
appointmentRouter.get(
  '/doctor',
  requireAuth,
  requireRole('doctor'),
  requireApprovedDoctor,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = req.query.status as 'upcoming' | 'past' | 'today' | 'all' | undefined;
      const appointments = await appointmentService.getDoctorAppointments(req.user!.id, filter);
      res.json({ appointments, count: appointments.length });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/appointments/:id
 * Retrieves appointment details with RBAC.
 */
appointmentRouter.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointment = await appointmentService.getAppointmentDetail(
        req.params.id,
        req.user!
      );
      res.json({ appointment });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/appointments/:id/confirm
 * Doctor confirms a booked appointment.
 */
appointmentRouter.patch(
  '/:id/confirm',
  requireAuth,
  requireRole('doctor'),
  requireApprovedDoctor,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointment = await appointmentService.confirmAppointment(
        req.params.id,
        req.user!.id
      );
      res.json({ appointment });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/appointments/:id/status
 * Doctor transitions status (in_progress, completed, cancelled).
 * Body: { status, cancellation_reason? }
 */
appointmentRouter.patch(
  '/:id/status',
  requireAuth,
  requireRole('doctor'),
  requireApprovedDoctor,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, cancellation_reason } = req.body;
      const appointment = await appointmentService.updateDoctorAppointmentStatus(
        req.params.id,
        req.user!.id,
        status,
        cancellation_reason
      );
      res.json({ appointment });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/appointments/:id/cancel
 * Patient or doctor cancels appointment.
 * Body: { cancellation_reason? }
 */
appointmentRouter.patch(
  '/:id/cancel',
  requireAuth,
  requireRole('patient', 'doctor'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { cancellation_reason } = req.body;
      const appointment = await appointmentService.cancelAppointment(
        req.params.id,
        req.user!,
        cancellation_reason
      );
      res.json({ appointment });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/appointments/:id/reschedule
 * Patient reschedules appointment to a new slot.
 * Body: { new_slot_id }
 */
appointmentRouter.patch(
  '/:id/reschedule',
  requireAuth,
  requireRole('patient'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { new_slot_id } = req.body;
      const appointment = await appointmentService.rescheduleAppointment(
        req.params.id,
        new_slot_id,
        req.user!.id
      );
      res.json({ appointment });
    } catch (err) {
      next(err);
    }
  }
);

export default appointmentRouter;
