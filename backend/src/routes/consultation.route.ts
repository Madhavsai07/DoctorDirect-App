import { Router, Request, Response, NextFunction, type RequestHandler } from 'express';
import { requireAuth, requireRole, requireApprovedDoctor } from '../middleware/auth.middleware';
import { consultationService } from '../services/consultation.service';
import { buildIceServers, type IceServerConfiguration } from '../services/ice-servers.service';
import config from '../config/env';
import type { DbUser } from '../repositories/user.repository';
import type { DbConsultationDetail } from '../repositories/consultation.repository';

const consultationRouter = Router();

type ConsultationLookup = (
  consultationId: string,
  user: DbUser
) => Promise<DbConsultationDetail>;

export function createIceServerHandler(
  iceConfiguration: IceServerConfiguration = config,
  getAuthorizedConsultation: ConsultationLookup = (id, user) =>
    consultationService.getConsultationById(id, user),
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    try {
      const consultation = await getAuthorizedConsultation(req.params.consultationId, req.user);
      if (consultation.status !== 'in_progress' || consultation.appointment_status !== 'in_progress') {
        res.status(409).json({ error: 'This consultation is not available for a video call.' });
        return;
      }
      res.set('Cache-Control', 'no-store');
      res.json({ iceServers: buildIceServers(iceConfiguration, req.user.id) });
    } catch (error) {
      next(error);
    }
  };
}

/** Returns ICE configuration only to an authorized participant in an active consultation. */
consultationRouter.get('/video/:consultationId/ice-servers', requireAuth, createIceServerHandler());

/**
 * POST /api/v1/consultations
 * Doctor starts or initializes consultation workspace for an appointment.
 * Transitions appointment from 'confirmed' to 'in_progress'.
 * Body: { appointment_id }
 */
consultationRouter.post(
  '/',
  requireAuth,
  requireRole('doctor'),
  requireApprovedDoctor,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { appointment_id } = req.body;
      if (!appointment_id) {
        res.status(400).json({ error: 'appointment_id is required' });
        return;
      }
      const consultation = await consultationService.startOrGetConsultation(
        appointment_id,
        req.user!.id
      );
      res.status(201).json({ consultation });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/consultations/:appointmentId
 * Fetches consultation details for an appointment.
 * Allowed for the consulting doctor or the patient of that appointment.
 */
consultationRouter.get(
  '/:appointmentId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const consultation = await consultationService.getConsultationByAppointment(
        req.params.appointmentId,
        req.user!
      );
      res.json({ consultation });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/consultations/:id
 * Doctor updates consultation draft notes, diagnosis, and treatment plan.
 * Body: { symptoms?, clinical_notes?, diagnosis?, treatment_plan?, follow_up_instructions?, prescription? }
 */
consultationRouter.patch(
  '/:id',
  requireAuth,
  requireRole('doctor'),
  requireApprovedDoctor,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const consultation = await consultationService.updateConsultationDraft(
        req.params.id,
        req.user!.id,
        req.body
      );
      res.json({ consultation });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/consultations/:id/complete
 * Doctor finalizes and completes the consultation.
 * Transitions both consultation and appointment to 'completed'.
 * Body: { symptoms?, clinical_notes?, diagnosis?, treatment_plan?, follow_up_instructions?, prescription? }
 */
consultationRouter.patch(
  '/:id/complete',
  requireAuth,
  requireRole('doctor'),
  requireApprovedDoctor,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const consultation = await consultationService.completeConsultation(
        req.params.id,
        req.user!.id,
        req.body
      );
      res.json({ consultation });
    } catch (err) {
      next(err);
    }
  }
);

export default consultationRouter;
