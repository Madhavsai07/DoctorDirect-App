import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import config from './config/env';
import healthRouter from './routes/health.route';
import patientRouter from './routes/patient.route';
import doctorRouter from './routes/doctor.route';
import { errorHandler } from './middleware/errorHandler';

/**
 * Create and configure the Express application.
 *
 * Route registration follows the pattern:
 *   Route → Controller → Service → Repository → Database
 *
 * Only the /health route is mounted in Milestone 1.
 * Auth, doctor, appointment, consultation, and prescription routes
 * will be added in their respective milestones.
 */
function createApp(): Application {
  const app = express();

  // ── Middleware ────────────────────────────────────────────────────────────
  app.use(cors());
  app.use(express.json());

  // ── Routes ────────────────────────────────────────────────────────────────
  app.use('/health', healthRouter);
  app.use('/api/v1/patient', patientRouter);
  app.use('/api/v1/doctor', doctorRouter);

  // Future routes (added in later milestones):
  // app.use('/api/v1/auth', authRouter);
  // app.use('/api/v1/doctors', doctorRouter);
  // app.use('/api/v1/appointments', appointmentRouter);
  // app.use('/api/v1/consultations', consultationRouter);
  // app.use('/api/v1/prescriptions', prescriptionRouter);
  // app.use('/api/v1/sync', syncRouter);

  // ── 404 handler ──────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response): void => {
    res.status(404).json({ error: 'Route not found' });
  });

  // ── Global error handler ─────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}

export default createApp;
