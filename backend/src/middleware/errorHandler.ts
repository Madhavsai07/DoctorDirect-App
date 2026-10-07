import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  /** Alternative to statusCode used by service-layer thrown errors */
  status?: number;
  code?: string;
  constraint?: string;
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
  let statusCode = err.statusCode ?? err.status ?? 500;
  let message = err.message || 'Internal Server Error';

  // Handle common PostgreSQL database error codes
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        statusCode = 409;
        message = err.constraint?.includes('email')
          ? 'An account with this email already exists. Please sign in instead.'
          : 'Conflict: Record already exists.';
        break;
      case '23503': // foreign_key_violation
        statusCode = 400;
        message = 'Invalid reference: Related entity does not exist.';
        break;
      case '23502': // not_null_violation
        statusCode = 400;
        message = 'Missing required field.';
        break;
      case '22P02': // invalid_text_representation (e.g. invalid UUID format)
        statusCode = 400;
        message = 'Invalid input syntax (e.g. invalid UUID format).';
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
    message = statusCode === 503
      ? 'Service temporarily unavailable. Please try again shortly.'
      : 'An unexpected server error occurred. Please try again.';
  }

  res.status(statusCode).json({
    error: message,
  });
}
