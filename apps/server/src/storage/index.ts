import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { sanitizeFilename, resolveUniqueFilePath } from '../utils/filename.js';

export const STORAGE_DIRS = {
  fromMobile: 'From-Mobile',
  fromPc: 'From-PC',
  temporary: 'Temporary',
  database: 'Database',
  logs: 'Logs',
} as const;

/**
 * Create all required DevDrop storage directories on startup.
 */
export function initStorage(): void {
  const dirs = [
    config.storageDir,
    path.join(config.storageDir, STORAGE_DIRS.fromMobile),
    path.join(config.storageDir, STORAGE_DIRS.fromPc),
    path.join(config.storageDir, STORAGE_DIRS.temporary),
    // Database and Logs are siblings of storageDir under DevDrop root
    path.join(path.dirname(config.storageDir), STORAGE_DIRS.database),
    path.join(path.dirname(config.storageDir), STORAGE_DIRS.logs),
  ];

  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Storage directory ensured: ${dir}`);
  }
}

/**
 * Resolve a safe absolute path within a given base directory.
 * Throws if the resolved path would escape the base directory (path traversal).
 */
export function resolveSafePath(baseDir: string, relativePath: string): string {
  const resolved = path.resolve(baseDir, relativePath);
  const normalizedBase = path.resolve(baseDir);

  if (!resolved.startsWith(normalizedBase + path.sep) && resolved !== normalizedBase) {
    throw new Error(`Path traversal detected: ${relativePath}`);
  }

  return resolved;
}

/**
 * Get a unique file path for storing an incoming file, handling collisions.
 */
export function getIncomingFilePath(direction: 'mobile-to-pc' | 'pc-to-mobile', filename: string): string {
  const safe = sanitizeFilename(filename);
  const subDir = direction === 'mobile-to-pc'
    ? path.join(config.storageDir, STORAGE_DIRS.fromMobile)
    : path.join(config.storageDir, STORAGE_DIRS.fromPc);

  return resolveUniqueFilePath(subDir, safe);
}

/**
 * Get a temporary file path for in-progress uploads.
 */
export function getTempFilePath(transferId: string): string {
  return path.join(config.storageDir, STORAGE_DIRS.temporary, `${transferId}.tmp`);
}
