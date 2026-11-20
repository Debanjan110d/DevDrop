import { Request, Response, NextFunction } from 'express';
import { db } from '../../database/index.js';
import { hashToken } from '../../security/tokens.js';
import { sendError } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';

export interface AuthRequest extends Request {
  deviceId?: string;
  deviceName?: string;
  isLocalHost?: boolean;
}

/**
 * Bearer token authentication middleware.
 * Expects: Authorization: Bearer <token>
 * Automatically grants access to local PC requests (localhost / loopback).
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress;
  const isLoopback = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || req.hostname === 'localhost';
  const authHeader = req.headers.authorization;

  // Local dashboard access on host machine
  if (isLoopback && (!authHeader || authHeader === 'Bearer pc-local')) {
    req.deviceId = 'pc-host';
    req.deviceName = 'PC Host';
    req.isLocalHost = true;
    next();
    return;
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 401, 'UNAUTHORIZED', 'Authorization header missing or invalid');
    return;
  }

  const token = authHeader.slice(7);

  if (!token || token.length < 10) {
    sendError(res, 401, 'UNAUTHORIZED', 'Invalid token format');
    return;
  }

  try {
    const tokenHash = hashToken(token);
    const device = db.devices.findFirst({ tokenHash });

    if (!device) {
      sendError(res, 401, 'UNAUTHORIZED', 'Device not recognized');
      return;
    }

    if (device.revokedAt !== null && device.revokedAt !== undefined) {
      sendError(res, 403, 'DEVICE_REVOKED', 'Device access has been revoked');
      return;
    }

    // Update last_seen_at
    db.devices.update(device.id, { lastSeenAt: Date.now() });

    req.deviceId = device.id;
    req.deviceName = device.name;
    req.isLocalHost = false;

    next();
  } catch (err) {
    logger.error('Auth middleware error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Authentication check failed');
  }
}
