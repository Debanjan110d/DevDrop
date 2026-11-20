import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  logger.error(`[${req.method}] ${req.path} → ${statusCode} ${code}: ${err.message}`);

  if (process.env.NODE_ENV !== 'production') {
    logger.error(err.stack || '');
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: statusCode === 500 ? 'An internal server error occurred' : err.message,
      ...(process.env.NODE_ENV !== 'production' && statusCode === 500
        ? { stack: err.stack }
        : {}),
    },
  });
}
