import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { prescriptionService } from '../services/prescription.service';

const prescriptionRouter = Router();

/**
 * POST /api/v1/prescriptions
 * Doctor creates a prescription draft for a completed consultation.
 * Body: { consultationId, diagnosis, medicines, generalAdvice? }
 */
prescriptionRouter.post(
  '/',
  requireAuth,
  requireRole('doctor'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorUserId = req.user!.id;
      const { consultationId, diagnosis, medicines, generalAdvice } = req.body;
      if (!consultationId || !diagnosis || !Array.isArray(medicines)) {
        res.status(400).json({ error: 'consultationId, diagnosis and medicines are required' });
        return;
      }
      const prescription = await prescriptionService.createPrescription(
        { consultationId, doctorId: '', patientId: '', diagnosis, medicines, generalAdvice },
        doctorUserId
      );
      // doctorId and patientId will be resolved inside service; placeholders are ignored.
      res.status(201).json({ prescription });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/prescriptions/consultation/:consultationId
 * Doctor or patient fetches prescription for a specific consultation.
 */
prescriptionRouter.get(
  '/consultation/:consultationId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const prescription = await prescriptionService.getPrescriptionByConsultationId(
        req.params.consultationId,
        req.user!
      );
      res.json({ prescription });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/prescriptions/patient/history
 * Patient fetches their completed prescription history.
 */
prescriptionRouter.get(
  '/patient/history',
  requireAuth,
  requireRole('patient'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const prescriptions = await prescriptionService.getPatientPrescriptionHistory(req.user!.id);
      res.json({ prescriptions });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/prescriptions/:id
 * Doctor or patient fetches a prescription.
 */
prescriptionRouter.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const prescription = await prescriptionService.getPrescriptionById(req.params.id, req.user!);
      res.json({ prescription });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/prescriptions/:id
 * Doctor updates a draft prescription (if not finalised).
 */
prescriptionRouter.patch(
  '/:id',
  requireAuth,
  requireRole('doctor'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorUserId = req.user!.id;
      const { diagnosis, medicines, generalAdvice } = req.body;
      const updated = await prescriptionService.updatePrescriptionDraft(
        req.params.id,
        { diagnosis, medicines, generalAdvice },
        doctorUserId
      );
      res.json({ prescription: updated });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/prescriptions/:id/finalize
 * Doctor finalises the prescription – makes it read‑only.
 */
prescriptionRouter.patch(
  '/:id/finalize',
  requireAuth,
  requireRole('doctor'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorUserId = req.user!.id;
      const finalized = await prescriptionService.finalizePrescription(req.params.id, doctorUserId);
      res.json({ prescription: finalized });
    } catch (err) {
      next(err);
    }
  }
);

export default prescriptionRouter;
