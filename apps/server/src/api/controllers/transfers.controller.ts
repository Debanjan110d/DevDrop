import { Response, NextFunction } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mime from 'mime-types';
import { sendSuccess, sendError } from '../../utils/response.js';
import { createTransfer, getTransfer, updateTransfer, listTransfers, cancelTransfer } from '../../services/transfer.service.js';
import { finalizeUpload, streamFileToResponse, cleanupTempFile } from '../../services/storage.service.js';
import { getTempFilePath } from '../../storage/index.js';
import { sanitizeFilename, resolveUniqueFilePath } from '../../utils/filename.js';
import { AuthRequest } from '../middleware/auth.js';
import { logger } from '../../utils/logger.js';
import { getIO } from '../../sockets/index.js';
import { config } from '../../config/index.js';
import { db } from '../../database/index.js';

const CreateTransferSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
  direction: z.enum(['pc-to-mobile', 'mobile-to-pc']),
  destinationDeviceId: z.string().min(1),
});

const UpdateTransferSchema = z.object({
  status: z.string().optional(),
  bytesTransferred: z.number().int().nonnegative().optional(),
});

export async function listTransfersHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const transferList = await listTransfers(req.deviceId);
    sendSuccess(res, transferList);
  } catch (err) {
    next(err);
  }
}

export async function createTransferHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = CreateTransferSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
      return;
    }

    // Sanitize filename early
    try {
      sanitizeFilename(parsed.data.fileName);
    } catch (e) {
      sendError(res, 400, 'INVALID_FILENAME', (e as Error).message);
      return;
    }

    const transfer = await createTransfer({
      ...parsed.data,
      sourceDeviceId: req.deviceId || 'pc-host',
      idempotencyKey: (req.headers['idempotency-key'] as string) || undefined,
    });

    const io = getIO();
    if (io) {
      io.emit('transfer:created', transfer);
    }

    sendSuccess(res, transfer, 201);
  } catch (err) {
    next(err);
  }
}

export async function getTransferHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      sendError(res, 400, 'INVALID_ID', 'Transfer ID required');
      return;
    }
    const transfer = await getTransfer(id);
    sendSuccess(res, transfer);
  } catch (err) {
    next(err);
  }
}

export async function updateTransferHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      sendError(res, 400, 'INVALID_ID', 'Transfer ID required');
      return;
    }
    const parsed = UpdateTransferSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
      return;
    }
    const transfer = await updateTransfer(id, parsed.data);
    sendSuccess(res, transfer);
  } catch (err) {
    next(err);
  }
}

export async function cancelTransferHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      sendError(res, 400, 'INVALID_ID', 'Transfer ID required');
      return;
    }
    const transfer = await cancelTransfer(id, req.deviceId || 'pc-host');
    const io = getIO();
    if (io) {
      io.emit('transfer:cancelled', { transferId: id });
    }
    sendSuccess(res, transfer);
  } catch (err) {
    next(err);
  }
}

/**
 * Handle file upload (streaming) for a transfer.
 */
export async function uploadTransferHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      sendError(res, 400, 'INVALID_ID', 'Transfer ID required');
      return;
    }
    const transfer = await getTransfer(id);

    if (transfer.status !== 'pending' && transfer.status !== 'uploading') {
      sendError(res, 409, 'INVALID_STATUS', `Transfer is in '${transfer.status}' state; cannot upload`);
      return;
    }

    // Mark as uploading
    await updateTransfer(transfer.id, { status: 'uploading' });

    const tempPath = getTempFilePath(transfer.id);
    const writeStream = fs.createWriteStream(tempPath);

    req.on('error', async (err) => {
      logger.error('Upload stream error:', err);
      writeStream.destroy();
      cleanupTempFile(transfer.id);
      await updateTransfer(transfer.id, { status: 'failed' }).catch(() => {});
    });

    writeStream.on('error', async (err) => {
      logger.error('Write stream error:', err);
      await updateTransfer(transfer.id, { status: 'failed' }).catch(() => {});
    });

    writeStream.on('finish', async () => {
      try {
        const { finalPath, bytesWritten } = await finalizeUpload(
          transfer.id,
          transfer.direction as 'mobile-to-pc' | 'pc-to-mobile',
          transfer.fileName
        );

        const updated = await updateTransfer(transfer.id, {
          status: 'available',
          storagePath: finalPath,
          bytesTransferred: bytesWritten,
          completedAt: Date.now(),
        });

        const io = getIO();
        if (io) {
          io.emit('transfer:available', updated);
        }

        sendSuccess(res, { transferId: transfer.id, bytesWritten, storagePath: finalPath });
      } catch (err) {
        await updateTransfer(transfer.id, { status: 'failed' }).catch(() => {});
        next(err);
      }
    });

    req.pipe(writeStream);
  } catch (err) {
    next(err);
  }
}

