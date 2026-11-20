import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/index.js';
import type { Transfer } from '../database/schema.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export interface CreateTransferParams {
  fileName: string;
  mimeType: string;
  fileSize: number;
  direction: 'pc-to-mobile' | 'mobile-to-pc';
  sourceDeviceId: string;
  destinationDeviceId: string;
  idempotencyKey?: string | undefined;
}

export interface UpdateTransferParams {
  status?: string | undefined;
  storagePath?: string | null | undefined;
  bytesTransferred?: number | undefined;
  completedAt?: number | null | undefined;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['uploading', 'cancelled'],
  uploading: ['available', 'failed', 'cancelled'],
  available: ['downloading', 'expired', 'cancelled'],
  downloading: ['completed', 'failed', 'cancelled'],
  completed: [],
  failed: [],
  cancelled: [],
  expired: [],
};

export function isValidTransition(from: string, to: string): boolean {
  return (VALID_TRANSITIONS[from] ?? []).includes(to);
}

export async function createTransfer(params: CreateTransferParams): Promise<Transfer> {
  if (params.fileSize > config.maxFileSize) {
    throw Object.assign(
      new Error(`File size exceeds maximum of ${config.maxFileSize} bytes`),
      { statusCode: 413, code: 'FILE_TOO_LARGE' }
    );
  }

  // Idempotency check
  if (params.idempotencyKey) {
    const existing = db.idempotencyKeys.findFirst({ key: params.idempotencyKey });
    if (existing) {
      const transfer = db.transfers.findFirst({ id: existing.transferId });
      if (transfer) return transfer;
    }
  }

  const transferId = uuidv4();
  const now = Date.now();

  const newTransfer: Transfer = {
    id: transferId,
    fileName: params.fileName,
    mimeType: params.mimeType,
    fileSize: params.fileSize,
    direction: params.direction,
    sourceDeviceId: params.sourceDeviceId,
    destinationDeviceId: params.destinationDeviceId,
    status: 'pending',
    storagePath: null,
    bytesTransferred: 0,
    createdAt: now,
    completedAt: null,
  };

  db.transfers.insert(newTransfer);

  // Store idempotency key
  if (params.idempotencyKey) {
    db.idempotencyKeys.insert({
      key: params.idempotencyKey,
      deviceId: params.sourceDeviceId,
      transferId,
      createdAt: now,
    });
  }

  logger.info(`Transfer created: ${transferId} (${params.direction}, ${params.fileSize} bytes)`);
  return newTransfer;
}

export async function getTransfer(transferId: string): Promise<Transfer> {
  const transfer = db.transfers.findFirst({ id: transferId });

  if (!transfer) {
    throw Object.assign(new Error('Transfer not found'), { statusCode: 404, code: 'TRANSFER_NOT_FOUND' });
  }

  return transfer;
}

export async function updateTransfer(transferId: string, params: UpdateTransferParams): Promise<Transfer> {
  const existing = db.transfers.findFirst({ id: transferId });

  if (!existing) {
    throw Object.assign(new Error('Transfer not found'), { statusCode: 404, code: 'TRANSFER_NOT_FOUND' });
  }

  if (params.status && !isValidTransition(existing.status, params.status)) {
    throw Object.assign(
      new Error(`Invalid status transition: ${existing.status} → ${params.status}`),
      { statusCode: 400, code: 'INVALID_STATUS_TRANSITION' }
    );
  }

  db.transfers.update(transferId, params);
  logger.info(`Transfer ${transferId} updated: ${JSON.stringify(params)}`);

  const updated = db.transfers.findFirst({ id: transferId });
  return updated!;
}

export async function listTransfers(deviceId?: string): Promise<Transfer[]> {
  return db.transfers.findMany(deviceId);
}

export async function cancelTransfer(transferId: string, deviceId: string): Promise<Transfer> {
  const transfer = await getTransfer(transferId);

  if (deviceId !== 'pc-host' && transfer.sourceDeviceId !== deviceId && transfer.destinationDeviceId !== deviceId) {
    throw Object.assign(new Error('Not authorized to cancel this transfer'), {
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  }

  return updateTransfer(transferId, { status: 'cancelled' });
}
