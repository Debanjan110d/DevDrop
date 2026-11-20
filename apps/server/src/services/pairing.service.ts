import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/index.js';
import { generateToken, hashToken } from '../security/tokens.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import qrcode from 'qrcode';
import { getPrimaryLanAddress } from '../discovery/network.js';

export interface PairingSessionResult {
  sessionId: string;
  pairingToken: string;
  expiresAt: number;
  qrCodeDataUrl: string;
  qrPayload: PairingQRPayload;
}

export interface PairingQRPayload {
  version: 1;
  url: string;
  pairingToken: string;
}

export interface PairDeviceParams {
  pairingToken: string;
  deviceName: string;
  platform: string;
}

export interface PairDeviceResult {
  deviceId: string;
  deviceToken: string;
  deviceName: string;
}

/**
 * Create a new pairing session with a QR code.
 */
export async function createPairingSession(): Promise<PairingSessionResult> {
  const now = Date.now();
  // Clean expired sessions
  db.pairingSessions.deleteExpired(now);

  const sessionId = uuidv4();
  const pairingToken = generateToken();
  const tokenHash = hashToken(pairingToken);
  const expiresAt = now + config.pairingExpirySeconds * 1000;

  db.pairingSessions.insert({
    id: sessionId,
    tokenHash,
    expiresAt,
    usedAt: null,
  });

  const lanIp = getPrimaryLanAddress();
  const url = `http://${lanIp}:${config.port}`;
  const pairUrl = `${url}/devices?pair=${pairingToken}`;
  const qrPayload: PairingQRPayload = { version: 1, url, pairingToken };
  const qrCodeDataUrl = await qrcode.toDataURL(pairUrl);

  logger.info(`Pairing session created: ${sessionId}, expires at ${new Date(expiresAt).toISOString()}`);

  return { sessionId, pairingToken, expiresAt, qrCodeDataUrl, qrPayload };
}

/**
 * Complete pairing: validate token, create device record, return device credentials.
 */
export async function pairDevice(params: PairDeviceParams): Promise<PairDeviceResult> {
  const { pairingToken, deviceName, platform } = params;
  const tokenHash = hashToken(pairingToken);
  const now = Date.now();

  const session = db.pairingSessions.findFirst({ tokenHash });

  if (!session) {
    throw Object.assign(new Error('Invalid pairing token'), { statusCode: 401, code: 'INVALID_TOKEN' });
  }

  if (session.expiresAt < now) {
    throw Object.assign(new Error('Pairing token has expired'), { statusCode: 410, code: 'TOKEN_EXPIRED' });
  }

  if (session.usedAt !== null && session.usedAt !== undefined) {
    throw Object.assign(new Error('Pairing token already used'), { statusCode: 409, code: 'TOKEN_USED' });
  }

  // Mark session as used
  db.pairingSessions.markUsed(session.id, now);

  // Create device
  const deviceId = uuidv4();
  const deviceToken = generateToken();
  const deviceTokenHash = hashToken(deviceToken);

  // Auto-deduplicate device name if name already exists
  const existingDevices = db.devices.findMany();
  let finalDeviceName = deviceName.trim() || 'Android Device';
  const duplicates = existingDevices.filter(
    (d) => d.name.toLowerCase() === finalDeviceName.toLowerCase() || d.name.toLowerCase().startsWith(`${finalDeviceName.toLowerCase()} (`)
  );
  if (duplicates.length > 0) {
    finalDeviceName = `${finalDeviceName} (${duplicates.length + 1})`;
  }

  db.devices.insert({
    id: deviceId,
    name: finalDeviceName,
    platform,
    tokenHash: deviceTokenHash,
    pairedAt: now,
    lastSeenAt: now,
    revokedAt: null,
  });

  logger.info(`Device paired: ${deviceId} (${finalDeviceName}, ${platform})`);

  return { deviceId, deviceToken, deviceName: finalDeviceName };
}