/**
 * Handle file download (streaming) for a transfer.
 */
export async function downloadTransferHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      sendError(res, 400, 'INVALID_ID', 'Transfer ID required');
      return;
    }
    const transfer = await getTransfer(id);

    if (transfer.status !== 'available' && transfer.status !== 'completed' && transfer.status !== 'downloading') {
      sendError(res, 409, 'FILE_NOT_AVAILABLE', `Transfer is in '${transfer.status}' state; file not ready`);
      return;
    }

    if (!transfer.storagePath) {
      sendError(res, 404, 'FILE_NOT_FOUND', 'File path not recorded for this transfer');
      return;
    }

    const mimeType = mime.lookup(transfer.fileName) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(transfer.fileName)}"`);

    // Only transition status if transfer wasn't already completed
    if (transfer.status !== 'completed') {
      await updateTransfer(transfer.id, { status: 'downloading' });

      res.on('finish', async () => {
        await updateTransfer(transfer.id, {
          status: 'completed',
          completedAt: Date.now(),
        }).catch(() => {});
      });
    }

    streamFileToResponse(transfer.storagePath, res);
  } catch (err) {
    next(err);
  }
}

const SendTextSchema = z.object({
  text: z.string().min(1).max(2097152), // up to 2MB text
  destinationDeviceId: z.string().optional(),
});

