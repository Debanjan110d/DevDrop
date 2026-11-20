import { db } from '../database/index.js';
import { logger } from '../utils/logger.js';
import { isDeviceOnline } from '../sockets/index.js';

export interface DeviceUpdateParams {
  name?: string | undefined;
}

export async function getDevice(deviceId: string) {
  const device = db.devices.findFirst({ id: deviceId });

  if (!device) {
    throw Object.assign(new Error('Device not found'), { statusCode: 404, code: 'DEVICE_NOT_FOUND' });
  }

  return {
    ...device,
    status: isDeviceOnline(device.id) ? 'online' : 'offline',
  };
}

export async function updateDevice(deviceId: string, params: DeviceUpdateParams) {
  const existing = db.devices.findFirst({ id: deviceId });

  if (!existing) {
    throw Object.assign(new Error('Device not found'), { statusCode: 404, code: 'DEVICE_NOT_FOUND' });
  }

  db.devices.update(deviceId, { ...(params.name ? { name: params.name } : {}) });
  logger.info(`Device updated: ${deviceId}`);

  const updated = db.devices.findFirst({ id: deviceId });
  return {
    ...updated!,
    status: isDeviceOnline(deviceId) ? 'online' : 'offline',
  };
}

export async function revokeDevice(deviceId: string) {
  const existing = db.devices.findFirst({ id: deviceId });

  if (!existing) {
    throw Object.assign(new Error('Device not found'), { statusCode: 404, code: 'DEVICE_NOT_FOUND' });
  }

  db.devices.update(deviceId, { revokedAt: Date.now() });
  logger.info(`Device revoked: ${deviceId}`);
}

export async function listDevices() {
  const devices = db.devices.findMany();
  return devices.map((d) => ({
    ...d,
    status: isDeviceOnline(d.id) ? 'online' : 'offline',
  }));
}
