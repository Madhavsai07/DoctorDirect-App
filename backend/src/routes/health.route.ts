import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

const healthRouter = Router();

/**
 * GET /health
 *
 * Health check endpoint verifying:
 * 1. Express server is running and accepting HTTP requests.
 * 2. PostgreSQL connection pool is connected and responsive.
 *
 * Implements architecture:
 * Route -> Controller -> Service -> Repository -> PostgreSQL
 */
healthRouter.get('/', (req, res, next) => {
  healthController.check(req, res, next);
});

export default healthRouter;
