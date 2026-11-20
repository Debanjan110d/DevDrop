import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess, sendError } from '../../utils/response.js';
import { getDevice, updateDevice, revokeDevice, listDevices } from '../../services/device.service.js';
import { AuthRequest } from '../middleware/auth.js';

const UpdateDeviceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export async function getDeviceHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      sendError(res, 400, 'INVALID_ID', 'Device ID required');
      return;
    }
    const device = await getDevice(id);
    sendSuccess(res, device);
  } catch (err) {
    next(err);
  }
}

export async function updateDeviceHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      sendError(res, 400, 'INVALID_ID', 'Device ID required');
      return;
    }
    const parsed = UpdateDeviceSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
      return;
    }
    const device = await updateDevice(id, parsed.data);
    sendSuccess(res, device);
  } catch (err) {
    next(err);
  }
}

export async function deleteDeviceHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      sendError(res, 400, 'INVALID_ID', 'Device ID required');
      return;
    }
    await revokeDevice(id);
    sendSuccess(res, { message: 'Device revoked successfully' });
  } catch (err) {
    next(err);
  }
}

export async function listDevicesHandler(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const deviceList = await listDevices();
    sendSuccess(res, deviceList);
  } catch (err) {
    next(err);
  }
}
