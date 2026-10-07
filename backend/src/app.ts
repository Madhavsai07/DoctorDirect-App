import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import config from './config/env';
import healthRouter from './routes/health.route';
import prescriptionRouter from './routes/prescription.route';
import patientRouter from './routes/patient.route';
import doctorRouter from './routes/doctor.route';
import appointmentRouter from './routes/appointment.route';
import consultationRouter from './routes/consultation.route';
import notificationRouter from './routes/notification.route';
import authRouter from './routes/auth.route';
import adminRouter from './routes/admin.route';
import { errorHandler } from './middleware/errorHandler';

/**
 * Create and configure the Express application.
 */
function createApp(): Application {
  const app = express();

  // ── Middleware ────────────────────────────────────────────────────────────
  app.use(cors());
  app.use(express.json());

  // ── Routes ────────────────────────────────────────────────────────────────
  app.use('/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/patient', patientRouter);
  app.use('/api/v1/doctor', doctorRouter);
  app.use('/api/v1/appointments', appointmentRouter);
  app.use('/api/v1/consultations', consultationRouter);
  app.use('/api/v1/notifications', notificationRouter);
  app.use('/api/v1/admin', adminRouter);

  app.use('/api/v1/prescriptions', prescriptionRouter);

  // ── 404 handler ──────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response): void => {
    res.status(404).json({ error: 'Route not found' });
  });

  // ── Global error handler ─────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}

export default createApp;
