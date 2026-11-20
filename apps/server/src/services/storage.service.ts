import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { getTempFilePath, getIncomingFilePath } from '../storage/index.js';
import { logger } from '../utils/logger.js';

export interface StorageWriteResult {
  finalPath: string;
  bytesWritten: number;
}

/**
 * Move a completed temp file to its final destination.
 */
export async function finalizeUpload(
  transferId: string,
  direction: 'mobile-to-pc' | 'pc-to-mobile',
  fileName: string
): Promise<StorageWriteResult> {
  const tempPath = getTempFilePath(transferId);
  const finalPath = getIncomingFilePath(direction, fileName);

  if (!fs.existsSync(tempPath)) {
    throw Object.assign(new Error('Temporary file not found'), {
      statusCode: 404,
      code: 'TEMP_FILE_NOT_FOUND',
    });
  }

  const stats = fs.statSync(tempPath);
  fs.renameSync(tempPath, finalPath);

  logger.info(`File finalized: ${tempPath} → ${finalPath} (${stats.size} bytes)`);

  return { finalPath, bytesWritten: stats.size };
}

/**
 * Stream a file download to the response.
 */
export function streamFileToResponse(filePath: string, res: Response): void {
  if (!fs.existsSync(filePath)) {
    throw Object.assign(new Error('File not found'), { statusCode: 404, code: 'FILE_NOT_FOUND' });
  }

  const stats = fs.statSync(filePath);
  res.setHeader('Content-Length', stats.size);

  const readStream = fs.createReadStream(filePath);
  readStream.on('error', (err) => {
    logger.error('Stream error during download:', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: { code: 'STREAM_ERROR', message: 'Error while streaming file' },
      });
    }
  });

  readStream.pipe(res);
}

/**
 * Delete a temporary file if it exists.
 */
export function cleanupTempFile(transferId: string): void {
  const tempPath = getTempFilePath(transferId);
  if (fs.existsSync(tempPath)) {
    fs.unlinkSync(tempPath);
    logger.info(`Temp file cleaned up: ${tempPath}`);
  }
}
