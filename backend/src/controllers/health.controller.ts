import { Request, Response, NextFunction } from 'express';
import { healthService } from '../services/health.service';

export class HealthController {
  async check(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { statusCode, data } = await healthService.getHealthStatus();
      res.status(statusCode).json(data);
    } catch (err) {
      next(err);
    }
  }
}

export const healthController = new HealthController();