export async function sendTextHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = SendTextSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Text string is required', parsed.error.flatten());
      return;
    }

    const { text, destinationDeviceId } = parsed.data;
    const id = crypto.randomUUID();
    const isPcToMobile = !req.deviceId || req.deviceId === 'pc-host';
    const targetFolder = isPcToMobile ? 'From-PC' : 'From-Mobile';
    const fileName = `Text-${Date.now()}.txt`;
    const fullPath = path.join(config.storageDir, targetFolder, fileName);

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, text, 'utf8');
    const bytes = Buffer.byteLength(text, 'utf8');

    const transfer = {
      id,
      fileName,
      mimeType: 'text/plain',
      fileSize: bytes,
      direction: (isPcToMobile ? 'pc-to-mobile' : 'mobile-to-pc') as 'pc-to-mobile' | 'mobile-to-pc',
      sourceDeviceId: req.deviceId || 'pc-host',
      destinationDeviceId: destinationDeviceId || 'pc-host',
      status: 'completed',
      storagePath: fullPath,
      bytesTransferred: bytes,
      createdAt: Date.now(),
      completedAt: Date.now(),
    };
    db.transfers.insert(transfer);

    const senderName = isPcToMobile
      ? 'Host PC'
      : (req.deviceId ? db.devices.findFirst({ id: req.deviceId })?.name : null) || 'Mobile Phone';

    const io = getIO();
    if (io) {
      io.emit('transfer:created', transfer);
      io.emit('text:received', {
        id,
        text,
        senderId: req.deviceId || 'pc-host',
        senderName,
        destinationDeviceId: destinationDeviceId || 'all',
        createdAt: Date.now(),
      });
    }

    sendSuccess(res, { id, text, senderName, transfer }, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * Autonomous LAN Direct Text Drop handler (unauthenticated for instant local Wi-Fi drops)
 */
export async function directTextDropHandler(req: any, res: Response, next: NextFunction): Promise<void> {
  try {
    let text = '';
    let senderName = req.headers['x-sender-name'] || 'Nearby Device';

    if (typeof req.body === 'object' && req.body !== null) {
      text = req.body.text || '';
      if (req.body.senderName) {
        senderName = req.body.senderName;
      }
    } else if (typeof req.body === 'string') {
      text = req.body;
    }

    if (!text || !text.trim()) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Text content is required');
      return;
    }

    const trimmedText = text.trim();
    const id = crypto.randomUUID();
    const targetFolder = 'From-Mobile';
    const fileName = `Text-${Date.now()}.txt`;
    const fullPath = path.join(config.storageDir, targetFolder, fileName);

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, trimmedText, 'utf8');
    const bytes = Buffer.byteLength(trimmedText, 'utf8');

    const transfer = {
      id,
      fileName,
      mimeType: 'text/plain',
      fileSize: bytes,
      direction: 'mobile-to-pc' as const,
      sourceDeviceId: 'peer-lan',
      destinationDeviceId: 'pc-host',
      status: 'completed',
      storagePath: fullPath,
      bytesTransferred: bytes,
      createdAt: Date.now(),
      completedAt: Date.now(),
    };
    db.transfers.insert(transfer);

    const io = getIO();
    if (io) {
      io.emit('transfer:created', transfer);
      io.emit('text:received', {
        id,
        text: trimmedText,
        senderId: 'peer-lan',
        senderName: String(senderName),
        destinationDeviceId: 'pc-host',
        createdAt: Date.now(),
      });
    }

    sendSuccess(res, { id, text: trimmedText, senderName, transfer }, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * Autonomous LAN Direct File Drop handler (unauthenticated for instant local Wi-Fi binary streaming)
 */
export async function directFileDropHandler(req: any, res: Response, next: NextFunction): Promise<void> {
  try {
    let rawFileName = (req.headers['x-file-name'] as string) || `devdrop_file_${Date.now()}.bin`;
    try {
      rawFileName = decodeURIComponent(rawFileName);
    } catch {}
    let safeName = 'file.bin';
    try {
      safeName = sanitizeFilename(rawFileName);
    } catch {
      safeName = `devdrop_file_${Date.now()}.bin`;
    }

    const fullDir = path.join(config.storageDir, 'From-Mobile');
    fs.mkdirSync(fullDir, { recursive: true });
    const fullPath = resolveUniqueFilePath(fullDir, safeName);
    const fileName = path.basename(fullPath);

    const writeStream = fs.createWriteStream(fullPath);

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      const stats = fs.statSync(fullPath);
      const id = crypto.randomUUID();
      const mimeType = (req.headers['content-type'] as string) || mime.lookup(fileName) || 'application/octet-stream';

      const transfer = {
        id,
        fileName,
        mimeType,
        fileSize: stats.size,
        direction: 'mobile-to-pc' as const,
        sourceDeviceId: 'peer-lan',
        destinationDeviceId: 'pc-host',
        status: 'completed',
        storagePath: fullPath,
        bytesTransferred: stats.size,
        createdAt: Date.now(),
        completedAt: Date.now(),
      };
      db.transfers.insert(transfer);

      const io = getIO();
      if (io) {
        io.emit('transfer:created', transfer);
        io.emit('transfer:completed', transfer);
      }

      sendSuccess(res, { success: true, fileName, transfer }, 200);
    });

    writeStream.on('error', (err) => {
      try { fs.unlinkSync(fullPath); } catch {}
      next(err);
    });
  } catch (err) {
    next(err);
  }
}

export async function listTextHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const all = db.transfers.findMany();
    const textTransfers = all
      .filter((t) => t.mimeType === 'text/plain' && t.storagePath && fs.existsSync(t.storagePath))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 30);

    const results = textTransfers.map((t) => {
      let content = '';
      try {
        content = fs.readFileSync(t.storagePath!, 'utf8');
      } catch {
        content = '';
      }
      const isPc = t.sourceDeviceId === 'pc-host';
      const senderName = isPc ? 'Host PC' : (db.devices.findFirst({ id: t.sourceDeviceId })?.name || 'Phone');

      return {
        id: t.id,
        text: content,
        fileName: t.fileName,
        senderId: t.sourceDeviceId,
        senderName,
        direction: t.direction,
        createdAt: t.createdAt,
      };
    });

    sendSuccess(res, results);
  } catch (err) {
    next(err);
  }
}
