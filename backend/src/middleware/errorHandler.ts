import { Request, Response, NextFunction } from 'express';
import config from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Centralized API & Database error handling middleware.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = err.statusCode ?? 500;
  let message = err.message || 'Internal Server Error';

  // Handle common PostgreSQL database error codes
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        statusCode = 409;
        message = 'Conflict: Record already exists.';
        break;
      case '23503': // foreign_key_violation
        statusCode = 400;
        message = 'Invalid reference: Related entity does not exist.';
        break;
      case '23502': // not_null_violation
        statusCode = 400;
        message = 'Missing required field.';
        break;
      case 'ECONNREFUSED':
      case '57P01': // admin_shutdown
        statusCode = 503;
        message = 'Database service temporarily unavailable.';
        break;
    }
  }

  // Log in development or error conditions
  if (statusCode >= 500) {
    console.error('[Error Handler]', err);
  }

  res.status(statusCode).json({
    error: message,
    ...(config.nodeEnv === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}
