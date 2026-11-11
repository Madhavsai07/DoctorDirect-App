import express, { Application, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import config from './config/env';
import { createCorsMiddleware } from './middleware/cors.middleware';
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
  app.disable('x-powered-by');

  // ── Middleware ────────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self)');
    if (config.nodeEnv === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });
  app.use(createCorsMiddleware(config.corsOrigins));
  app.use('/api/v1/auth', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
  }));
  app.use('/api/v1', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1200,
    standardHeaders: true,
    legacyHeaders: false,
  }));
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
