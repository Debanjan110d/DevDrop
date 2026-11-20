import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess, sendError } from '../../utils/response.js';
import { createPairingSession, pairDevice } from '../../services/pairing.service.js';

const PairDeviceSchema = z.object({
  pairingToken: z.string().min(1),
  deviceName: z.string().min(1).max(100),
  platform: z.enum(['android', 'ios', 'windows', 'macos', 'linux', 'web']),
});

export async function createSession(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await createPairingSession();
    sendSuccess(res, {
      sessionId: session.sessionId,
      pairingToken: session.pairingToken,
      expiresAt: session.expiresAt,
      qrCodeDataUrl: session.qrCodeDataUrl,
      qrPayload: session.qrPayload,
    }, 201);
  } catch (err) {
    next(err);
  }
}

export async function completePairing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = PairDeviceSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
      return;
    }

    const result = await pairDevice(parsed.data);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}
