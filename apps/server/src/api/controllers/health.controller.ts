import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response.js';
import { config, updateStorageDir } from '../../config/index.js';
import { initStorage } from '../../storage/index.js';
import { getPrimaryLanAddress, getLanAddresses } from '../../discovery/network.js';
import { db } from '../../database/index.js';
import { logger } from '../../utils/logger.js';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, { status: 'ok', timestamp: Date.now() });
}

export async function updateStorageDirHandler(req: Request, res: Response): Promise<void> {
  const { storageDir } = req.body;
  if (!storageDir || typeof storageDir !== 'string') {
    sendError(res, 400, 'INVALID_PATH', 'storageDir string is required');
    return;
  }
  try {
    const updated = updateStorageDir(storageDir.trim());
    initStorage();
    sendSuccess(res, { storageDir: updated });
  } catch (err: any) {
    sendError(res, 500, 'STORAGE_UPDATE_FAILED', err?.message || 'Could not update storage directory');
  }
}

export async function getServerInfo(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, {
    name: 'DevDrop',
    version: '1.0.0',
    port: config.port,
    localAddress: `http://localhost:${config.port}`,
    networkAddress: `http://${getPrimaryLanAddress()}:${config.port}`,
    lanAddresses: getLanAddresses().map((a) => a.address),
    storageDir: config.storageDir,
    maxFileSize: config.maxFileSize,
    maxConcurrentTransfers: config.maxConcurrentTransfers,
  });
}

export async function getServerStatus(_req: Request, res: Response): Promise<void> {
  const allTransfers = db.transfers.findMany();
  const activeTransfers = allTransfers.filter((t) => t.status === 'uploading' || t.status === 'downloading');
  const allDevices = db.devices.findMany();

  sendSuccess(res, {
    status: 'running',
    uptime: process.uptime(),
    activeTransfers: activeTransfers.length,
    totalDevices: allDevices.length,
    timestamp: Date.now(),
  });
}

export async function shutdownServerHandler(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, { message: 'DevDrop server is shutting down to conserve resources.' });
  setTimeout(() => {
    logger.info('User requested server shutdown. Shutting down process to release resources.');
    process.exit(0);
  }, 500);
}
